import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  RotateCcw, 
  AlertTriangle, 
  X, 
  FileText, 
  Download, 
  Upload,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { paymentService, backupRestoreService } from '../services/paymentService';
import { useAuth } from '../lib/firebase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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

const getSafeDateString = (createdAt: any, withTime = false) => {
  if (!createdAt) return '-';
  const val = createdAt.toDate ? createdAt.toDate() : (createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt));
  if (isNaN(val.getTime())) return '-';
  return withTime ? val.toLocaleString('id-ID') : val.toLocaleDateString('id-ID');
};

export default function Reports() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const [totalCollected, setTotalCollected] = useState(0);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const { role } = useAuth();

  useEffect(() => {
    const unsubscribe = paymentService.listenPayments((data) => {
      setReportData(data);
    });
    return () => unsubscribe();
  }, []);

  const INDO_MONTHS_LIST = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthsArr = INDO_MONTHS_LIST;

  const getPaymentMonthAndYear = (p: any) => {
    let monthName = '';
    let year = 2026;

    if (p.month && typeof p.month === 'string') {
      const parts = p.month.trim().split(/[\s,]+/);
      if (parts.length >= 1) {
        let rawMonth = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const englishToIndo: Record<string, string> = {
          'January': 'Januari', 'February': 'Februari', 'March': 'Maret', 'April': 'April',
          'May': 'Mei', 'June': 'Juni', 'July': 'Juli', 'August': 'Agustus', 'September': 'September',
          'October': 'Oktober', 'November': 'November', 'December': 'Desember'
        };
        if (englishToIndo[rawMonth]) {
          rawMonth = englishToIndo[rawMonth];
        }
        monthName = rawMonth;
        
        if (parts.length >= 2) {
          let yearStr = parts[1].replace(/[^0-9]/g, '');
          let parsedYear = parseInt(yearStr);
          if (!isNaN(parsedYear)) {
            if (parsedYear < 100) {
              parsedYear += 2000;
            }
            year = parsedYear;
          }
        }
      }
    }

    // Fallback if month is still not set or invalid
    if (!monthName || !INDO_MONTHS_LIST.includes(monthName)) {
      if (p.createdAt) {
        const d = p.createdAt.toDate 
          ? p.createdAt.toDate() 
          : (p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt));
        if (!isNaN(d.getTime())) {
          monthName = INDO_MONTHS_LIST[d.getMonth()];
          year = d.getFullYear();
        }
      }
    }

    if (!monthName) {
      monthName = 'Januari';
    }

    return { monthName, year };
  };

  // Filter Logic
  const filteredData = reportData.filter(p => {
    const matchSearch = p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (p.trxId && p.trxId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const { monthName, year } = getPaymentMonthAndYear(p);
    const matchYear = year === selectedYear;
    const matchMonth = selectedMonth === '' || monthName === selectedMonth;
    const matchStatus = selectedStatus === 'All' || p.status === selectedStatus.toLowerCase();
    
    let matchType = true;
    if (selectedType !== 'All') {
      const typeLower = selectedType.toLowerCase();
      matchType = p.type?.toLowerCase().includes(typeLower) || 
                  p.paymentItems?.some((i: any) => i.type && i.type.toLowerCase().includes(typeLower));
    }

    return matchSearch && matchYear && matchMonth && matchStatus && matchType;
  });

  // Approved Metrics for Summary/Chart
  const approvedPayments = reportData.filter(p => p.status === 'approved');

  const getCategoryTotal = (category: string, dataset = approvedPayments) => {
    const target = dataset.filter(p => {
      const { year } = getPaymentMonthAndYear(p);
      return year === selectedYear;
    });
    return target.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes(category.toLowerCase()));
      if (item) return acc + (item.amount || 0);
      return acc + (p.type?.toLowerCase().includes(category.toLowerCase()) ? (p.amount || 0) : 0);
    }, 0);
  };

  const totalSPP = getCategoryTotal('spp');
  const totalSosial = getCategoryTotal('sosial');
  const totalWisuda = getCategoryTotal('wisuda');
  const totalCuti = getCategoryTotal('cuti');
  const totalOverall = totalSPP + totalSosial + totalWisuda + totalCuti;

  // Monthly breakdown for selected year
  const chartData = INDO_MONTHS_LIST.map(m => {
    const monthPayments = approvedPayments.filter(p => {
      const { monthName, year } = getPaymentMonthAndYear(p);
      return monthName === m && year === selectedYear;
    });
    
    const spp = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('spp'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('spp') ? (p.amount || 0) : 0));
    }, 0);
    
    const sosial = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('sosial'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('sosial') ? (p.amount || 0) : 0));
    }, 0);

    const wisuda = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('wisuda'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('wisuda') ? (p.amount || 0) : 0));
    }, 0);

    const cuti = monthPayments.reduce((acc, p) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('cuti'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('cuti') ? (p.amount || 0) : 0));
    }, 0);

    return {
      name: m.substring(0, 3),
      SPP: spp,
      Sosial: sosial,
      Wisuda: wisuda,
      Cuti: cuti,
      Total: spp + sosial + wisuda + cuti
    };
  });

  const isChartEmpty = chartData.reduce((acc, item) => acc + item.Total, 0) === 0;

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await paymentService.updatePaymentStatus(id, status, reviewNote);
      setSelectedPayment(null);
      setReviewNote('');
      alert(`Pembayaran berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`);
    } catch (error) {
      console.error("Update failed", error);
      alert("Gagal memperbarui status.");
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await paymentService.resetAllPayments();
      setIsResetConfirmOpen(false);
      alert("Seluruh data transaksi berhasil dihapus.");
    } catch (error) {
      console.error("Reset failed", error);
      alert("Gagal meriset data.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = await backupRestoreService.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMART_PAY_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed", error);
      alert("Gagal mengekspor data backup.");
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm("PERINGATAN: Memulihkan database dari file backup akan memperbarui data siswa, pembayaran, dan audit log. Apakah Anda yakin?");
    if (!confirmRestore) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const backupData = JSON.parse(text);
        
        await backupRestoreService.restoreBackup(backupData);
        alert("Database berhasil dipulihkan dari backup.");
        window.location.reload();
      } catch (error: any) {
        console.error("Restore failed", error);
        alert("Format file tidak valid atau gagal mentransfer data.");
      }
    };
    reader.readAsText(file);
  };

  const exportToExcel = () => {
    const data = filteredData.map(p => ({
      'No Transaksi': p.trxId || '-',
      'Tanggal': getSafeDateString(p.createdAt),
      'Nama Siswa': p.studentName,
      'Bulan': p.month,
      'Metode': p.method || '-',
      'Nominal': p.amount,
      'Status': p.status.toUpperCase(),
      'Catatan': p.reviewNote || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Pembayaran');
    XLSX.writeFile(wb, `Laporan_Pembayaran_${new Date().toLocaleDateString()}.xlsx`);
  };

  const generateReceipt = (payment: any) => {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('SMART PAY - KWITANSI RESMI', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Smart Education System for PAUD & Sekolah', 105, 28, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    
    // Body
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Nomor Transaksi: ${payment.trxId || 'N/A'}`, 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString()}`, 20, 58);
    
    const itemsBody = payment.paymentItems 
      ? payment.paymentItems.map((item: any) => [item.type, `Rp ${item.amount.toLocaleString()}`])
      : [['Pembayaran', `Rp ${payment.amount.toLocaleString()}`]];

    if (payment.discount > 0) {
      itemsBody.push(['Potongan/Subsidi', `- Rp ${payment.discount.toLocaleString()}`]);
    }

    doc.autoTable({
      startY: 70,
      head: [['Keterangan', 'Detail']],
      body: [
        ['Nama Siswa', payment.studentName],
        ['Bulan/Periode', payment.month],
        ...itemsBody,
        ['Total Bayar', `Rp ${payment.amount.toLocaleString()}`],
        ['Metode', payment.method || 'Transfer'],
        ['Status', payment.status.toUpperCase()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113] }
    });
    
    doc.text('Terima kasih atas pembayaran Anda.', 105, doc.lastAutoTable.finalY + 20, { align: 'center' });
    doc.text('Tanda Terima Digital - Sah Tanpa Tanda Tangan Basah', 105, doc.lastAutoTable.finalY + 26, { align: 'center' });
    
    doc.save(`Kwitansi_${payment.trxId || payment.id}.pdf`);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20"
    >
      <div className="flex justify-end gap-3 mb-6">
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-green-600/10 transition-all cursor-pointer text-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Report</span>
        </motion.button>
        {role === 'owner' && (
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsResetConfirmOpen(true)}
            className="bg-error/10 text-error px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-error hover:text-white transition-all group cursor-pointer text-xs"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Reset Data</span>
          </motion.button>
        )}
      </div>

      {/* Analytics Summary - Ketua Unit Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-[48px] p-8 md:p-10 border border-outline-variant/10 shadow-sm">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                 <h3 className="text-2xl font-display font-bold text-on-surface">Trend Bulanan APPROVED</h3>
                 <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">Breakdown Pemasukan Tahun {selectedYear}</p>
              </div>
              <div className="flex bg-surface-container p-1 rounded-2xl">
                 <select 
                   value={selectedYear} 
                   onChange={(e) => setSelectedYear(Number(e.target.value))}
                   className="bg-transparent font-bold text-xs outline-none px-4 py-2"
                 >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
           </div>
           
           <div className="h-64 w-full">
              {isChartEmpty ? (
                 <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-surface-container/10 rounded-[32px] border border-dashed border-outline-variant/20 animate-in fade-in zoom-in duration-500">
                    <div className="w-12 h-12 bg-outline-variant/25 rounded-full flex items-center justify-center text-outline mb-3">
                       <Archive className="w-6 h-6 opacity-45" />
                    </div>
                    <h4 className="text-sm font-bold text-on-surface">Belum ada data pemasukan pada periode ini</h4>
                    <p className="text-[11px] text-outline max-w-sm mt-1 mb-2 leading-relaxed opacity-80">
                       Semua grafik pemasukan lunas tahun {selectedYear} akan tampil secara dinamis di sini.
                    </p>
                 </div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 900 }} />
                    <YAxis hide />
                    <RechartsTooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-primary text-white p-4 rounded-2xl shadow-xl font-bold text-xs">
                               {payload.map((entry: any, i: number) => (
                                 <div key={i} className="flex justify-between gap-4">
                                    <span>{entry.name}:</span>
                                    <span>Rp {entry.value.toLocaleString()}</span>
                                 </div>
                               ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="SPP" stackId="a" fill="#65528A" radius={[0, 0, 0, 0]} />
                     <Bar dataKey="Cuti" stackId="a" fill="#D97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sosial" stackId="a" fill="#006A60" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Wisuda" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
               )}
           </div>
        </div>

        <div className="flex flex-col gap-5">
           <div className="bg-primary rounded-[40px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-white/50">Total Keseluruhan ({selectedYear})</p>
              <h3 className="text-3xl font-display font-bold">Rp {totalOverall.toLocaleString()}</h3>
           </div>
           
           <div className="bg-surface-container-lowest rounded-[40px] p-6 border border-outline-variant/10 shadow-sm grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/5 pb-3">
                 <p className="text-[10px] font-black text-outline uppercase tracking-widest">Total SPP</p>
                 <p className="font-display font-bold text-primary">Rp {totalSPP.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant/5 pb-3">
                 <p className="text-[10px] font-black text-outline uppercase tracking-widest">Dana Sosial</p>
                 <p className="font-display font-bold text-secondary">Rp {totalSosial.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black text-outline uppercase tracking-widest">Total Wisuda</p>
                 <p className="font-display font-bold text-blue-600">Rp {totalWisuda.toLocaleString()}</p>
               </div>
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest">Dana Cuti</p>
                  <p className="font-display font-bold text-amber-600">Rp {totalCuti.toLocaleString()}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Administrative Backup Controls */}
      {role === 'owner' && (
        <div className="bg-surface-container-low rounded-[40px] p-8 border border-outline-variant/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h3 className="text-xl font-display font-bold text-on-surface">Pusat Backup & Pemulihan</h3>
            <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">Ekspor, Impor, dan Pulihkan Seluruh Basis Data SMART PAY</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleExportBackup}
              className="bg-primary hover:bg-primary/90 text-white hover:scale-[1.02] active:scale-[0.98] px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-md"
            >
              <Download className="w-4.5 h-4.5" />
              <span>Ekspor Backup JSON</span>
            </button>
            <label className="bg-secondary text-white hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98] px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2.5 transition-all cursor-pointer text-sm shadow-md">
              <Upload className="w-4.5 h-4.5" />
              <span>Pulihkan dari JSON</span>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleRestoreBackup} 
              />
            </label>
          </div>
        </div>
      )}

      {/* Enhanced Filters Section */}
      <div className="bg-surface-container-high rounded-[40px] p-8 border border-outline-variant/10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-outline uppercase tracking-widest pl-3">Cari Transaksi</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Nama Siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/10 rounded-2xl pl-11 pr-4 py-3.5 font-bold text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-outline uppercase tracking-widest pl-3">Bulan</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/10 rounded-2xl px-5 py-3.5 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                 <option className="bg-surface-container text-on-surface" value="">Semua Bulan</option>
                 {monthsArr.map(m => <option className="bg-surface-container text-on-surface" key={m} value={m}>{m}</option>)}
              </select>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-outline uppercase tracking-widest pl-3">Kategori</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/10 rounded-2xl px-5 py-3.5 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                 <option className="bg-surface-container text-on-surface" value="All">Semua Kategori</option>
                 <option className="bg-surface-container text-on-surface" value="SPP">SPP</option>
                 <option className="bg-surface-container text-on-surface" value="Sosial">Dana Sosial</option>
                 <option className="bg-surface-container text-on-surface" value="Wisuda">Wisuda</option>
              </select>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-outline uppercase tracking-widest pl-3">Status</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/10 rounded-2xl px-5 py-3.5 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                 <option className="bg-surface-container text-on-surface" value="All">Semua Status</option>
                 <option className="bg-surface-container text-on-surface" value="Approved">Lunas</option>
                 <option className="bg-surface-container text-on-surface" value="Pending">Proses</option>
                 <option className="bg-surface-container text-on-surface" value="Rejected">Ditolak</option>
              </select>
           </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-surface-container-lowest rounded-[48px] p-8 md:p-12 border border-outline-variant/10 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-display font-bold">Riwayat Transaksi</h3>
           <Filter className="w-5 h-5 text-outline" />
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredData.length > 0 ? filteredData.map((p, i) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedPayment(p)}
                className="group bg-surface-container-low/50 hover:bg-surface-container-low p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer border border-transparent hover:border-outline-variant/10 transition-all"
              >
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <User className="w-7 h-7" />
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-on-surface text-lg">{p.studentName}</h4>
                        <span className="text-[9px] font-black bg-surface-container px-2 py-0.5 rounded text-outline uppercase tracking-widest">{p.trxId || 'No-ID'}</span>
                      </div>
                      <p className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3 h-3 text-primary" /> {p.month}
                        <span className="mx-2 opacity-20">|</span>
                        <Clock className="w-3 h-3 text-secondary" /> {getSafeDateString(p.createdAt)}
                      </p>
                   </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-10">
                   <div className="text-left md:text-right">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Nominal</p>
                      <p className="font-display font-bold text-primary text-base md:text-lg">Rp {p.amount.toLocaleString()}</p>
                   </div>
                   <div className={cn(
                     "px-4 md:px-6 py-2 md:py-2.5 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest text-center min-w-[100px] md:min-w-[120px] shadow-sm",
                     p.status === 'approved' ? "bg-green-100 text-green-700 shadow-green-200/50" : 
                     p.status === 'pending' ? "bg-orange-100 text-orange-700 shadow-orange-200/50" :
                     "bg-red-100 text-red-700 shadow-red-200/50"
                   )}>
                     {p.status === 'approved' ? 'Lunas' : p.status === 'pending' ? 'Diproses' : 'Ditolak'}
                   </div>
                </div>
              </motion.div>
            )) : (
              <div className="py-20 text-center opacity-50">
                 <FileText className="w-16 h-16 mx-auto mb-4" />
                 <p className="font-bold">Tidak ada data pembayaran yang ditemukan.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Details & Validations Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedPayment(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-10 max-h-[95vh] overflow-y-auto no-scrollbar">
              <button 
                onClick={() => setSelectedPayment(null)}
                className="absolute top-8 right-8 p-2 hover:bg-surface-container rounded-full"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="md:w-1/2 space-y-8">
                <div>
                   <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Arsip Digital Transaksi</span>
                   <h2 className="text-3xl font-display font-bold">{selectedPayment.studentName}</h2>
                   <p className="text-on-surface-variant font-bold text-lg italic">{selectedPayment.month}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-surface-container p-5 rounded-3xl">
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">TRX ID</p>
                      <p className="font-mono text-sm font-bold text-on-surface">{selectedPayment.trxId || '-'}</p>
                   </div>
                   <div className="bg-surface-container p-5 rounded-3xl">
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Metode</p>
                      <p className="font-bold text-on-surface">{selectedPayment.method || 'Transfer'}</p>
                   </div>
                   <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10 col-span-2">
                       <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3">Rincian Item Pembayaran</p>
                       <div className="space-y-2">
                          {selectedPayment.paymentItems ? selectedPayment.paymentItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                               <span className="font-bold text-on-surface opacity-70">{item.type}</span>
                               <span className="font-black text-primary">Rp {item.amount.toLocaleString()}</span>
                            </div>
                          )) : (
                            <div className="flex justify-between text-sm">
                               <span className="font-bold text-on-surface opacity-70">Single Payment</span>
                               <span className="font-black text-primary">Rp {(selectedPayment.amount || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(selectedPayment.discount > 0) && (
                            <div className="flex justify-between text-sm pt-2 border-t border-primary/10 mt-2">
                               <span className="font-bold text-error italic">Potongan/Subsidi</span>
                               <span className="font-black text-error">- Rp {selectedPayment.discount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg pt-3 border-t-2 border-primary/20 mt-3">
                             <span className="font-display font-bold text-primary">Total Bayar</span>
                             <span className="font-display font-bold text-primary">Rp {(selectedPayment.amount || 0).toLocaleString()}</span>
                          </div>
                          {selectedPayment.notes && (
                            <div className="mt-4 p-4 bg-surface-container rounded-2xl">
                               <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Catatan Tambahan</p>
                               <p className="text-xs font-bold italic">"{selectedPayment.notes}"</p>
                            </div>
                          )}
                       </div>
                    </div>
                   <div className="bg-surface-container p-5 rounded-3xl col-span-2">
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Waktu Transaksi</p>
                      <p className="font-bold text-on-surface text-sm">{getSafeDateString(selectedPayment.createdAt, true)}</p>
                   </div>
                </div>

                {/* Proof area */}
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-outline uppercase tracking-widest pl-2 flex items-center gap-2">
                     <FileText className="w-3 h-3" /> Bukti Pembayaran Resmi
                   </h4>
                   <div className="rounded-[32px] border border-outline-variant/20 bg-surface-container-low overflow-hidden aspect-video flex items-center justify-center relative group">
                      {selectedPayment.proofUrl ? (
                         <img src={selectedPayment.proofUrl} className="w-full h-full object-contain" alt="Bukti" />
                      ) : (
                         <div className="text-center opacity-30">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm font-bold">Bukti tidak terupload.</p>
                         </div>
                      )}
                      {selectedPayment.proofUrl && (
                        <a href={selectedPayment.proofUrl} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-on-surface/80 backdrop-blur shadow-lg text-surface p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                           <Download className="w-5 h-5" />
                        </a>
                      )}
                   </div>
                </div>
              </div>

              <div className="md:w-1/2 flex flex-col justify-between pt-10 md:pt-0">
                <div className="space-y-6">
                  {selectedPayment.status === 'approved' && (
                    <div className="p-8 bg-green-500/10 border-2 border-green-500/20 rounded-[32px] text-center">
                       <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                       <h4 className="text-2xl font-display font-bold text-green-700">Terima Kasih!</h4>
                       <p className="text-green-700/70 font-medium mb-6">Pembayaran telah dikonfirmasi dan dana masuk ke kas sekolah.</p>
                       <button 
                         onClick={() => generateReceipt(selectedPayment)}
                         className="px-8 py-3.5 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-green-600/30 transition-all mx-auto"
                       >
                         <Printer className="w-5 h-5" />
                         <span>Cetak Kwitansi PDF</span>
                       </button>
                    </div>
                  )}

                  {selectedPayment.status === 'rejected' && (
                    <div className="p-8 bg-red-500/10 border-2 border-red-500/20 rounded-[32px] text-center">
                       <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                       <h4 className="text-2xl font-display font-bold text-red-700">Pembayaran Ditolak</h4>
                       <p className="text-red-700/70 font-medium mb-4 italic">Alasan: {selectedPayment.reviewNote || 'Tidak disebutkan'}</p>
                    </div>
                  )}

                  {selectedPayment.status === 'pending' && role === 'ketua_unit' && (
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-outline uppercase tracking-widest pl-3 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Catatan Peninjau (Optional)
                          </label>
                          <textarea 
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                            placeholder="Tulis alasan jika ditolak atau pesan terima kasih..."
                            className="w-full bg-surface-container rounded-3xl p-6 font-bold text-on-surface min-h-[120px] outline-none border-none focus:ring-4 focus:ring-primary/10 transition-all"
                          />
                       </div>
                       <div className="flex gap-4">
                          <button 
                            onClick={() => handleUpdateStatus(selectedPayment.id, 'approved')}
                            className="flex-[2] bg-primary text-white py-5 rounded-3xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3"
                          >
                             <CheckCircle2 className="w-6 h-6" />
                             <span>Konfirmasi</span>
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedPayment.id, 'rejected')}
                            className="flex-1 bg-error/10 text-error py-5 rounded-3xl font-bold text-lg hover:bg-error hover:text-white transition-all underline underline-offset-4"
                          >
                             Tolak
                          </button>
                       </div>
                    </div>
                  )}
                </div>

                <div className="text-center mt-10">
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest opacity-50">Sistem Validasi SMART PAY - 2026</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isResetting && setIsResetConfirmOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-surface-container-lowest rounded-[48px] p-12 shadow-2xl text-center">
              <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Reset Seluruh Data?</h3>
              <p className="text-on-surface-variant font-medium text-sm mb-12 leading-relaxed italic opacity-80">
                Data transaksi yang dihapus tidak dapat dikembalikan. Pastikan Anda sudah mengekspor Laporan Excel.
              </p>
              <div className="space-y-4">
                <button 
                  disabled={isResetting}
                  onClick={handleResetData}
                  className="w-full py-5 bg-error text-white rounded-2xl font-bold text-lg hover:shadow-xl shadow-error/20 transition-all disabled:opacity-50"
                >
                  {isResetting ? "Menghapus..." : "Ya, Reset Permanen"}
                </button>
                <button onClick={() => setIsResetConfirmOpen(false)} className="w-full py-5 bg-surface-container rounded-2xl font-bold hover:bg-surface-container-high transition-all">Batal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
