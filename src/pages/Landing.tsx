import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { School, User, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { loginUser } from '../lib/firebase';

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Email atau password tidak sesuai.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Bantuan: Silakan aktifkan 'Email/Password' di menu Authentication -> Sign-in Method pada Firebase Console.");
      } else {
        setError("Gagal masuk: " + (err.message || "Silakan coba lagi nanti."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans text-on-surface p-4 bg-surface relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[40px] opacity-40 -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-container/20 blur-[40px] opacity-40 -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[48px] shadow-2xl border border-outline-variant/10">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex p-5 rounded-[28px] bg-primary text-white shadow-xl shadow-primary/30 mb-8"
            >
              <School className="w-12 h-12" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-on-surface tracking-tight mb-3">Selamat Datang</h1>
            <p className="text-on-surface-variant font-medium">Masuk ke Sistem PAUD Smart Education</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-error-container text-error rounded-2xl text-sm font-bold border border-error/10 overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Email Sekolah</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium" 
                  id="email" 
                  name="email" 
                  placeholder="Masukkan email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">Kata Sandi</label>
                <Link to="/forgot-password" size="sm" className="text-primary font-bold text-xs hover:underline">Lupa Password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors" 
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button 
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4.5 bg-primary text-white font-display text-xl font-bold rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mt-8 h-16" 
              type="submit"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-10 text-center text-on-surface-variant font-medium text-sm">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary font-extrabold transition-all duration-300 relative inline-block group hover:text-primary/90 pb-0.5">
              Daftar Sekarang
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
