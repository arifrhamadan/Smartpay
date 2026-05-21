import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, CheckCircle, AlertCircle, History, Landmark, 
  ChevronRight, FileText, UserCheck, Clock, XCircle, 
  Eye, Download, MoreVertical, Plus, Users, Wallet,
  HandCoins, Archive, ShieldCheck, ArrowRight, GraduationCap, School
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { paymentService, studentService } from '../services/paymentService';
import { useAuth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { TypingText } from '../components/TypingText';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// --- Components for different roles ---

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 110,
      damping: 15
    } 
  }
};

function StaffDashboard({ payments, studentCount, user }: { payments: any[], studentCount: number, user: any }) {
  const myPayments = payments
    .filter(p => p.createdBy === user?.uid)
    .slice(0, 5); 
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-secondary font-display text-3xl sm:text-4xl font-bold mb-1 tracking-tight min-h-[44px]">
            <TypingText text={`Halo, ${user?.displayName?.split(' ')[0] || 'Staff'}! 👋`} />
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg font-medium opacity-85 italic">
            Siap melayani pembayaran siswa hari ini?
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Link 
            to="/payments" 
            className="bg-primary text-white w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-[20px] sm:rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-display text-sm sm:text-base">Input Pembayaran</span>
          </Link>
        </motion.div>
      </motion.header>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-5 sm:p-6 md:p-8 rounded-[32px] sm:rounded-[40px] border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-primary/20 hover:scale-[1.01] transition-all duration-300">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
            <Users className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Siswa Aktif</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-on-surface">{studentCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-5 sm:p-6 md:p-8 rounded-[32px] sm:rounded-[40px] border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-orange-500/20 hover:scale-[1.01] transition-all duration-300 border-l-4 border-l-orange-500">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
            <Clock className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">Menunggu Verifikasi</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-on-surface">
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </div>
        <div className="bg-surface-container-lowest p-5 sm:p-6 md:p-8 rounded-[32px] sm:rounded-[40px] border border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-green-500/20 hover:scale-[1.01] transition-all duration-300 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-surface-container-lowest to-green-500/[0.03]">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">Lunas (Sistem)</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-on-surface">
            {payments.filter(p => p.status === 'approved').length}
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-[32px] sm:rounded-[48px] p-5 sm:p-8 md:p-10 border border-outline-variant/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <h3 className="text-on-surface font-display font-bold text-xl sm:text-2xl">Riwayat Input Terakhir</h3>
            <p className="text-xs text-outline font-bold mt-1">Hanya menampilkan 5 transaksi terakhir Anda</p>
          </div>
          <Link to="/reports" className="group flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:underline self-start sm:self-auto transition-colors">
             Lihat Semua <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="space-y-4">
          <AnimatePresence>
            {myPayments.length > 0 ? myPayments.map((p, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={p.id || i} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-container-low/50 hover:bg-surface-container-low hover:translate-x-1 transition-all duration-300"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm font-bold uppercase tracking-tighter shrink-0 select-none">
                       {p.studentName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface text-base sm:text-lg leading-tight truncate">{p.studentName}</p>
                      <p className="text-[10px] text-outline font-black uppercase tracking-widest mt-1">Pembayaran SPP {p.month}</p>
                    </div>
                 </div>
                 <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 w-full sm:w-auto pt-2 sm:pt-0 border-t border-outline-variant/10 sm:border-0">
                    <p className="text-lg sm:text-xl font-display font-bold text-primary">Rp {p.amount.toLocaleString()}</p>
                    <span className={cn(
                      "px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm select-none",
                      p.status === 'pending' ? "bg-orange-100 dark:bg-orange-950/40 text-orange-750 dark:text-orange-300" :
                      p.status === 'approved' ? "bg-green-100 dark:bg-green-950/40 text-green-750 dark:text-green-300" :
                      "bg-red-100 dark:bg-red-950/40 text-red-750 dark:text-red-300"
                    )}>
                      {p.status === 'approved' ? 'Lunas' : p.status === 'pending' ? 'Proses' : 'Ditolak'}
                    </span>
                 </div>
              </motion.div>
            )) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center opacity-40 italic font-medium">Belum ada riwayat input.</motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KetuaUnitDashboard({ payments }: { payments: any[] }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setPendingPayments(payments.filter(p => p.status === 'pending'));
  }, [payments]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await paymentService.updatePaymentStatus(id, status);
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setProcessingId(null);
    }
  };

  // --- Process Data for Charts and Summaries (Approved only) ---
  const approvedPayments = payments.filter(p => p.status === 'approved');
  
  const getCategoryTotal = (category: string) => {
    return approvedPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i.type && i.type.toLowerCase().includes(category.toLowerCase()));
      if (item) return acc + item.amount;
      return acc + (p.type?.toLowerCase() === category.toLowerCase() ? (p.amount || 0) : 0);
    }, 0);
  };

  const totalSPP = getCategoryTotal('spp');
  const totalSosial = getCategoryTotal('sosial');
  const totalWisuda = getCategoryTotal('wisuda');
  const totalIncome = totalSPP + totalSosial + totalWisuda;
  
  // Current month income
  const currentMonthStr = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const currentMonthIncome = approvedPayments
    .filter(p => p.month === currentMonthStr)
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  // Monthly breakdown for selected year
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthlyData = months.map(m => {
    const monthYear = `${m} ${selectedYear}`;
    const monthPayments = approvedPayments.filter(p => p.month === monthYear);
    
    const spp = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i.type && i.type.toLowerCase().includes('spp'));
      return acc + (item ? item.amount : (p.type?.toLowerCase() === 'spp' ? p.amount : 0));
    }, 0);
    
    const sosial = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i.type && i.type.toLowerCase().includes('sosial'));
      return acc + (item ? item.amount : (p.type?.toLowerCase() === 'sosial' ? p.amount : 0));
    }, 0);

    const wisuda = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i.type && i.type.toLowerCase().includes('wisuda'));
      return acc + (item ? item.amount : (p.type?.toLowerCase() === 'wisuda' ? p.amount : 0));
    }, 0);

    return {
      name: m.substring(0, 3),
      SPP: spp,
      Sosial: sosial,
      Wisuda: wisuda,
      Total: spp + sosial + wisuda
    };
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20"
    >
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-secondary font-display text-3xl sm:text-4xl font-bold mb-1 tracking-tight min-h-[44px]">
            <TypingText text="Monitoring Pemasukan 📊" />
          </h2>
          <p className="text-on-surface-variant text-base sm:text-lg font-medium opacity-80 italic">Ringkasan keuangan dan validasi pembayaran Ketua Unit.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container p-2 rounded-2xl shadow-sm border border-outline-variant/10 self-start md:self-auto">
           <Landmark className="w-5 h-5 text-primary ml-2" />
           <select 
             value={selectedYear} 
             onChange={(e) => setSelectedYear(Number(e.target.value))}
             className="bg-transparent font-bold text-sm outline-none pr-4 text-on-surface cursor-pointer"
           >
              {[2024, 2025, 2026].map(y => <option className="bg-surface-container text-on-surface" key={y} value={y}>Tahun {y}</option>)}
           </select>
        </div>
      </motion.header>

      {/* Summary Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
         <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] border border-outline-variant/10 shadow-sm border-b-4 border-b-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
            <div className="flex items-center justify-between gap-2">
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-outline truncate">Total SPP</p>
               <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 opacity-70" />
            </div>
            <h3 className="text-sm min-[375px]:text-base sm:text-lg md:text-xl xl:text-[15px] 2xl:text-lg font-display font-extrabold text-on-surface truncate mt-2" title={`Rp ${totalSPP.toLocaleString()}`}>
               Rp {totalSPP.toLocaleString()}
            </h3>
         </div>
         <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] border border-outline-variant/10 shadow-sm border-b-4 border-b-secondary hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
            <div className="flex items-center justify-between gap-2">
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-outline truncate">Dana Sosial</p>
               <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0 opacity-70" />
            </div>
            <h3 className="text-sm min-[375px]:text-base sm:text-lg md:text-xl xl:text-[15px] 2xl:text-lg font-display font-extrabold text-secondary truncate mt-2" title={`Rp ${totalSosial.toLocaleString()}`}>
               Rp {totalSosial.toLocaleString()}
            </h3>
         </div>
         <div className="bg-surface-container-lowest p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] border border-outline-variant/10 shadow-sm border-b-4 border-b-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[120px]">
            <div className="flex items-center justify-between gap-2">
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-outline truncate">Total Wisuda</p>
               <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0 opacity-70" />
            </div>
            <h3 className="text-sm min-[375px]:text-base sm:text-lg md:text-xl xl:text-[15px] 2xl:text-lg font-display font-extrabold text-blue-600 truncate mt-2" title={`Rp ${totalWisuda.toLocaleString()}`}>
               Rp {totalWisuda.toLocaleString()}
            </h3>
         </div>
         <div className="bg-orange-500 p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:scale-[1.02] hover:bg-orange-600 transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center justify-between gap-2 relative z-10">
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/80 truncate">Pending</p>
               <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90 shrink-0 animate-pulse" />
            </div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-black tracking-tight mt-2 relative z-10">
               {pendingPayments.length}
            </h3>
         </div>
         <div className="bg-green-600 p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] text-white shadow-lg shadow-green-600/20 hover:shadow-xl hover:scale-[1.02] hover:bg-green-700 transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center justify-between gap-2 relative z-10">
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/80 truncate">Approved</p>
               <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90 shrink-0" />
            </div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-black tracking-tight mt-2 relative z-10">
               {approvedPayments.length}
            </h3>
         </div>
         <div className="bg-primary p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] hover:bg-primary-hover transition-all duration-300 flex flex-col justify-between min-h-[100px] sm:min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center justify-between gap-2 relative z-10">
               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/80 truncate">Income {new Date().toLocaleString('id-ID', { month: 'short' })}</p>
               <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90 shrink-0" />
            </div>
            <h3 className="text-sm min-[375px]:text-base sm:text-lg md:text-xl xl:text-[14px] 2xl:text-lg font-display font-extrabold italic mt-2 relative z-10" title={`Rp ${currentMonthIncome.toLocaleString()}`}>
               Rp {currentMonthIncome.toLocaleString()}
            </h3>
         </div>
      </motion.div>

      {/* Chart Section */}
      <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-[32px] sm:rounded-[48px] p-5 sm:p-8 md:p-12 border border-outline-variant/10 shadow-sm shadow-primary/[0.02]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
           <div>
              <h3 className="text-2xl font-display font-bold text-on-surface">Grafik Pemasukan {selectedYear}</h3>
              <p className="text-sm font-medium text-on-surface-variant italic opacity-60">Visualisasi breakdown pemasukan bulanan.</p>
           </div>
           <div className="flex items-center gap-4 text-[10px] font-black text-outline uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary" /> SPP</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-secondary" /> SOSIAL</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /> WISUDA</span>
           </div>
        </div>
        
        <div className="h-96 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                 <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant)" strokeOpacity={0.25} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 900 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--outline)', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                 <RechartsTooltip 
                   cursor={{ fill: 'var(--outline-variant)', opacity: 0.1 }}
                   content={({ active, payload, label }) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-surface-container-highest/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-outline-variant/30 min-w-[200px] text-on-surface">
                            <p className="text-xs font-black uppercase tracking-widest text-outline mb-4">{label} {selectedYear}</p>
                            <div className="space-y-2">
                               {payload.map((entry: any, idx: number) => (
                                 <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                    <span style={{ color: entry.color === 'var(--primary)' ? 'var(--primary)' : entry.color }}>{entry.name}</span>
                                    <span className="text-on-surface">Rp {entry.value.toLocaleString()}</span>
                                 </div>
                               ))}
                               <div className="pt-2 border-t border-outline-variant/20 mt-2 flex justify-between items-center text-primary font-display font-bold">
                                  <span>Total</span>
                                  <span>Rp {payload.reduce((a: number, b: any) => a + b.value, 0).toLocaleString()}</span>
                               </div>
                            </div>
                         </div>
                       );
                     }
                     return null;
                   }}
                 />
                 <Bar dataKey="SPP" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="Sosial" stackId="a" fill="var(--secondary)" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="Wisuda" stackId="a" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Validation Queue SECTION */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-8 px-4">
           <div>
              <h3 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-3">
                 <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500" /> Antrean Validasi
              </h3>
              <p className="text-xs sm:text-sm font-medium text-on-surface-variant italic">Ada {pendingPayments.length} transaksi yang perlu Anda tinjau.</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {pendingPayments.length > 0 ? pendingPayments.map((p) => (
              <motion.div 
                key={p.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] md:rounded-[48px] p-5 sm:p-8 md:p-10 border border-outline-variant/10 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 group hover:shadow-xl hover:border-primary/10 transition-all duration-300"
              >
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
                
                <div className="flex-1 space-y-2 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h4 className="text-xl sm:text-2xl font-display font-bold text-on-surface truncate max-w-full">{p.studentName}</h4>
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-surface-container-high rounded-full text-[9px] sm:text-[10px] font-black text-on-surface-variant uppercase tracking-widest italic shrink-0">
                      {p.month}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-primary">Rp {p.amount.toLocaleString()}</p>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-6 text-[10px] text-outline font-black uppercase tracking-[0.15em] pt-1 sm:pt-2 border-t border-outline-variant/10 md:border-0 md:pt-0">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {(() => {
                        if (!p.createdAt) return '-';
                        const val = p.createdAt.toDate ? p.createdAt.toDate() : (p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt));
                        return isNaN(val.getTime()) ? '-' : val.toLocaleString('id-ID');
                      })()}
                    </span>
                    <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> {p.method}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto pt-4 md:pt-0 border-t border-outline-variant/10 md:border-none">
                  <motion.a 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    href={p.proofUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3 bg-surface-container-high text-on-surface rounded-xl sm:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all cursor-pointer"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Cek Bukti</span>
                  </motion.a>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction(p.id, 'rejected')}
                      disabled={!!processingId}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-error/10 text-error rounded-xl sm:rounded-2xl font-bold flex items-center justify-center hover:bg-error hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                      title="Tolak Transaksi"
                    >
                      <XCircle className="w-5 h-5 mr-1 sm:mr-0 inline sm:block" />
                      <span className="inline sm:hidden text-sm font-bold">Tolak</span>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction(p.id, 'approved')}
                      disabled={!!processingId}
                      className="flex-3 sm:flex-initial px-6 py-3 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {processingId === p.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Validasi</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-container-lowest/50 rounded-[32px] sm:rounded-[60px] p-10 sm:p-24 text-center border-2 border-dashed border-outline-variant/30"
              >
                <Archive className="w-16 h-16 sm:w-20 sm:h-20 text-outline mx-auto mb-4 sm:mb-6 opacity-20" />
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-on-surface">Semua Berhasil Divalidasi</h3>
                <p className="text-on-surface-variant font-medium text-base sm:text-lg mt-2 sm:mt-3 italic opacity-60">Tidak ada antrean pembayaran saat ini.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.div>
  );
}

