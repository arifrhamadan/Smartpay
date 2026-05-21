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
  setDoc,
  Timestamp
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

export const isQuotaError = (error: any): boolean => {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('quota') || msg.includes('limit exceeded') || msg.includes('resource exhausted');
};

export const getQuotaStatus = () => {
  return localStorage.getItem('smartpay_quota_exceeded') === 'true';
};

export const setQuotaStatus = (exceeded: boolean) => {
  localStorage.setItem('smartpay_quota_exceeded', exceeded ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('firestore-quota-status', { detail: { exceeded } }));
};

const getLocalCache = (key: string): any[] => {
  const data = localStorage.getItem(`smartpay_cache_${key}`);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalCache = (key: string, items: any[]) => {
  localStorage.setItem(`smartpay_cache_${key}`, JSON.stringify(items));
};

const activeStudentListeners = new Set<{ includeDeleted: boolean; callback: (students: any[]) => void }>();
const activePaymentListeners = new Set<(payments: any[]) => void>();

function notifyLocalStudentChange() {
  const cache = getLocalCache('students');
  activeStudentListeners.forEach(item => {
    const filtered = item.includeDeleted ? cache : cache.filter((s: any) => !s.isDeleted);
    item.callback(filtered);
  });
}

function notifyLocalPaymentChange() {
  const cache = getLocalCache('payments');
  const filtered = cache.filter((p: any) => !p.isDeleted);
  activePaymentListeners.forEach(callback => {
    callback(filtered);
  });
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (isQuotaError(error)) {
    setQuotaStatus(true);
    return;
  }
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
      const logData = {
        userId: user.uid,
        userName: name,
        role: role,
        action,
        detail,
        timestamp: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, path), {
          ...logData,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Saving audit log to local cache (quota exceeded)...");
        }
      }

      // Sync local cache
      const cache = getLocalCache('audit_logs');
      cache.unshift({ id: 'local_log_' + Date.now(), ...logData });
      saveLocalCache('audit_logs', cache.slice(0, 100));
    } catch (error) {
      console.error("Failed to log audit", error);
    }
  },

  async getLogs() {
    const path = 'audit_logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalCache('audit_logs', data);
      return data;
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaStatus(true);
        return getLocalCache('audit_logs');
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};

