import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, CheckCircle, AlertCircle, History, Landmark, 
  ChevronRight, FileText, UserCheck, Clock, XCircle, 
  Eye, Download, MoreVertical, Plus, Users, Wallet,
  HandCoins, Archive, ShieldCheck, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { paymentService, studentService } from '../services/paymentService';
import { useAuth } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

// --- Components for different roles ---

function StaffDashboard({ payments, studentCount, user }: { payments: any[], studentCount: number, user: any }) {
  const myPayments = payments
    .filter(p => p.createdBy === user?.uid)
    .slice(0, 5); 
  
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-secondary font-display text-4xl font-bold mb-1 tracking-tight">Halo, {user?.displayName?.split(' ')[0] || 'Staff'}! 👋</h2>
          <p className="text-on-surface-variant text-lg font-medium opacity-80 italic">Siap melayani pembayaran siswa hari ini?</p>
        </div>
        <Link 
          to="/payments" 
          className="bg-primary text-white px-8 py-4 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.05] transition-all"
        >
          <Plus className="w-6 h-6" />
          <span className="font-display">Input Pembayaran</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[40px] border border-outline-variant/10 shadow-sm hover:shadow-xl transition-all">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
            <Users className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Siswa Aktif</p>
          <p className="text-3xl md:text-4xl font-display font-bold text-on-surface">{studentCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[40px] border border-outline-variant/10 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-orange-500">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 mb-6">
            <Clock className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">Menunggu Verifikasi</p>
          <p className="text-3xl md:text-4xl font-display font-bold text-on-surface">
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[40px] border border-outline-variant/10 shadow-sm hover:shadow-xl transition-all bg-gradient-to-br from-white to-green-50/30 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-6">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] mb-1">Lunas (Sistem)</p>
          <p className="text-3xl md:text-4xl font-display font-bold text-on-surface">
            {payments.filter(p => p.status === 'approved').length}
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-[48px] p-10 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-on-surface font-display font-bold text-2xl">Riwayat Input Terakhir</h3>
            <p className="text-xs text-outline font-bold mt-1">Hanya menampilkan 5 transaksi terakhir Anda</p>
          </div>
          <Link to="/reports" className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:underline">
             Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {myPayments.length > 0 ? myPayments.map((p, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-surface-container-low/50 hover:bg-surface-container-low transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm font-bold uppercase tracking-tighter">
                     {p.studentName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-lg leading-tight">{p.studentName}</p>
                    <p className="text-[10px] text-outline font-black uppercase tracking-widest mt-1">Pembayaran SPP {p.month}</p>
                  </div>
               </div>
               <div className="flex items-center justify-between md:justify-end gap-10">
                  <p className="text-xl font-display font-bold text-primary">Rp {p.amount.toLocaleString()}</p>
                  <span className={cn(
                    "px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                    p.status === 'pending' ? "bg-orange-100 text-orange-700" :
                    p.status === 'approved' ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {p.status === 'approved' ? 'Lunas' : p.status === 'pending' ? 'Proses' : 'Ditolak'}
                  </span>
               </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-40 italic font-medium">Belum ada riwayat input.</div>
          )}
        </div>
      </div>
    </div>
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
      const item = p.paymentItems?.find((i: any) => i.type.toLowerCase().includes(category.toLowerCase()));
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
      const item = p.paymentItems?.find((i: any) => i.type.toLowerCase().includes('spp'));
      return acc + (item ? item.amount : (p.type?.toLowerCase() === 'spp' ? p.amount : 0));
    }, 0);
    
    const sosial = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i.type.toLowerCase().includes('sosial'));
      return acc + (item ? item.amount : (p.type?.toLowerCase() === 'sosial' ? p.amount : 0));
    }, 0);

    const wisuda = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i.type.toLowerCase().includes('wisuda'));
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
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-secondary font-display text-4xl font-bold mb-1 tracking-tight">Monitoring Pemasukan 📊</h2>
          <p className="text-on-surface-variant text-lg font-medium opacity-80 italic">Ringkasan keuangan dan validasi pembayaran Ketua Unit.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container p-2 rounded-2xl shadow-sm border border-outline-variant/10">
           <Landmark className="w-5 h-5 text-primary ml-2" />
           <select 
             value={selectedYear} 
             onChange={(e) => setSelectedYear(Number(e.target.value))}
             className="bg-transparent font-bold text-sm outline-none pr-4"
           >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>Tahun {y}</option>)}
           </select>
        </div>
      </header>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
         <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm border-b-4 border-b-primary">
            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-2">Total SPP</p>
            <h3 className="text-xl font-display font-bold text-on-surface">Rp {totalSPP.toLocaleString()}</h3>
         </div>
         <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm border-b-4 border-b-secondary">
            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-2">Dana Sosial</p>
            <h3 className="text-xl font-display font-bold text-secondary">Rp {totalSosial.toLocaleString()}</h3>
         </div>
         <div className="bg-surface-container-lowest p-6 rounded-[32px] border border-outline-variant/10 shadow-sm border-b-4 border-b-blue-500">
            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-2">Total Wisuda</p>
            <h3 className="text-xl font-display font-bold text-blue-600">Rp {totalWisuda.toLocaleString()}</h3>
         </div>
         <div className="bg-orange-500 p-6 rounded-[32px] text-white shadow-lg shadow-orange-500/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Pending</p>
            <h3 className="text-2xl font-display font-bold">{pendingPayments.length}</h3>
         </div>
         <div className="bg-green-600 p-6 rounded-[32px] text-white shadow-lg shadow-green-600/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Approved</p>
            <h3 className="text-2xl font-display font-bold">{approvedPayments.length}</h3>
         </div>
         <div className="bg-primary p-6 rounded-[32px] text-white shadow-lg shadow-primary/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-2">Income {new Date().toLocaleString('id-ID', { month: 'short' })}</p>
            <h3 className="text-xl font-display font-bold italic">Rp {currentMonthIncome.toLocaleString()}</h3>
         </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-container-lowest rounded-[48px] p-8 md:p-12 border border-outline-variant/10 shadow-sm">
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
                 <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                 <RechartsTooltip 
                   cursor={{ fill: 'transparent' }}
                   content={({ active, payload, label }) => {
                     if (active && payload && payload.length) {
                       return (
                         <div className="bg-white p-6 rounded-3xl shadow-2xl border border-outline-variant/10 min-w-[200px]">
                            <p className="text-xs font-black uppercase tracking-widest text-outline mb-4">{label} {selectedYear}</p>
                            <div className="space-y-2">
                               {payload.map((entry: any, idx: number) => (
                                 <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                    <span style={{ color: entry.color }}>{entry.name}</span>
                                    <span>Rp {entry.value.toLocaleString()}</span>
                                 </div>
                               ))}
                               <div className="pt-2 border-t border-outline-variant/10 mt-2 flex justify-between items-center text-primary font-display font-bold">
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
                 <Bar dataKey="SPP" stackId="a" fill="#65528A" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="Sosial" stackId="a" fill="#006A60" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="Wisuda" stackId="a" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Validation Queue SECTION */}
      <section>
        <div className="flex items-center justify-between mb-8 px-4">
           <div>
              <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                 <ShieldCheck className="w-8 h-8 text-orange-500" /> Antrean Validasi
              </h3>
              <p className="text-sm font-medium text-on-surface-variant italic">Ada {pendingPayments.length} transaksi yang perlu Anda tinjau.</p>
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
                className="bg-surface-container-lowest rounded-[48px] p-8 md:p-10 border border-outline-variant/10 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-2xl transition-all"
              >
                <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-10 h-10" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-2xl font-display font-bold text-on-surface">{p.studentName}</h4>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-black text-on-surface-variant uppercase tracking-widest italic">
                      {p.month}
                    </span>
                  </div>
                  <p className="text-3xl font-display font-bold text-primary">Rp {p.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-6 text-[10px] text-outline font-black uppercase tracking-[0.15em] pt-2">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(p.createdAt?.toDate()).toLocaleString()}</span>
                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> {p.method}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <a 
                    href={p.proofUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full sm:w-auto px-10 py-5 bg-surface-container-high rounded-3xl text-on-surface font-bold text-lg flex items-center justify-center gap-3 hover:bg-surface-container-highest transition-all"
                  >
                    <Eye className="w-6 h-6" />
                    <span>Cek Bukti</span>
                  </a>
                  <button 
                    onClick={() => handleAction(p.id, 'rejected')}
                    disabled={!!processingId}
                    className="w-full sm:w-auto p-5 bg-error/10 text-error rounded-3xl font-bold flex items-center justify-center hover:bg-error hover:text-white transition-all disabled:opacity-50"
                    title="Tolak Transaksi"
                  >
                    <XCircle className="w-7 h-7" />
                  </button>
                  <button 
                    onClick={() => handleAction(p.id, 'approved')}
                    disabled={!!processingId}
                    className="w-full sm:w-auto px-12 py-5 bg-primary text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50"
                  >
                    {processingId === p.id ? (
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShieldCheck className="w-7 h-7" />
                        <span>Validasi</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="bg-surface-container-lowest/50 rounded-[60px] p-24 text-center border-2 border-dashed border-outline-variant/30">
                <Archive className="w-20 h-20 text-outline mx-auto mb-6 opacity-20" />
                <h3 className="text-3xl font-display font-bold text-on-surface">Semua Berhasil Divalidasi</h3>
                <p className="text-on-surface-variant font-medium text-lg mt-3 italic opacity-60">Tidak ada antrean pembayaran saat ini.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function OwnerDashboard({ payments, studentCount, totalIncome }: { payments: any[], studentCount: number, totalIncome: number }) {
  const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const approvedPayments = payments.filter(p => p.status === 'approved');
  
  // Arrears Logic (Arrears component does it better, but we need high level stats here)
  const [totalArrears, setTotalArrears] = useState(0);
  const [studentArrearsCount, setStudentArrearsCount] = useState(0);
  const [socialFunds, setSocialFunds] = useState(0);

  useEffect(() => {
    // Estimasi tunggakan: (Expected per student * 1 month) - (Total approved for current month)
    // Actually, let's just use some logic based on students without approved payments for current month
    const expectedPerStudent = 350000; // SPP + Sos
    const currentMonthPayments = approvedPayments.filter(p => p.month === currentMonth);
    const payingStudentsCount = new Set(currentMonthPayments.map(p => p.studentId)).size;
    
    setStudentArrearsCount(Math.max(0, studentCount - payingStudentsCount));
    setTotalArrears(Math.max(0, (studentCount - payingStudentsCount) * expectedPerStudent));
    setSocialFunds(approvedPayments.reduce((acc, p) => {
      const sosItem = p.paymentItems?.find((i: any) => i.type.toLowerCase().includes('sosial'));
      if (sosItem) return acc + sosItem.amount;
      return acc + (p.type === 'sosial' ? (p.amount || 0) : 0);
    }, 0));
  }, [approvedPayments, studentCount, currentMonth]);

  const chartData = [
    { name: 'Jan', revenue: 14200000 },
    { name: 'Feb', revenue: 15800000 },
    { name: 'Mar', revenue: 18200000 },
    { name: 'Apr', revenue: 20100000 },
    { name: 'Mei', revenue: 22500000 },
    { name: 'Jun', revenue: totalIncome || 0 },
  ];

  return (
    <div className="space-y-12 pb-20 overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Eksekutif Summary v1.2</span>
           <h2 className="text-on-surface font-display text-5xl font-bold tracking-tight">Oversight Bisnis</h2>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-surface-container rounded-2xl font-bold flex items-center gap-3 text-sm hover:bg-surface-container-high transition-all">
             <Download className="w-5 h-5" /> Cetak PDF
           </button>
           <button className="px-6 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 text-sm hover:shadow-xl shadow-primary/20 transition-all">
             <History className="w-5 h-5" /> History Log
           </button>
        </div>
      </header>

      {/* Main KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="lg:col-span-8 bg-primary rounded-[48px] md:rounded-[60px] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10 space-y-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-4 text-white/50">Total Pendapatan Terverifikasi</p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tabular-nums tracking-tighter">Rp {totalIncome.toLocaleString()}</h1>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-6 border-t border-white/10">
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Transaksi Selesai</p>
                  <p className="text-lg md:text-xl font-bold">{approvedPayments.length}</p>
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Siswa Tercover</p>
                  <p className="text-lg md:text-xl font-bold">{new Set(approvedPayments.map(p => p.studentId)).size}</p>
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Pertumbuhan</p>
                  <p className="text-lg md:text-xl font-bold text-green-300 font-mono tracking-tighter">+12.5%</p>
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Efisiensi</p>
                  <p className="text-lg md:text-xl font-bold text-secondary-container">98.2%</p>
               </div>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
           <div className="bg-orange-500 rounded-[32px] md:rounded-[48px] p-6 md:p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                   <AlertCircle className="w-8 h-8 opacity-40 text-black" />
                   <span className="bg-black/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">At-Risk</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-white/60">Estimasi Tunggakan</p>
                <h3 className="text-2xl md:text-3xl font-display font-bold">Rp {totalArrears.toLocaleString()}</h3>
              </div>
              <p className="text-xs font-bold mt-4 opacity-75 italic underline underline-offset-4 cursor-pointer hover:opacity-100 transition-opacity">
                {studentArrearsCount} Siswa belum bayar bulan ini
              </p>
           </div>
           
           <div className="bg-surface-container-lowest rounded-[32px] md:rounded-[48px] p-6 md:p-8 border border-outline-variant/10 shadow-sm flex flex-col justify-between">
              <div>
                <HandCoins className="w-8 h-8 text-secondary mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-outline">Dana Sosial Terkumpul</p>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-secondary italic">Rp {socialFunds.toLocaleString()}</h3>
              </div>
              <div className="flex items-center gap-2 mt-4">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-surface-container border-2 border-white" />)}
                 </div>
                 <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Distribusi Donasi</p>
              </div>
           </div>
        </div>
      </div>

      {/* Secondary Charts & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-surface-container-lowest rounded-[56px] p-10 md:p-14 border border-outline-variant/10 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
               <TrendingUp className="w-12 h-12 text-primary opacity-5 group-hover:opacity-20 transition-all duration-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
               <div>
                  <h3 className="text-3xl font-display font-bold text-on-surface">Trend Pemasukan</h3>
                  <p className="text-sm font-medium text-on-surface-variant italic opacity-60">Perbandingan volume dana masuk 6 bulan terakhir.</p>
               </div>
               <div className="flex p-1 bg-surface-container rounded-2xl self-start">
                  <button className="px-5 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Monthly</button>
                  <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-outline">Quarterly</button>
               </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#65528A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#65528A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} dy={15} />
                  <YAxis hide />
                  <RechartsTooltip 
                    cursor={{ stroke: '#65528A', strokeWidth: 2, strokeDasharray: '5 5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-primary text-white p-5 rounded-3xl shadow-2xl border-none outline-none scale-110">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">{payload[0].payload.name}</p>
                            <p className="text-lg font-bold">Rp {payload[0].value.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#65528A" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-high rounded-[48px] p-8 flex flex-col items-center text-center justify-center border border-outline-variant/10">
               <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                  <UserCheck className="w-10 h-10" />
               </div>
               <h4 className="text-2xl font-display font-bold">Status Siswa</h4>
               <p className="text-sm font-medium text-on-surface-variant mt-2 mb-8 leading-relaxed opacity-80">Rasio penagihan SPP terhadap jumlah siswa aktif.</p>
               <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary" style={{ width: `${Math.round(((studentCount - studentArrearsCount) / studentCount) * 100)}%` }} />
               </div>
               <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-outline">
                  <span>Selesai: {studentCount - studentArrearsCount}</span>
                  <span>Target: {studentCount}</span>
               </div>
            </div>

            <div className="bg-white rounded-[48px] p-8 border border-outline-variant/10 shadow-sm flex-1 flex flex-col justify-center">
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
      </div>
    </div>
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
