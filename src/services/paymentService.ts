import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  orderBy,
  onSnapshot,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const generateTrxId = () => {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRX-${yearMonth}-${random}`;
};

export const auditLogService = {
  async log(action: string, detail: string) {
    const path = 'audit_logs';
    try {
      const user = auth.currentUser;
      if (!user) return;

      const role = localStorage.getItem('userRole') || 'unknown';
      const name = user.displayName || user.email || 'Anonymous';

      await addDoc(collection(db, path), {
        userId: user.uid,
        userName: name,
        role: role,
        action,
        detail,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to log audit", error);
    }
  },

  async getLogs() {
    const path = 'audit_logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};

export const configService = {
  async getConfig() {
    const docRef = doc(db, 'app_config', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { 
        prices: {
          wisuda: 500000,
          seragam: 350000,
          kegiatan: 200000,
          sosial: 10000
        },
        ...docSnap.data() 
      };
    }
    return { 
      lockedMonths: [], 
      version: '1.2.0',
      prices: {
        wisuda: 500000,
        seragam: 350000,
        kegiatan: 200000,
        sosial: 10000
      }
    };
  },

  async updateConfig(data: any) {
    const docRef = doc(db, 'app_config', 'main');
    await setDoc(docRef, data, { merge: true });
    await auditLogService.log('UPDATE_CONFIG', `System config updated: ${JSON.stringify(data)}`);
  }
};

export const paymentService = {
  uploadProof(file: File, onProgress?: (progress: number) => void) {
    return new Promise<string>(async (resolve, reject) => {
      let isSettled = false;

      const fallbackToBase64 = () => {
        if (isSettled) return;
        isSettled = true;
        
        console.warn("Using Base64 fallback for upload.");
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error("File terlalu besar (maks 5MB)."));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            resolve(reader.result as string);
          } else {
            reject(new Error("Gagal mengonversi file ke format teks."));
          }
        };
        reader.onerror = () => reject(new Error("Gagal membaca file untuk pengiriman alternatif."));
        reader.readAsDataURL(file);
      };

      const timer = setTimeout(() => {
        if (!isSettled) {
          console.warn("Storage upload timed out, forcing fallback...");
          fallbackToBase64();
        }
      }, 10000);

      try {
        const storageRef = ref(storage, `payment_proofs/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (isSettled) return;
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error("Storage upload failed callback:", error);
            clearTimeout(timer);
            fallbackToBase64();
          },
          async () => {
            if (isSettled) return;
            clearTimeout(timer);
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              isSettled = true;
              resolve(downloadURL);
            } catch (error) {
              console.error("Failed to get download URL:", error);
              fallbackToBase64();
            }
          }
        );
      } catch (error) {
        console.error("Initial storage ref/upload failed:", error);
        clearTimeout(timer);
        fallbackToBase64();
      }
    });
  },

  async resetAllPayments() {
    const q = query(collection(db, 'payments'));
    const snapshot = await getDocs(q);
    
    const storageDeletePromises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      if (data.proofUrl) {
        try {
          const fileRef = ref(storage, data.proofUrl);
          await deleteObject(fileRef);
        } catch (error) {
          console.warn("Could not delete storage file:", data.proofUrl, error);
        }
      }
    });
    
    await Promise.all(storageDeletePromises);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    await auditLogService.log('RESET_PAYMENTS', 'All payments have been deleted by admin');
  },

  async addPayment(paymentData: any) {
    const path = 'payments';
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Sesi login tidak ditemukan. Harap login ulang.");
      
      const trxId = generateTrxId();
      const docData = {
        ...paymentData,
        trxId,
        status: 'pending',
        isDeleted: false,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, path), docData);
      await auditLogService.log('CREATE_PAYMENT', `New payment created for ${paymentData.studentName} (${paymentData.month}) - ${trxId}`);
      return docRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updatePaymentStatus(paymentId: string, status: 'approved' | 'rejected', reviewNote?: string) {
    const path = 'payments';
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Sesi login tidak ditemukan. Harap login ulang.");
      
      const paymentRef = doc(db, path, paymentId);
      const updates: any = {
        status,
        updatedAt: serverTimestamp(),
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
      };
      
      if (reviewNote) {
        updates.reviewNote = reviewNote;
      }
      
      await updateDoc(paymentRef, updates);
      await auditLogService.log('UPDATE_PAYMENT_STATUS', `Payment ${paymentId} status updated to ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deletePayment(id: string) {
    const path = 'payments';
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Sesi login tidak ditemukan.");
      
      const paymentRef = doc(db, path, id);
      await updateDoc(paymentRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.uid
      });
      await auditLogService.log('DELETE_PAYMENT', `Payment ${id} soft deleted`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  listenPayments(callback: (payments: any[]) => void) {
    const path = 'payments';
    const q = query(collection(db, path), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};

export const studentService = {
  async addStudent(studentData: any) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      const docData = {
        ...studentData,
        isDeleted: false,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, path), docData);
      await auditLogService.log('CREATE_STUDENT', `New student added: ${studentData.name}`);
      return docRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getStudents() {
    const path = 'students';
    try {
      const q = query(collection(db, path), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  listenStudents(callback: (students: any[]) => void, includeDeleted = false) {
    const path = 'students';
    const q = includeDeleted 
      ? query(collection(db, path), orderBy('createdAt', 'desc'))
      : query(collection(db, path), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
      
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async updateStudent(id: string, data: any) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      const studentRef = doc(db, path, id);
      await updateDoc(studentRef, {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid,
      });
      await auditLogService.log('UPDATE_STUDENT', `Student ${id} updated: ${data.name || 'details'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteStudent(id: string) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      const studentRef = doc(db, path, id);
      await updateDoc(studentRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: auth.currentUser.uid
      });
      await auditLogService.log('DELETE_STUDENT', `Student ${id} soft deleted`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async restoreStudent(id: string) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      const studentRef = doc(db, path, id);
      await updateDoc(studentRef, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      });
      await auditLogService.log('RESTORE_STUDENT', `Student ${id} restored`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async seedStudentsIfEmpty() {
    const students = await this.getStudents();
    if (students && students.length === 0) {
      const demoStudents = [
        { name: 'Aditya Pratama', classId: 'A1', className: 'A1 - Playgroup', nis: '1001', parentName: 'Pratama', monthlyFee: 250000 },
        { name: 'Budi Santoso', classId: 'A1', className: 'A1 - Playgroup', nis: '1002', parentName: 'Santoso', monthlyFee: 250000 },
        { name: 'Citra Lestari', classId: 'B1', className: 'B1 - Kindergarten', nis: '2001', parentName: 'Lestari', monthlyFee: 300000 },
        { name: 'Dedi Kurniawan', classId: 'B1', className: 'B1 - Kindergarten', nis: '2002', parentName: 'Kurniawan', monthlyFee: 300000 },
        { name: 'Eka Putri', classId: 'B2', className: 'B2 - Kindergarten', nis: '2003', parentName: 'Putri', monthlyFee: 300000 },
      ];
      for (const s of demoStudents) {
        await this.addStudent(s);
      }
    }
  }
};
