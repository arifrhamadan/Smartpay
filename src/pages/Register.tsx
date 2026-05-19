import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { School, User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { registerUser } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff' as 'owner' | 'ketua_unit' | 'staff'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan Konfirmasi Password tidak sama.");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(formData.email, formData.password, formData.name, formData.role);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      console.error("Registration failed", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email sudah terdaftar. Silakan gunakan email lain.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Metode login Email/Password belum diaktifkan di Firebase Console.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password terlalu lemah. Gunakan minimal 6 karakter.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Format email tidak valid.");
      } else {
        setError("Registrasi gagal: " + (err.message || "Silakan coba lagi."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[40px] shadow-2xl border border-outline-variant/10">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-[24px] bg-primary/10 text-primary mb-6 ring-8 ring-primary/5 transition-transform hover:scale-110">
              <School className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-on-surface tracking-tight">Daftar Akun</h1>
            <p className="text-on-surface-variant font-medium mt-2">Buat akun PAUD Smart Education Anda</p>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Pendaftaran Berhasil!</h3>
                <p className="text-on-surface-variant mt-2 font-semibold">Akun Anda telah dibuat. Silakan login untuk masuk.</p>
                <p className="text-primary text-xs mt-4 animate-pulse">Mengalihkan ke halaman Login...</p>
              </motion.div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-error-container text-error rounded-xl text-sm font-bold border border-error/10"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-outline">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text"
                      className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-medium"
                      placeholder="Contoh: Aditya Pratama"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-outline">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email"
                      className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-medium"
                      placeholder="email@sekolah.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-outline">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-medium"
                        placeholder="••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Konfirmasi</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-outline">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-medium"
                        placeholder="••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Pilih Peran</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['owner', 'ketua_unit', 'staff'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({...formData, role: r as any})}
                        className={cn(
                          "py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all border-2",
                          formData.role === r 
                            ? "bg-primary/5 border-primary text-primary" 
                            : "bg-surface-container border-transparent text-on-surface-variant"
                        )}
                      >
                        {r.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span>Daftar Sekarang</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-on-surface-variant text-sm font-medium">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