function OwnerDashboard({ payments, studentCount, totalIncome }: { payments: any[], studentCount: number, totalIncome: number }) {
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const navigate = useNavigate();
  
  // Arrears Logic (Arrears component does it better, but we need high level stats here)
  const [totalArrears, setTotalArrears] = useState(0);
  const [studentArrearsCount, setStudentArrearsCount] = useState(0);
  const [socialFunds, setSocialFunds] = useState(0);
  const [wisudaFunds, setWisudaFunds] = useState(0);

  const exportOversightPDF = () => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('SMART PAY - LAPORAN OVERSIGHT EKSEKUTIF', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Laporan Ringkasan Bisnis & Oversight Keuangan Sekolah (Owner)', 105, 28, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    // Stats Section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Eksekutif:', 20, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 20, 52);
    doc.text(`Total Pendapatan Terverifikasi: Rp ${totalIncome.toLocaleString()}`, 20, 58);
    doc.text(`Jumlah Transaksi Sukses: ${approvedPayments.length}`, 20, 64);
    doc.text(`Siswa Tercover: ${new Set(approvedPayments.map(p => p.studentId)).size} dari ${studentCount} Siswa Aktif`, 20, 70);
    doc.text(`Tingkat Kelunasan SPP: ${percentPaid}%`, 20, 76);
    
    // Detailed breakdown table
    const tableBody = [
      ['Total Pendapatan Terverifikasi (SPP & Dana Lain)', `Rp ${totalIncome.toLocaleString()}`],
      ['Tabungan Kelulusan (Dana Wisuda)', `Rp ${wisudaFunds.toLocaleString()}`],
      ['Dana Sosial & Sosial Hibah', `Rp ${socialFunds.toLocaleString()}`],
      ['Estimasi Piutang/Tunggakan Aktif', `Rp ${totalArrears.toLocaleString()}`],
      ['Jumlah Siswa Menunggak', `${studentArrearsCount} Siswa`],
      ['Rasio Efisiensi Penagihan', `${percentPaid}%`],
    ];

    doc.autoTable({
      startY: 85,
      head: [['Metrik Oversight', 'Nilai Kejadian / Status']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.text('Laporan ini di-generate secara otomatis oleh Sistem SMART PAY untuk Akses Owner.', 105, doc.lastAutoTable.finalY + 15, { align: 'center' });
    
    doc.save(`Laporan_Oversight_Bisnis_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);
  };

  useEffect(() => {
    // Estimasi tunggakan: (Expected per student * 1 month) - (Total approved for current month)
    // Actually, let's just use some logic based on students without approved payments for current month
    const expectedPerStudent = 350000; // SPP + Sos
    const currentMonthPayments = approvedPayments.filter(p => p.month === currentMonth);
    const payingStudentsCount = new Set(currentMonthPayments.map(p => p.studentId)).size;
    
    setStudentArrearsCount(Math.max(0, studentCount - payingStudentsCount));
    setTotalArrears(Math.max(0, (studentCount - payingStudentsCount) * expectedPerStudent));
    setSocialFunds(approvedPayments.reduce((acc, p) => {
      const sosItem = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('sosial'));
      if (sosItem) return acc + (sosItem.amount || 0);
      return acc + (p.type?.toLowerCase() === 'sosial' ? (p.amount || 0) : 0);
    }, 0));
    setWisudaFunds(approvedPayments.reduce((acc, p) => {
      const wisItem = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('wisuda'));
      if (wisItem) return acc + (wisItem.amount || 0);
      return acc + (p.type?.toLowerCase() === 'wisuda' ? (p.amount || 0) : 0);
    }, 0));
  }, [approvedPayments, studentCount, currentMonth]);

  const chartData = React.useMemo(() => {
    const monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthsFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    return Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - idx));
      const mNameFull = monthsFull[d.getMonth()];
      const mNameAbbr = monthsAbbr[d.getMonth()];
      const mYear = d.getFullYear();
      const monthYearStr = `${mNameFull} ${mYear}`;
      
      const monthPayments = approvedPayments.filter(p => p.month === monthYearStr);
      const dbRevenue = monthPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      const baseDemoRevenues = [14200000, 15800000, 18200000, 20100000, 22500000, 24800000];
      const fallbackIdx = (d.getMonth()) % 6;
      const finalRevenue = approvedPayments.length > 0 ? dbRevenue : baseDemoRevenues[fallbackIdx];
      
      return {
        name: mNameAbbr,
        revenue: finalRevenue,
      };
    });
  }, [approvedPayments]);

  const percentPaid = studentCount > 0 ? Math.round(((studentCount - studentArrearsCount) / studentCount) * 100) : 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20 overflow-x-hidden"
    >
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Eksekutif Summary v1.2</span>
           <h2 className="text-on-surface font-display text-4xl sm:text-5xl font-bold tracking-tight min-h-[56px]">
             <TypingText text="Oversight Bisnis" />
           </h2>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
           <motion.button 
             whileHover={{ scale: 1.03 }}
             whileTap={{ scale: 0.98 }}
             onClick={exportOversightPDF}
             className="flex-grow sm:flex-grow-0 justify-center px-4 sm:px-6 py-3 bg-surface-container text-on-surface rounded-2xl font-bold flex items-center gap-3 text-sm hover:bg-surface-container-high transition-all cursor-pointer"
           >
             <Download className="w-5 h-5" /> Cetak PDF
           </motion.button>
           <motion.button 
             whileHover={{ scale: 1.03 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => navigate('/audit-logs')}
             className="flex-grow sm:flex-grow-0 justify-center px-4 sm:px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 text-sm hover:shadow-xl shadow-primary/20 transition-all cursor-pointer"
           >
             <History className="w-5 h-5" /> History Log
           </motion.button>
        </div>
      </motion.header>

      {/* Main KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="lg:col-span-8 bg-primary rounded-[32px] sm:rounded-[48px] md:rounded-[60px] p-6 sm:p-10 md:p-14 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:shadow-primary/20 hover:scale-[1.01] transition-all duration-300"
           onClick={() => navigate('/reports')}
           title="Klik untuk membuka Laporan Lengkap"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10 space-y-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-4 text-white/50">Total Pendapatan Terverifikasi</p>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold tabular-nums tracking-tighter">Rp {totalIncome.toLocaleString()}</h1>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 pt-6 border-t border-white/10">
               <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); navigate('/reports'); }} title="Lihat Laporan Transaksi">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Transaksi Selesai</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold">{approvedPayments.length}</p>
               </div>
               <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); navigate('/arrears'); }} title="Lihat Data Tunggakan">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Siswa Tercover</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold">{new Set(approvedPayments.map(p => p.studentId)).size}</p>
               </div>
               <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); navigate('/reports'); }} title="Lihat Laporan Wisuda">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Total Wisuda</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-amber-300">Rp {wisudaFunds.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Pertumbuhan</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-green-300 font-mono tracking-tighter">+12.5%</p>
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Efisiensi</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-secondary-container">98.2%</p>
               </div>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
           <div 
             onClick={() => navigate('/arrears')}
             className="bg-orange-500 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-5 sm:p-6 md:p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-orange-500/30 transition-all duration-300"
             title="Buka Data Tunggakan Siswa"
           >
              <div>
                <div className="flex justify-between items-center mb-6">
                   <AlertCircle className="w-8 h-8 opacity-40 text-black" />
                   <span className="bg-black/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">At-Risk</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-white/60">Estimasi Tunggakan</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold">Rp {totalArrears.toLocaleString()}</h3>
              </div>
              <p className="text-xs font-bold mt-4 opacity-75 italic underline underline-offset-4 cursor-pointer hover:opacity-100 transition-opacity">
                {studentArrearsCount} Siswa belum bayar bulan ini
              </p>
           </div>
           
           <div 
             onClick={() => navigate('/reports')}
             className="bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-5 sm:p-6 md:p-8 border border-outline-variant/10 shadow-sm flex flex-col justify-between hover:shadow-lg hover:scale-[1.02] cursor-pointer transition-all duration-300"
             title="Buka Laporan Dana Sosial"
           >
              <div>
                <HandCoins className="w-8 h-8 text-secondary mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-outline">Dana Sosial Terkumpul</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-secondary italic">Rp {socialFunds.toLocaleString()}</h3>
              </div>
              <div className="flex items-center gap-2 mt-4">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-surface-container border-2 border-surface-container-lowest" />)}
                 </div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Distribusi Donasi</p>
              </div>
           </div>

           <div 
             onClick={() => navigate('/reports')}
             className="bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-5 sm:p-6 md:p-8 border border-outline-variant/10 shadow-sm flex flex-col justify-between hover:shadow-lg hover:scale-[1.02] cursor-pointer transition-all duration-300"
             title="Buka Laporan Dana Wisuda"
           >
              <div>
                <GraduationCap className="w-8 h-8 text-primary mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-outline">Dana Wisuda Terkumpul</p>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-primary italic">Rp {wisudaFunds.toLocaleString()}</h3>
              </div>
              <div className="flex items-center gap-2 mt-4 font-black text-xs text-primary bg-primary/5 rounded-xl px-3 py-2 w-fit">
                 <School className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[9px] ml-1.5">Tabungan Kelulusan</span>
              </div>
           </div>
        </div>
      </div>

      {/* Secondary Charts & Info */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] md:rounded-[48px] p-5 sm:p-8 md:p-10 border border-outline-variant/10 shadow-sm relative group overflow-hidden shadow-primary/[0.01]">
            <div className="absolute top-0 right-0 p-8">
               <TrendingUp className="w-12 h-12 text-primary opacity-5 group-hover:opacity-20 transition-all duration-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
               <div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-on-surface">Trend Pemasukan</h3>
                  <p className="text-sm font-medium text-on-surface-variant italic opacity-60">Perbandingan volume dana masuk 6 bulan terakhir.</p>
               </div>
               <div className="flex p-1 bg-surface-container rounded-2xl self-start">
                  <button className="px-5 py-2 bg-white dark:bg-surface-container-highest rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm text-on-surface">Monthly</button>
                  <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-outline">Quarterly</button>
               </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant)" strokeOpacity={0.25} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline)', fontSize: 10, fontWeight: 900 }} dy={15} />
                  <YAxis hide />
                  <RechartsTooltip 
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-surface-container-highest/95 backdrop-blur-md text-on-surface p-5 rounded-3xl shadow-2xl border border-outline-variant/30 scale-110 min-w-[130px]">
                            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">{payload[0].payload.name}</p>
                            <p className="text-lg font-display font-bold text-primary">Rp {payload[0].value.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-high rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-6 sm:p-8 flex flex-col items-center text-center justify-center border border-outline-variant/10">
               <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                  <UserCheck className="w-8 h-8 sm:w-10 sm:h-10" />
               </div>
               <h4 className="text-xl sm:text-2xl font-display font-bold">Status Siswa</h4>
               <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-2 mb-8 leading-relaxed opacity-80">Rasio penagihan SPP terhadap jumlah siswa aktif.</p>
               <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percentPaid}%` }} />
               </div>
               <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-outline">
                  <span>Selesai: {studentCount - studentArrearsCount}</span>
                  <span>Target: {studentCount}</span>
               </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-6 sm:p-8 border border-outline-variant/10 shadow-sm flex-1 flex flex-col justify-center">
               <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Quick Insights</p>
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-2 bg-green-500 rounded-full" />
                     <p className="text-sm font-bold text-on-surface">Aliran Kas Stabil (+5%)</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-2 bg-orange-500 rounded-full" />
                     <p className="text-sm font-bold text-on-surface">Reduksi Tunggakan (-2%)</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-2 bg-blue-500 rounded-full" />
                     <p className="text-sm font-bold text-on-surface">Peningkatan Dana Sos (12%)</p>
                  </div>
               </div>
            </div>
         </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const { user, role, loading } = useAuth();

  useEffect(() => {
    studentService.seedStudentsIfEmpty();
    
    const unsubscribePayments = paymentService.listenPayments((data) => {
      const approvedTotal = data
        .filter(p => p.status === 'approved')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
      setTotalIncome(approvedTotal);
      setPayments(data);
    });

    const unsubscribeStudents = studentService.listenStudents((data) => {
      setStudentCount(data.length);
    });

    return () => {
      unsubscribePayments();
      unsubscribeStudents();
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-1000">
      <AnimatePresence mode="wait">
        {role === 'staff' && (
          <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <StaffDashboard payments={payments} studentCount={studentCount} user={user} />
          </motion.div>
        )}
        {role === 'ketua_unit' && (
          <motion.div key="ketua" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <KetuaUnitDashboard payments={payments} />
          </motion.div>
        )}
        {role === 'owner' && (
          <motion.div key="owner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <OwnerDashboard payments={payments} studentCount={studentCount} totalIncome={totalIncome} />
          </motion.div>
        )}
        {!role && user && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-8 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20"></div>
            <div className="text-center">
              <h3 className="text-2xl font-display font-bold text-on-surface">Menyelaraskan Sesi...</h3>
              <p className="text-sm text-on-surface-variant font-medium mt-2">Mempersiapkan hak akses dan dashboard personal Anda.</p>
            </div>
          </div>
        )}
        {!user && !loading && (
           <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
             <Landmark className="w-20 h-20 text-outline opacity-20" />
             <p className="text-xl font-display font-bold text-on-surface">Sesi Berakhir</p>
             <Link to="/login" className="px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all">Kembali ke Login</Link>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
