import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Lock, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useAuth, db, storage, auth as firebaseAuth } from '../lib/firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../lib/utils';
import { TypingText } from '../components/TypingText';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15
    } 
  }
};

// Helper to compress and downscale profile image on the fly (creates an optimized small JPEG under 10KB to prevent storage issues or timeouts)
const compressAndResizeProfileImage = (file: File): Promise<{ blob: Blob, base64: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 160; // Perfect for all avatars (crisp, yet extremely small profile size)
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              resolve({ blob, base64: compressedBase64 });
            } else {
              reject(new Error('Canvas conversion to blob failed'));
            }
          }, 'image/jpeg', 0.7);
        } else {
          reject(new Error('Canvas focus context could not be created'));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function Profile() {
  const { user, role, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Sync with user properties when user state is ready or updated
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
    }
  }, [user]);

  // Password State
  const [passwords, setPasswords] = useState({
    old: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Handle Photo Select: Client-side compression and instant preview feel with zero API delays!
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      setProfileMessage(null);
      try {
        // Compress instantly to ensure tiny file sizes (~8KB)
        const { blob, base64 } = await compressAndResizeProfileImage(file);
        
        // Render instantly in preview area
        setPhotoPreview(base64);
        
        // Stage for actual saving when the user presses "Simpan Perubahan"
        setPendingBlob(blob);
        setPendingBase64(base64);
      } catch (error: any) {
        console.error("Gagal memproses gambar profil:", error);
        setProfileMessage({ type: 'error', text: 'Format gambar tidak didukung atau rusak.' });
      }
    }
  };

  // Saved updates actually processed when the user submits
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      let finalPhotoURL = user.photoURL || '';

      // Perform upload/save only if a dynamic profile image is selected (exactly like paymentService.uploadProof with rapid timeout and full resilient fallback)
      if (pendingBlob && pendingBase64) {
        try {
          finalPhotoURL = await new Promise<string>(async (resolve) => {
            let isSettled = false;
            
            const fallback = () => {
              if (isSettled) return;
              isSettled = true;
              console.warn("Storage upload failed or timeout for profile pictures. Using robust Base64 fallback.");
              resolve(pendingBase64);
            };

            // Fast 5-second timeout for maximum responsiveness in the workspace environment
            const timer = setTimeout(() => {
              fallback();
            }, 5000);

            try {
              const storageRef = ref(storage, `profiles/${user.uid}_profile.jpg`);
              await uploadBytes(storageRef, pendingBlob);
              const downloadURL = await getDownloadURL(storageRef);
              if (!isSettled) {
                clearTimeout(timer);
                isSettled = true;
                resolve(downloadURL);
              }
            } catch (storageError) {
              console.error("Firebase Storage profile upload failed, falling back:", storageError);
              clearTimeout(timer);
              fallback();
            }
          });
        } catch (err) {
          console.warn("Resilient fallback triggered:", err);
          finalPhotoURL = pendingBase64;
        }
      }

      // 1. Update Firebase Auth instance first (this updates user attributes)
      if (firebaseAuth.currentUser) {
        // Firebase Auth restricts photoURL attributes to <2048 characters, throwing (auth/invalid-profile-attribute) for base64 values.
        // We bypass this entirely by keeping the Base64 URL purely in Firestore/cached context, and passing empty string to auth servers.
        const isTooLongVal = finalPhotoURL.startsWith('data:');
        await updateProfile(firebaseAuth.currentUser, {
          displayName,
          photoURL: isTooLongVal ? '' : finalPhotoURL
        });
      }

      // 2. Update Firestore user document with fully specified schema properties to satisfy Firestore security rules
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || '',
        name: displayName,
        role: role || 'staff',
        photoURL: finalPhotoURL
      }, { merge: true }).catch(err => {
        console.warn("Could not save to Firestore document (optional fallback for restricted quota/permissions):", err);
      });

      // 3. Instantly synchronize the auth context state at memory level (so header changes immediately)
      await refreshUser({ displayName, photoURL: finalPhotoURL });
      
      // Clear staged files
      setPendingBlob(null);
      setPendingBase64(null);

      setProfileMessage({ type: 'success', text: 'Profil & foto berhasil diperbarui!' });
    } catch (error: any) {
      console.error("Gagal menyimpan profil:", error);
      setProfileMessage({ type: 'error', text: error.message || 'Gagal memperbarui profil.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (passwords.new !== passwords.confirm) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }

    if (passwords.new.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, passwords.old);
      await reauthenticateWithCredential(user, credential);

      // Update Password
      await updatePassword(user, passwords.new);

      setPasswords({ old: '', new: '', confirm: '' });
      setPasswordMessage({ type: 'success', text: 'Password berhasil diubah!' });
    } catch (error: any) {
      console.error(error);
      setPasswordMessage({ type: 'error', text: error.code === 'auth/wrong-password' ? 'Password lama salah.' : 'Gagal mengubah password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20 max-w-4xl mx-auto"
    >
      <motion.header variants={itemVariants}>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Akun Pengguna</span>
        <h2 className="text-on-surface font-display text-4xl font-bold min-h-[44px]">
          <TypingText text="Profil Saya" />
        </h2>
      </motion.header>

      <div className="grid grid-cols-1 gap-8">
        {/* Unified Profile Card: Merging Photo Selector and Personal Details */}
        <section className="bg-surface-container-lowest rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm">
          <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3 border-b border-outline-variant/5 pb-4">
             <User className="w-6 h-6 text-primary" /> Pengaturan Profil & Foto
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column inside unified card: Avatar display & details */}
            <div className="lg:col-span-1 flex flex-col items-center text-center p-6 bg-surface-container/30 border border-outline-variant/10 rounded-3xl">
               <div className="relative w-32 h-32 mx-auto mb-6 group">
                  <button 
                    type="button"
                    onClick={() => photoPreview && setIsViewerOpen(true)}
                    className={cn(
                      "w-full h-full rounded-full bg-primary-container overflow-hidden ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 text-center flex items-center justify-center select-none outline-none focus:ring-primary/50",
                      photoPreview ? "cursor-pointer hover:scale-105 active:scale-95 duration-200" : "cursor-default"
                    )}
                  >
                     {photoPreview ? (
                       <img src={photoPreview} className="w-full h-full object-cover" alt="Profile" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-display font-bold">
                         {displayName.charAt(0) || user?.email?.charAt(0) || 'A'}
                       </div>
                     )}
                  </button>
                  <label className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-transform">
                     <Camera className="w-5 h-5 animate-pulse" />
                     <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
               </div>
               
               <h3 className="text-xl font-display font-bold text-on-surface truncate w-full max-w-[200px]">{displayName || 'User Admin'}</h3>
               <p className="text-sm font-medium text-on-surface-variant opacity-60 truncate w-full max-w-[200px]">{user?.email}</p>
               
               <div className="flex flex-col items-center gap-2 mt-6">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    role === 'owner' ? "bg-primary/20 text-primary" : 
                    role === 'ketua_unit' ? "bg-secondary/20 text-secondary" :
                    "bg-surface-container-high text-on-surface-variant"
                  )}>
                    Role: {role?.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
               </div>
            </div>

            {/* Right Column inside unified card: Personal Settings Form */}
            <div className="lg:col-span-2">
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-outline uppercase tracking-widest ml-4">Nama Lengkap</label>
                     <div className="relative">
                       <User className="absolute left-5 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                       <input 
                         type="text"
                         value={displayName}
                         onChange={(e) => setDisplayName(e.target.value)}
                         placeholder="Masukkan nama lengkap"
                         className="w-full bg-surface-container rounded-3xl pl-14 pr-6 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm md:text-base"
                         required
                       />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-outline uppercase tracking-widest ml-4">Email (Read Only)</label>
                     <div className="relative opacity-60">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                       <input 
                         type="email"
                         value={user?.email || ''}
                         readOnly
                         className="w-full bg-surface-container-low rounded-3xl pl-14 pr-6 py-4 font-bold text-on-surface cursor-not-allowed outline-none text-sm md:text-base"
                       />
                     </div>
                  </div>

                  {profileMessage && (
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2",
                      profileMessage.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {profileMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <p className="text-sm font-bold">{profileMessage.text}</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full bg-primary text-white rounded-3xl py-4 font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Save className="w-6 h-6" />
                    )}
                    <span>Simpan Perubahan</span>
                  </button>
               </form>
            </div>
          </div>
        </section>

        {/* Informational Box & Password fields */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <section className="lg:col-span-1 bg-primary/5 rounded-[32px] p-6 border border-primary/10">
             <div className="flex items-center gap-3 mb-4 text-primary">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Informasi Akun</h4>
             </div>
             <p className="text-xs text-on-surface-variant leading-relaxed opacity-80">
                Anda login sebagai <span className="font-bold">{role?.replace('_', ' ')}</span>. 
                Beberapa fitur akses dibatasi sesuai dengan peran yang diberikan oleh Administrator Utama.
             </p>
          </section>

          {/* Form Ubah Password */}
          <section className="lg:col-span-2 bg-surface-container-lowest rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm border-t-8 border-t-primary">
             <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary" /> Keamanan Akun
             </h3>

             <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-outline uppercase tracking-widest ml-4">Password Saat Ini</label>
                   <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                      <input 
                        type={showPasswords.old ? "text" : "password"}
                        value={passwords.old}
                        onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-surface-container rounded-3xl pl-14 pr-14 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm md:text-base"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPasswords({...showPasswords, old: !showPasswords.old})}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                      >
                         {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest ml-4">Password Baru</label>
                      <div className="relative">
                         <input 
                           type={showPasswords.new ? "text" : "password"}
                           value={passwords.new}
                           onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                           placeholder="Min. 6 Karakter"
                           className="w-full bg-surface-container rounded-3xl px-6 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm md:text-base"
                           required
                         />
                         <button 
                           type="button" 
                           onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                           className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                         >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest ml-4">Konfirmasi Password</label>
                      <div className="relative">
                         <input 
                           type={showPasswords.confirm ? "text" : "password"}
                           value={passwords.confirm}
                           onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                           placeholder="Ulangi Password"
                           className="w-full bg-surface-container rounded-3xl px-6 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm md:text-base"
                           required
                         />
                         <button 
                           type="button" 
                           onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                           className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                         >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                      </div>
                   </div>
                </div>

                {passwordMessage && (
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl",
                    passwordMessage.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-bold">{passwordMessage.text}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full bg-primary text-white rounded-3xl py-4 font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <RefreshIcon className="w-5 h-5 font-bold" strokeWidth={3} />
                  )}
                  <span>Ganti Password Sistem</span>
                </button>
             </form>
          </section>
        </div>
      </div>

      {/* Lightbox / Foto Profil Viewer Modal */}
      {isViewerOpen && photoPreview && (
        <div 
          onClick={() => setIsViewerOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-2xl w-full bg-surface-container-lowest rounded-[32px] overflow-hidden p-6 border border-outline-variant/10 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button 
              type="button"
              onClick={() => setIsViewerOpen(false)}
              className="absolute top-4 right-4 p-2.5 bg-surface-container rounded-full text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="sr-only">Tutup</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h4 className="font-display font-bold text-lg mb-4 text-on-surface">Foto Profil</h4>
            
            <div className="w-full aspect-square md:max-h-[50vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
              <img src={photoPreview} className="max-w-full max-h-full object-contain" alt="Profile Full Size" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-on-surface text-sm md:text-base">{displayName || 'User Admin'}</p>
                <p className="text-xs text-on-surface-variant opacity-70">{user?.email}</p>
              </div>
              <a 
                href={photoPreview} 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-xs font-bold transition-colors"
              >
                Buka di Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RefreshIcon(props: any) {
return (
<svg 
{...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
