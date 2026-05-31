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
import { useAuth, logoutUser } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { SummaryCardsSection, InteractiveDashboardChart } from '../components/DashboardChartsAndCards';
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
      <div className="flex justify-end mb-6">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Link 
            to="/payments" 
            className="bg-primary text-white w-full md:w-auto px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="font-display">Input Pembayaran</span>
          </Link>
        </motion.div>
      </div>

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
  const navigate = useNavigate();

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
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes(category.toLowerCase()));
      if (item) return acc + (item.amount || 0);
      return acc + (p.type?.toLowerCase().includes(category.toLowerCase()) ? (p.amount || 0) : 0);
    }, 0);
  };

  const totalSPP = getCategoryTotal('spp');
  const totalSosial = getCategoryTotal('sosial');
  const totalWisuda = getCategoryTotal('wisuda');
  const totalCuti = getCategoryTotal('cuti');
  
  const cutiPayments = approvedPayments.filter(p => p.type?.toLowerCase() === 'cuti' || p.paymentItems?.some((i: any) => i && i.type && i.type.toLowerCase().includes('cuti')));
  const cutiSiswaCount = new Set(cutiPayments.map(p => p.studentId)).size;

  const currentMonthStr = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const currentMonthIncome = approvedPayments
    .filter(p => p.month === currentMonthStr)
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20"
    >


      {/* Summary Cards Grid */}
      <motion.div variants={itemVariants}>
        <SummaryCardsSection 
          totalSPP={totalSPP}
          totalSosial={totalSosial}
          totalWisuda={totalWisuda}
          totalCuti={totalCuti}
          cutiSiswaCount={cutiSiswaCount}
          pendingCount={pendingPayments.length}
          approvedCount={approvedPayments.length}
          currentMonthIncome={currentMonthIncome}
          navigate={navigate}
        />
      </motion.div>

      {/* Chart Section */}
      <motion.div variants={itemVariants}>
         <InteractiveDashboardChart 
           approvedPayments={approvedPayments}
           selectedYear={selectedYear}
           setSelectedYear={setSelectedYear}
         />
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Arrears Logic (Arrears component does it better, but we need high level stats here)
  const [totalArrears, setTotalArrears] = useState(0);
  const [studentArrearsCount, setStudentArrearsCount] = useState(0);

  const getCategoryTotal = (category: string) => {
    return approvedPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes(category.toLowerCase()));
      if (item) return acc + (item.amount || 0);
      return acc + (p.type?.toLowerCase().includes(category.toLowerCase()) ? (p.amount || 0) : 0);
    }, 0);
  };

  const totalSPP = getCategoryTotal('spp');
  const totalSosial = getCategoryTotal('sosial');
  const totalWisuda = getCategoryTotal('wisuda');
  const totalCuti = getCategoryTotal('cuti');
  
  const cutiPayments = approvedPayments.filter(p => p.type?.toLowerCase() === 'cuti' || p.paymentItems?.some((i: any) => i && i.type && i.type.toLowerCase().includes('cuti')));
  const cutiSiswaCount = new Set(cutiPayments.map(p => p.studentId)).size;
  
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const approvedCount = approvedPayments.length;
  
  const currentMonthStr = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const currentMonthIncome = approvedPayments
    .filter(p => p.month === currentMonthStr)
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const percentPaid = studentCount > 0 ? Math.round(((studentCount - studentArrearsCount) / studentCount) * 100) : 0;

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
    doc.text(`Total Pendapatan Terverifikasi: Rp ${totalIncome.toLocaleString('id-ID')}`, 20, 58);
    doc.text(`Jumlah Transaksi Sukses: ${approvedPayments.length}`, 20, 64);
    doc.text(`Siswa Tercover: ${new Set(approvedPayments.map(p => p.studentId)).size} dari ${studentCount} Siswa Aktif`, 20, 70);
    doc.text(`Tingkat Kelunasan SPP: ${percentPaid}%`, 20, 76);
    
    // Detailed breakdown table
    const tableBody = [
      ['Total Pendapatan Terverifikasi (SPP & Dana Lain)', `Rp ${totalIncome.toLocaleString('id-ID')}`],
      ['Pemasukan SPP Utama', `Rp ${totalSPP.toLocaleString('id-ID')}`],
      ['Dana Sosial & Sosial Hibah', `Rp ${totalSosial.toLocaleString('id-ID')}`],
      ['Tabungan Kelulusan (Dana Wisuda)', `Rp ${totalWisuda.toLocaleString('id-ID')}`],
      ['Dana Cuti Terkumpul', `Rp ${totalCuti.toLocaleString('id-ID')}`],
      ['Estimasi Piutang/Tunggakan Aktif', `Rp ${totalArrears.toLocaleString('id-ID')}`],
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
    const expectedPerStudent = 350000; // SPP + Sos
    const currentMonthPayments = approvedPayments.filter(p => p.month === currentMonth);
    const payingStudentsCount = new Set(currentMonthPayments.map(p => p.studentId)).size;
    
    setStudentArrearsCount(Math.max(0, studentCount - payingStudentsCount));
    setTotalArrears(Math.max(0, (studentCount - payingStudentsCount) * expectedPerStudent));
  }, [approvedPayments, studentCount, currentMonth]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-20 overflow-x-hidden"
    >
      <div className="flex justify-end gap-3 mb-6">
         <motion.button 
           whileHover={{ scale: 1.03 }}
           whileTap={{ scale: 0.98 }}
           onClick={exportOversightPDF}
           className="px-4 py-2.5 bg-surface-container text-on-surface rounded-xl font-bold flex items-center gap-2 text-xs hover:bg-surface-container-high transition-all cursor-pointer shadow-xs border border-outline-variant/10"
         >
           <Download className="w-4 h-4" /> Cetak PDF
         </motion.button>
         <motion.button 
           whileHover={{ scale: 1.03 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => navigate('/audit-logs')}
           className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 text-xs hover:shadow-lg shadow-primary/10 transition-all cursor-pointer"
         >
           <History className="w-4 h-4" /> History Log
         </motion.button>
      </div>

      {/* Modern 7-card KPI Section */}
      <motion.div variants={itemVariants}>
        <SummaryCardsSection 
          totalSPP={totalSPP}
          totalSosial={totalSosial}
          totalWisuda={totalWisuda}
          totalCuti={totalCuti}
          cutiSiswaCount={cutiSiswaCount}
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          currentMonthIncome={currentMonthIncome}
          navigate={navigate}
        />
      </motion.div>

      {/* Large Interactive Chart Container */}
      <motion.div variants={itemVariants}>
         <InteractiveDashboardChart 
           approvedPayments={approvedPayments}
           selectedYear={selectedYear}
           setSelectedYear={setSelectedYear}
         />
      </motion.div>

      {/* Secondary Info Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-surface-container-high rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-6 sm:p-8 flex flex-col items-center text-center justify-center border border-outline-variant/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
               <UserCheck className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h4 className="text-xl sm:text-2xl font-display font-medium text-on-surface">Status Penyelesaian Pembayaran SPP</h4>
            <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-2 mb-8 leading-relaxed opacity-80 max-w-lg">Rasio kelunasan tagihan SPP terhadap total siswa terdaftar periode aktif ini.</p>
            <div className="w-full max-w-xl h-4 bg-surface-container rounded-full overflow-hidden mb-3">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percentPaid}%` }} />
            </div>
            <div className="flex justify-between w-full max-w-xl text-[10px] font-black uppercase tracking-widest text-outline">
               <span>Lunas: {studentCount - studentArrearsCount} Siswa</span>
               <span>Kepatuhan: {percentPaid}%</span>
               <span>Target: {studentCount} Siswa</span>
            </div>
         </div>

         <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] sm:rounded-[32px] md:rounded-[40px] p-6 sm:p-8 border border-outline-variant/10 shadow-sm flex flex-col justify-center animate-in">
            <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Quick Insights</p>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0" />
                  <p className="text-sm font-bold text-on-surface">Aliran Kas Stabil (+5% Bulanan)</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0" />
                  <p className="text-sm font-bold text-on-surface">Reduksi Tunggakan At-Risk (-2%)</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0" />
                  <p className="text-sm font-bold text-on-surface">Peningkatan Tabungan Wisuda (12%)</p>
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
  const { user, role, loading, error, refreshRole } = useAuth();

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
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-6 max-w-lg mx-auto text-center animate-in fade-in duration-300">
            {error ? (
              <div className="space-y-6 bg-error-container/10 p-8 rounded-[32px] border border-red-500/10">
                <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-on-surface">Gagal Menyelaraskan Sesi</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mt-2 max-w-sm mx-auto">
                    {error.includes("belum terdaftar") 
                      ? "Akun Anda terdeteksi masuk, namun detail profil (role) di database belum terdaftar. Silakan hubungi admin sekolah (Owner)." 
                      : error}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => refreshRole()}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 text-sm cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await logoutUser();
                        window.location.href = '/login';
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="px-6 py-3 bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high font-bold rounded-xl transition-all text-on-surface active:scale-95 text-sm cursor-pointer"
                  >
                    Keluar Sesi
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 border-8 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20"></div>
                <div className="text-center">
                  <h3 className="text-2xl font-display font-bold text-on-surface">Menyelaraskan Sesi...</h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-2">Mempersiapkan hak akses dan dashboard personal Anda.</p>
                </div>
              </>
            )}
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
