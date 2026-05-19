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
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user, role } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      let photoURL = user.photoURL;

      if (photoFile) {
        const storageRef = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth
      await updateProfile(user, {
        displayName,
        photoURL
      });

      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: displayName,
        photoURL: photoURL
      });

      setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (error: any) {
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
    <div className="space-y-12 pb-20 max-w-4xl mx-auto">
      <header>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Akun Pengguna</span>
        <h2 className="text-on-surface font-display text-4xl font-bold">Profil Saya</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-surface-container-lowest rounded-[40px] p-8 border border-outline-variant/10 shadow-sm text-center">
             <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-full bg-primary-container overflow-hidden ring-4 ring-primary/10">
                   {photoPreview ? (
                     <img src={photoPreview} className="w-full h-full object-cover" alt="Profile" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-display font-bold">
                       {displayName.charAt(0) || user?.email?.charAt(0) || 'A'}
                     </div>
                   )}
                </div>
                <label className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                   <Camera className="w-5 h-5" />
                   <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
             </div>
             
             <h3 className="text-xl font-display font-bold text-on-surface truncate">{displayName || 'User Admin'}</h3>
             <p className="text-sm font-medium text-on-surface-variant opacity-60 truncate">{user?.email}</p>
             
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
          </section>

          <section className="bg-primary/5 rounded-[32px] p-6 border border-primary/10">
             <div className="flex items-center gap-3 mb-4 text-primary">
                <AlertCircle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Informasi Akun</h4>
             </div>
             <p className="text-xs text-on-surface-variant leading-relaxed">
                Anda login sebagai <span className="font-bold">{role?.replace('_', ' ')}</span>. 
                Beberapa fitur akses dibatasi sesuai dengan peran yang diberikan oleh Administrator Utama.
             </p>
          </section>
        </div>

        {/* Right Content: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Form Edit Profil */}
          <section className="bg-surface-container-lowest rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm">
            <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
               <User className="w-6 h-6 text-primary" /> Detail Personal
            </h3>

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
                      className="w-full bg-surface-container rounded-3xl pl-14 pr-6 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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
                      className="w-full bg-surface-container-low rounded-3xl pl-14 pr-6 py-4 font-bold text-on-surface cursor-not-allowed outline-none"
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
          </section>

          {/* Form Ubah Password */}
          <section className="bg-surface-container-lowest rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm border-t-8 border-t-secondary">
             <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
                <Lock className="w-6 h-6 text-secondary" /> Keamanan Akun
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
                        className="w-full bg-surface-container rounded-3xl pl-14 pr-14 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-secondary/10 transition-all"
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
                           className="w-full bg-surface-container rounded-3xl px-6 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-secondary/10 transition-all"
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
                           className="w-full bg-surface-container rounded-3xl px-6 py-4 font-bold text-on-surface outline-none focus:ring-4 focus:ring-secondary/10 transition-all"
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
          className="w-full bg-secondary text-on-secondary-container rounded-3xl py-4 font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl shadow-secondary/20 transition-all disabled:opacity-50"
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
</div>
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
