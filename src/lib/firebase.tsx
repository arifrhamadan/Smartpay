import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth();

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  role: 'owner' | 'ketua_unit' | 'staff' | null;
  loading: boolean;
  refreshUser: (updatedFields?: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true, refreshUser: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'owner' | 'ketua_unit' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      const isNewUser = !lastUidRef.current && firebaseUser;
      const isChangeUser = firebaseUser && lastUidRef.current !== firebaseUser.uid;
      
      if (isNewUser || isChangeUser) {
        setLoading(true);
      }
      
      lastUidRef.current = firebaseUser ? firebaseUser.uid : null;

      if (firebaseUser) {
        // If registering, bypass setting user to prevent automatic login transition
        if (sessionStorage.getItem('is_registering') === 'true') {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }
        // Fetch fast local storage cache for instant layout rendering
        const uid = firebaseUser.uid;
        const cachedName = localStorage.getItem(`smartpay_name_${uid}`) || '';
        const cachedPhoto = localStorage.getItem(`smartpay_photo_${uid}`) || '';
        const cachedRole = localStorage.getItem(`smartpay_role_${uid}`) as any;

        // Immediately set state using fast cached values so dashboard has no flickering/delays
        setUser(createEnrichedUser(firebaseUser, cachedName || undefined, cachedPhoto || undefined));
        if (cachedRole) {
          setRole(cachedRole);
          localStorage.setItem('userRole', cachedRole);
        }

        try {
          const userDocRef = doc(db, 'users', uid);
          // Try retrieving from Firestore
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const fetchedRole = data.role as any;
            const fetchedName = data.name || data.displayName || '';
            const fetchedPhoto = data.photoURL || '';

            setRole(fetchedRole);
            localStorage.setItem(`smartpay_role_${uid}`, fetchedRole);
            localStorage.setItem('userRole', fetchedRole);

            if (fetchedName) localStorage.setItem(`smartpay_name_${uid}`, fetchedName);
            if (fetchedPhoto) localStorage.setItem(`smartpay_photo_${uid}`, fetchedPhoto);

            setUser(createEnrichedUser(firebaseUser, fetchedName, fetchedPhoto));
          } else {
            // Check if we should auto-create (fallback for old users)
            const defaultRole = 'staff';
            try {
              await setDoc(userDocRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'User',
                role: defaultRole,
                createdAt: serverTimestamp()
              }, { merge: true });
              setRole(defaultRole);
              localStorage.setItem(`smartpay_role_${uid}`, defaultRole);
              localStorage.setItem('userRole', defaultRole);
            } catch (e) {
              console.error("Auto-create role failed:", e);
            }
          }
        } catch (error: any) {
          const msg = String(error?.message || error || '').toLowerCase();
          const isQuota = msg.includes('quota') || msg.includes('limit exceeded') || msg.includes('resource exhausted');
          if (isQuota) {
            console.warn("Batas kuota harian database gratis terpenuhi. Berpindah ke Mode Penyimpanan Mandiri.");
            localStorage.setItem('smartpay_quota_exceeded', 'true');
            window.dispatchEvent(new CustomEvent('firestore-quota-status', { detail: { exceeded: true } }));
          } else {
            console.error("Error fetching user role:", error);
          }
          
          if (cachedRole) {
            setRole(cachedRole);
          } else {
            setRole('staff'); // Fallback to staff if fetch fails and no cache
          }
        }
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, refreshUser }}>
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
    await signOut(auth);
  } catch (e) {
    console.error("Logout error", e);
  }
};
