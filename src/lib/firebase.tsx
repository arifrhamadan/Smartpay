import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth();

// Configure robust auth session persistence across mobile, PWA, and desktop screens
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[AUTH PERSISTENCE] Gagal menyeting browser local persistence:", err);
});

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  role: 'owner' | 'ketua_unit' | 'staff' | null;
  loading: boolean;
  error: string | null;
  refreshUser: (updatedFields?: { displayName?: string; photoURL?: string }) => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  role: null, 
  loading: true, 
  error: null,
  refreshUser: async () => {},
  refreshRole: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'owner' | 'ketua_unit' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUidRef = React.useRef<string | null>(null);

  // Helper inside AuthProvider to construct an enriched user clone with Firestore/cached fields
  const createEnrichedUser = (firebaseUser: User | null, firestoreName?: string, firestorePhoto?: string): User | null => {
    if (!firebaseUser) return null;
    return {
      ...firebaseUser,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firestoreName !== undefined ? firestoreName : (firebaseUser.displayName || ''),
      photoURL: firestorePhoto !== undefined ? firestorePhoto : (firebaseUser.photoURL || ''),
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber,
      isAnonymous: firebaseUser.isAnonymous,
      metadata: firebaseUser.metadata,
      providerData: firebaseUser.providerData,
      tenantId: firebaseUser.tenantId,
      getIdToken: firebaseUser.getIdToken ? firebaseUser.getIdToken.bind(firebaseUser) : undefined,
      getIdTokenResult: firebaseUser.getIdTokenResult ? firebaseUser.getIdTokenResult.bind(firebaseUser) : undefined,
      reload: firebaseUser.reload ? firebaseUser.reload.bind(firebaseUser) : undefined,
      toJSON: firebaseUser.toJSON ? firebaseUser.toJSON.bind(firebaseUser) : undefined,
    } as unknown as User;
  };

  const refreshUser = async (updatedFields?: { displayName?: string; photoURL?: string }) => {
    if (auth.currentUser) {
      try {
        // Run reload with a fast timeout (1500ms) to ensure it doesn't hang in restricted sandboxes
        await Promise.race([
          auth.currentUser.reload(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Reload timeout')), 1500))
        ]).catch(err => console.warn("Firebase user reload timed out or failed:", err));
      } catch (e) {
        console.warn("Ignored reload error:", e);
      }
      
      const updatedUser = auth.currentUser;
      const uid = updatedUser.uid;

      // Persist fields in secure local storage cache for instant responsive client load
      if (updatedFields?.displayName !== undefined) {
        localStorage.setItem(`smartpay_name_${uid}`, updatedFields.displayName);
      }
      if (updatedFields?.photoURL !== undefined) {
        localStorage.setItem(`smartpay_photo_${uid}`, updatedFields.photoURL);
      }

      const cachedName = localStorage.getItem(`smartpay_name_${uid}`) || '';
      const cachedPhoto = localStorage.getItem(`smartpay_photo_${uid}`) || '';

      const displayNameVal = updatedFields?.displayName !== undefined 
        ? updatedFields.displayName 
        : (cachedName || updatedUser.displayName || '');

      const photoURLVal = updatedFields?.photoURL !== undefined 
        ? updatedFields.photoURL 
        : (cachedPhoto || updatedUser.photoURL || '');

      setUser(createEnrichedUser(updatedUser, displayNameVal, photoURLVal));
    }
  };

  const refreshRole = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setRole(null);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    const uid = firebaseUser.uid;

    try {
      console.log(`[AUTH DEBUG] Manual refresh of role initiated for UID: ${uid}`);
      const userDocRef = doc(db, 'users', uid);
      
      const userDoc = await Promise.race([
        getDoc(userDocRef),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
      ]) as any;
      
      if (userDoc && userDoc.exists()) {
        const data = userDoc.data();
        const fetchedRole = data.role as any;
        const fetchedName = data.name || data.displayName || '';
        const fetchedPhoto = data.photoURL || '';

        if (fetchedRole) {
          setRole(fetchedRole);
          localStorage.setItem(`smartpay_role_${uid}`, fetchedRole);
          localStorage.setItem('userRole', fetchedRole);
        } else {
          throw new Error("Hak akses (role) tidak terdefinisi pada profil database Anda.");
        }

        if (fetchedName) localStorage.setItem(`smartpay_name_${uid}`, fetchedName);
        if (fetchedPhoto) localStorage.setItem(`smartpay_photo_${uid}`, fetchedPhoto);

        setUser(createEnrichedUser(firebaseUser, fetchedName, fetchedPhoto));
        setError(null);
      } else {
        const cachedRole = localStorage.getItem(`smartpay_role_${uid}`) as any;
        if (cachedRole) {
          setRole(cachedRole);
          setError(null);
        } else {
          setRole(null);
          throw new Error("Profil Anda belum terdaftar di database. Silakan hubungi admin sekolah (Owner).");
        }
      }
    } catch (err: any) {
      console.error("[AUTH DEBUG] Gagal menyegarkan sesi per pengguna:", err);
      const cachedRole = localStorage.getItem(`smartpay_role_${uid}`) as any;
      if (err?.message === 'timeout' && cachedRole) {
        console.warn("[AUTH DEBUG] Connection timeout during refreshRole, using cached role.");
        setRole(cachedRole);
        setError(null);
      } else {
        setError(err?.message || "Koneksi database terganggu atau ijin akses ditolak silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(`[AUTH DEBUG] onAuthStateChanged triggered. User: ${firebaseUser?.email || 'None'}`);
      
      if (!firebaseUser) {
        // No user logged in, check if guest session exists
        const cachedGuestStr = localStorage.getItem('smartpay_guest_user');
        if (cachedGuestStr) {
          try {
            const guest = JSON.parse(cachedGuestStr);
            setUser({
              uid: guest.uid,
              email: guest.email,
              displayName: guest.displayName,
              photoURL: guest.photoURL || '',
              emailVerified: true,
              phoneNumber: null,
              isAnonymous: false,
              metadata: {},
              providerData: [],
            } as any);
            setRole(guest.role);
            localStorage.setItem('userRole', guest.role);
            setError(null);
          } catch (e) {
            setUser(null);
            setRole(null);
            localStorage.removeItem('userRole');
          }
        } else {
          setUser(null);
          setRole(null);
          localStorage.removeItem('userRole');
        }
        setLoading(false);
        return;
      }

      // If registering, bypass setting user to prevent automatic login transition
      if (sessionStorage.getItem('is_registering') === 'true') {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const uid = firebaseUser.uid;
      setLoading(true);
      setError(null);

      // Fetch fast local storage cache for instant layout rendering
      const cachedName = localStorage.getItem(`smartpay_name_${uid}`) || '';
      const cachedPhoto = localStorage.getItem(`smartpay_photo_${uid}`) || '';
      const cachedRole = localStorage.getItem(`smartpay_role_${uid}`) as any;

      // Immediately set state using fast cached values so dashboard has no flickering/delays
      setUser(createEnrichedUser(firebaseUser, cachedName || undefined, cachedPhoto || undefined));
      if (cachedRole) {
        setRole(cachedRole);
        localStorage.setItem('userRole', cachedRole);
        console.log(`[AUTH DEBUG] Loaded cachedRole immediately: ${cachedRole}`);
      }

      try {
        const userDocRef = doc(db, 'users', uid);
        
        // Race the Firestore query with a 3500ms timeout
        const userDoc = await Promise.race([
          getDoc(userDocRef),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]) as any;
        
        if (userDoc && userDoc.exists()) {
          const data = userDoc.data();
          const fetchedRole = data.role as any;
          const fetchedName = data.name || data.displayName || '';
          const fetchedPhoto = data.photoURL || '';

          console.log(`[ROLE DEBUG] Fetched profile from Firestore. UID: ${uid}, Fetched Role: ${fetchedRole}`);

          if (fetchedRole) {
            setRole(fetchedRole);
            localStorage.setItem(`smartpay_role_${uid}`, fetchedRole);
            localStorage.setItem('userRole', fetchedRole);
          } else {
            throw new Error("Hak akses (role) tidak terdefinisi pada profil database Anda.");
          }

          if (fetchedName) localStorage.setItem(`smartpay_name_${uid}`, fetchedName);
          if (fetchedPhoto) localStorage.setItem(`smartpay_photo_${uid}`, fetchedPhoto);

          setUser(createEnrichedUser(firebaseUser, fetchedName, fetchedPhoto));
          setError(null);
        } else {
          console.warn(`[ROLE DEBUG] User document not found in Firestore for UID: ${uid}. Checking cachedRole:`, cachedRole);
          if (cachedRole) {
            setRole(cachedRole);
            setError(null);
          } else {
            setRole(null);
            throw new Error("Profil Anda belum terdaftar di database. Silakan hubungi admin sekolah (Owner).");
          }
        }
      } catch (error: any) {
        const msg = String(error?.message || error || '').toLowerCase();
        const isQuota = msg.includes('quota') || msg.includes('limit exceeded') || msg.includes('resource exhausted');
        
        if (error?.message === 'timeout' && cachedRole) {
          console.warn("[ROLE DEBUG] Firestore getDoc timed out, falling back to cache.");
          setRole(cachedRole);
          setError(null);
        } else if (isQuota) {
          console.warn("Batas kuota harian database gratis terpenuhi. Berpindah ke Mode Penyimpanan Mandiri.");
          localStorage.setItem('smartpay_quota_exceeded', 'true');
          window.dispatchEvent(new CustomEvent('firestore-quota-status', { detail: { exceeded: true } }));
          
          if (cachedRole) {
            setRole(cachedRole);
            setError(null);
          } else {
            setRole(null);
            setError("Batas kuota harian database gratis terpenuhi & tidak ada sesi lokal tersimpan.");
          }
        } else {
          console.error(`[ROLE DEBUG] Error fetching user role from Firestore:`, error);
          if (cachedRole) {
            setRole(cachedRole);
            setError(null); // Bypass error screen since cache is perfectly functional!
          } else {
            setError(error?.message || "Koneksi database terganggu atau ijin akses ditolak silakan coba lagi.");
            setRole(null);
          }
        }
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, error, refreshUser, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Registration helper
 */
export const registerUser = async (email: string, pass: string, name: string, role: 'owner' | 'ketua_unit' | 'staff') => {
  sessionStorage.setItem('is_registering', 'true');
  console.log(`[ROLE DEBUG] registerUser triggered. Email: ${email}, Name: ${name}, Role chosen: ${role}`);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    try {
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        name,
        email,
        role,
        createdAt: serverTimestamp()
      });
      console.log(`[ROLE DEBUG] User document stored in Firestore with role: ${role}`);
    } catch (error) {
      console.warn("Could not save registered user to cloud due to quota or other error:", error);
      const msg = String(error?.message || error || '').toLowerCase();
      if (msg.includes('quota') || msg.includes('limit exceeded') || msg.includes('resource exhausted')) {
        localStorage.setItem('smartpay_quota_exceeded', 'true');
        window.dispatchEvent(new CustomEvent('firestore-quota-status', { detail: { exceeded: true } }));
      }
    }
    localStorage.setItem(`smartpay_role_${userCredential.user.uid}`, role);
    localStorage.setItem('userRole', role);
    console.log(`[ROLE DEBUG] Registration successful. Cached user role local storage values: ${role}`);
    await signOut(auth);
    return userCredential.user;
  } finally {
    sessionStorage.removeItem('is_registering');
  }
};

/**
 * Password reset helper
 */
export const forgotPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Login helper
 */
export const loginUser = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

/**
 * Logout helper
 */
export const logoutUser = async () => {
  try {
    localStorage.removeItem('smartpay_guest_user');
    await signOut(auth);
  } catch (e) {
    console.error("Logout error", e);
  }
};
