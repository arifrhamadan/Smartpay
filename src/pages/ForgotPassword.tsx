import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { School, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../lib/firebase';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Reset failed", err);
      setError("Gagal mengirim email reset. Pastikan email terdaftar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[40px] shadow-2xl border border-outline-variant/10">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-3xl bg-secondary-container/30 text-secondary mb-6">
              <School className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-on-surface">Lupa Password?</h1>
            <p className="text-on-surface-variant font-medium mt-2">Masukkan email Anda untuk menerima instruksi reset password.</p>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-on-surface">Email Terkirim!</h3>
                <p className="text-on-surface-variant mt-2 mb-8">Silakan periksa kotak masuk atau folder spam email Anda.</p>
                <Link to="/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </Link>
              </motion.div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-4 bg-error-container text-error rounded-xl text-sm font-bold border border-error/10">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest ml-1">Email Anda</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email"
                      className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-medium"
                      placeholder="email@sekolah.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  type="submit"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Kirim Instruksi Reset"}
                </motion.button>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-on-surface-variant hover:text-primary font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Batal dan Kembali
                  </Link>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