export const configService = {
  async getConfig() {
    const path = 'app_config';
    const defaultValue = { 
      lockedMonths: [], 
      version: '1.2.0',
      prices: {
        wisuda: 500000,
        seragam: 350000,
        kegiatan: 200000,
        sosial: 10000
      }
    };
    try {
      const docRef = doc(db, 'app_config', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const configData = { 
          prices: {
            wisuda: 500000,
            seragam: 350000,
            kegiatan: 200000,
            sosial: 10000
          },
          ...docSnap.data() 
        };
        localStorage.setItem('smartpay_cache_config', JSON.stringify(configData));
        return configData;
      }
      return defaultValue;
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaStatus(true);
        const cached = localStorage.getItem('smartpay_cache_config');
        return cached ? JSON.parse(cached) : defaultValue;
      }
      return defaultValue;
    }
  },

  async updateConfig(data: any) {
    try {
      const docRef = doc(db, 'app_config', 'main');
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      if (isQuotaError(e)) {
        setQuotaStatus(true);
        console.warn("Updating config locally (quota exceeded)...");
      }
    }
    
    const cached = localStorage.getItem('smartpay_cache_config');
    const parsed = cached ? JSON.parse(cached) : {};
    const updated = { ...parsed, ...data };
    localStorage.setItem('smartpay_cache_config', JSON.stringify(updated));
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
    try {
      const q = query(collection(db, 'payments'));
      const snapshot = await getDocs(q);
      
      const storageDeletePromises = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        if (data.proofUrl && !data.proofUrl.startsWith('data:image')) {
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
    } catch (e) {
      console.warn("Reset payments in cloud failed (using local sync)...", e);
    }

    saveLocalCache('payments', []);
    notifyLocalPaymentChange();
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let docRefId = 'local_pay_' + Date.now() + Math.random().toString(36).substr(2, 5);

      try {
        const firestoreData = { 
          ...docData, 
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, path), firestoreData);
        docRefId = docRef.id;
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Adding payment locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('payments');
      const newPayment = { id: docRefId, ...docData };
      cache.unshift(newPayment);
      saveLocalCache('payments', cache);
      notifyLocalPaymentChange();

      await auditLogService.log('CREATE_PAYMENT', `New payment created for ${paymentData.studentName} (${paymentData.month}) - ${trxId}`);
      return { id: docRefId };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updatePaymentStatus(paymentId: string, status: 'approved' | 'rejected', reviewNote?: string) {
    const path = 'payments';
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Sesi login tidak ditemukan. Harap login ulang.");
      
      try {
        if (!paymentId.startsWith('local_')) {
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
        }
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Updating status locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('payments');
      const updatedCache = cache.map((p: any) => 
        p.id === paymentId ? { 
          ...p, 
          status, 
          updatedAt: new Date().toISOString(), 
          approvedBy: currentUser.uid,
          approvedAt: new Date().toISOString(),
          ...(reviewNote && { reviewNote })
        } : p
      );
      saveLocalCache('payments', updatedCache);
      notifyLocalPaymentChange();

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
      
      try {
        if (!id.startsWith('local_')) {
          const paymentRef = doc(db, path, id);
          await updateDoc(paymentRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: currentUser.uid
          });
        }
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Deleting payment locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('payments');
      const updatedCache = cache.map((p: any) => 
        p.id === id ? { ...p, isDeleted: true, deletedAt: new Date().toISOString(), deletedBy: currentUser.uid } : p
      );
      saveLocalCache('payments', updatedCache);
      notifyLocalPaymentChange();

      await auditLogService.log('DELETE_PAYMENT', `Payment ${id} soft deleted`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  listenPayments(callback: (payments: any[]) => void) {
    activePaymentListeners.add(callback);
    
    // Set initial data from local cache first so UI never has a blank screen
    const initialCache = getLocalCache('payments').filter((p: any) => !p.isDeleted);
    callback(initialCache);

    const path = 'payments';
    const q = query(collection(db, path), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
    const unsubscribeFirebase = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalCache('payments', data);
      callback(data);
    }, (error) => {
      if (isQuotaError(error)) {
        setQuotaStatus(true);
        const cache = getLocalCache('payments');
        callback(cache.filter((p: any) => !p.isDeleted));
      } else {
        console.warn("Firestore listenPayments failed:", error);
      }
    });

    return () => {
      activePaymentListeners.delete(callback);
      try {
        unsubscribeFirebase();
      } catch (e) {}
    };
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
        createdAt: new Date().toISOString(),
      };
      
      let docRefId = 'local_' + Date.now() + Math.random().toString(36).substr(2, 5);

      try {
        const firestoreData = { ...docData, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, path), firestoreData);
        docRefId = docRef.id;
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Adding student locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('students');
      const newStudent = { id: docRefId, ...docData };
      cache.unshift(newStudent);
      saveLocalCache('students', cache);
      notifyLocalStudentChange();

      await auditLogService.log('CREATE_STUDENT', `New student added: ${studentData.name}`);
      return { id: docRefId };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getStudents() {
    const path = 'students';
    try {
      const q = query(collection(db, path), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalCache('students', data);
      return data;
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaStatus(true);
        const cache = getLocalCache('students');
        return cache.filter((s: any) => !s.isDeleted);
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  listenStudents(callback: (students: any[]) => void, includeDeleted = false) {
    const pListenerObj = { includeDeleted, callback };
    activeStudentListeners.add(pListenerObj);

    // Initial cache delivery
    const cache = getLocalCache('students');
    callback(includeDeleted ? cache : cache.filter((s: any) => !s.isDeleted));

    const path = 'students';
    const q = includeDeleted 
      ? query(collection(db, path), orderBy('createdAt', 'desc'))
      : query(collection(db, path), where('isDeleted', '==', false), orderBy('createdAt', 'desc'));
      
    const unsubscribeFirebase = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveLocalCache('students', data);
      callback(data);
    }, (error) => {
      if (isQuotaError(error)) {
        setQuotaStatus(true);
        const latestCache = getLocalCache('students');
        callback(includeDeleted ? latestCache : latestCache.filter((s: any) => !s.isDeleted));
      } else {
        console.warn("Firestore listenStudents failed:", error);
      }
    });

    return () => {
      activeStudentListeners.delete(pListenerObj);
      try {
        unsubscribeFirebase();
      } catch (e) {}
    };
  },

  async updateStudent(id: string, data: any) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      
      try {
        if (!id.startsWith('local_')) {
          const studentRef = doc(db, path, id);
          await updateDoc(studentRef, {
            ...data,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser.uid,
          });
        }
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Updating student locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('students');
      const updatedCache = cache.map((s: any) => 
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString(), updatedBy: auth.currentUser?.uid } : s
      );
      saveLocalCache('students', updatedCache);
      notifyLocalStudentChange();

      await auditLogService.log('UPDATE_STUDENT', `Student ${id} updated: ${data.name || 'details'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteStudent(id: string) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      
      try {
        if (!id.startsWith('local_')) {
          const studentRef = doc(db, path, id);
          await updateDoc(studentRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: auth.currentUser.uid
          });
        }
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Deleting student locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('students');
      const updatedCache = cache.map((s: any) => 
        s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString(), deletedBy: auth.currentUser?.uid } : s
      );
      saveLocalCache('students', updatedCache);
      notifyLocalStudentChange();

      await auditLogService.log('DELETE_STUDENT', `Student ${id} soft deleted`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async restoreStudent(id: string) {
    const path = 'students';
    try {
      if (!auth.currentUser) throw new Error("Sesi login tidak ditemukan.");
      
      try {
        if (!id.startsWith('local_')) {
          const studentRef = doc(db, path, id);
          await updateDoc(studentRef, {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null
          });
        }
      } catch (e) {
        if (isQuotaError(e)) {
          setQuotaStatus(true);
          console.warn("Restoring student locally (quota exceeded)...");
        } else {
          throw e;
        }
      }

      // Sync local cache
      const cache = getLocalCache('students');
      const updatedCache = cache.map((s: any) => 
        s.id === id ? { ...s, isDeleted: false, deletedAt: null, deletedBy: null } : s
      );
      saveLocalCache('students', updatedCache);
      notifyLocalStudentChange();

      await auditLogService.log('RESTORE_STUDENT', `Student ${id} restored`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async seedStudentsIfEmpty() {
    const students = await this.getStudents();
    if (!students || students.length === 0) {
      const demoStudents = [
        { name: 'Aditya Pratama', classId: 'A1', className: 'A1 - Playgroup', nis: '1001', parentName: 'Pratama', monthlyFee: 250000, studentType: 'Murid Lama', meetingPackage: '12x' },
        { name: 'Budi Santoso', classId: 'A1', className: 'A1 - Playgroup', nis: '1002', parentName: 'Santoso', monthlyFee: 250000, studentType: 'Murid Lama', meetingPackage: '12x' },
        { name: 'Citra Lestari', classId: 'B1', className: 'B1 - Kindergarten', nis: '2001', parentName: 'Lestari', monthlyFee: 300000, studentType: 'Murid Lama', meetingPackage: '16x' },
        { name: 'Dedi Kurniawan', classId: 'B1', className: 'B1 - Kindergarten', nis: '2002', parentName: 'Kurniawan', monthlyFee: 300000, studentType: 'Murid Lama', meetingPackage: '16x' },
        { name: 'Eka Putri', classId: 'B2', className: 'B2 - Kindergarten', nis: '2003', parentName: 'Putri', monthlyFee: 300000, studentType: 'Murid Lama', meetingPackage: '16x' },
      ];
      for (const s of demoStudents) {
        await this.addStudent(s);
      }
    }
  }
};

function parseTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object') {
    if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
      return new Timestamp(obj.seconds, obj.nanoseconds);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = parseTimestamps(obj[key]);
      }
    }
  }
  return obj;
}

export const backupRestoreService = {
  async exportBackup() {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const logsSnapshot = await getDocs(collection(db, 'audit_logs'));
      const audit_logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        students,
        payments,
        audit_logs
      };
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaStatus(true);
        return {
          version: '1.2.0',
          exportedAt: new Date().toISOString(),
          students: getLocalCache('students'),
          payments: getLocalCache('payments'),
          audit_logs: getLocalCache('audit_logs')
        };
      }
      console.error("Export backup failed:", error);
      throw error;
    }
  },

  async restoreBackup(backupData: any) {
    try {
      if (!backupData || typeof backupData !== 'object') {
        throw new Error("Format file backup tidak valid.");
      }

      await auditLogService.log('RESTORE_BACKUP', 'Database restored from JSON backup file');

      // 1. Restore Students
      if (Array.isArray(backupData.students)) {
        saveLocalCache('students', backupData.students);
        notifyLocalStudentChange();
        for (const s of backupData.students) {
          const { id, ...data } = s;
          if (id && !id.startsWith('local_')) {
            const parsedData = parseTimestamps(data);
            try {
              await setDoc(doc(db, 'students', id), parsedData);
            } catch (e) {
              if (isQuotaError(e)) setQuotaStatus(true);
            }
          }
        }
      }

      // 2. Restore Payments
      if (Array.isArray(backupData.payments)) {
        saveLocalCache('payments', backupData.payments);
        notifyLocalPaymentChange();
        for (const p of backupData.payments) {
          const { id, ...data } = p;
          if (id && !id.startsWith('local_')) {
            const parsedData = parseTimestamps(data);
            try {
              await setDoc(doc(db, 'payments', id), parsedData);
            } catch (e) {
              if (isQuotaError(e)) setQuotaStatus(true);
            }
          }
        }
      }

      // 3. Restore Audit Logs
      if (Array.isArray(backupData.audit_logs)) {
        saveLocalCache('audit_logs', backupData.audit_logs);
        for (const l of backupData.audit_logs) {
          const { id, ...data } = l;
          if (id && !id.startsWith('local_')) {
            const parsedData = parseTimestamps(data);
            try {
              await setDoc(doc(db, 'audit_logs', id), parsedData);
            } catch (e) {
              if (isQuotaError(e)) setQuotaStatus(true);
            }
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Restore backup failed:", error);
      throw error;
    }
  }
};
