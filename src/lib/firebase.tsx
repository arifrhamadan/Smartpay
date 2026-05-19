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
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'owner' | 'ketua_unit' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDocFromServer(userDocRef);
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role as any);
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
            } catch (e) {
              console.error("Auto-create role failed:", e);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('staff'); // Fallback to staff if fetch fails
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Registration helper
 */
export const registerUser = async (email: string, pass: string, name: string, role: 'owner' | 'ketua_unit' | 'staff') => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCredential.user, { displayName: name });
  const userDocRef = doc(db, 'users', userCredential.user.uid);
  await setDoc(userDocRef, {
    uid: userCredential.user.uid,
    name,
    email,
    role,
    createdAt: serverTimestamp()
  });
  await signOut(auth);
  return userCredential.user;
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
