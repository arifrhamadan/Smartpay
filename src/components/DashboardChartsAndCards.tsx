import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Landmark, HandCoins, GraduationCap, Clock, CheckCircle, TrendingUp, Archive, Plus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function formatCompactRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    const formatted = (amount / 1_000_000_000).toFixed(1);
    return `Rp ${formatted.replace(/\.0$/, '')}M`;
  }
  if (amount >= 1_000_000) {
    const formatted = (amount / 1_000_000).toFixed(1);
    return `Rp ${formatted.replace(/\.0$/, '')}JT`;
  }
  if (amount >= 1_000) {
    const formatted = (amount / 1_000).toFixed(1);
    return `Rp ${formatted.replace(/\.0$/, '')}RB`;
  }
  return `Rp ${amount}`;
}

export function formatFullRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  subtext?: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  borderClass?: string;
  onClick?: () => void;
}

export function SummaryCard({ 
  title, 
  value, 
  isCurrency = false, 
  subtext, 
  icon: Icon, 
  colorClass, 
  borderClass, 
  onClick 
}: SummaryCardProps) {
  const displayValue = typeof value === 'number' ? (
    isCurrency ? (
      <>
        <span className="block md:hidden" title={formatFullRupiah(value)}>
          {formatCompactRupiah(value)}
        </span>
        <span className="hidden md:block select-all" title={formatCompactRupiah(value)}>
          {formatFullRupiah(value)}
        </span>
      </>
    ) : (
      <span>{value.toLocaleString('id-ID')}</span>
    )
  ) : (
    <span>{value}</span>
  );

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "bg-surface-container-lowest p-5 rounded-[28px] border border-outline-variant/10 shadow-xs flex flex-col justify-between h-[150px] sm:h-[160px] md:h-[170px] transition-all duration-300 relative overflow-hidden group",
        borderClass,
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      <div className="flex items-center justify-between gap-3 relative z-10">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.12em] text-outline truncate" title={title}>
          {title}
        </p>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 relative z-10 flex-1 flex flex-col justify-end">
        <h3 className="text-[15px] xs:text-base sm:text-lg md:text-xl xl:text-2xl font-display font-black text-on-surface leading-none tracking-tight select-all">
          {displayValue}
        </h3>
        {subtext && (
          <p className="text-[10px] sm:text-[11px] font-bold text-outline mt-1.5 truncate opacity-85" title={subtext}>
            {subtext}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface SummaryCardsSectionProps {
  totalSPP: number;
  totalSosial: number;
  totalWisuda: number;
  totalCuti: number;
  cutiSiswaCount: number;
  pendingCount: number;
  approvedCount: number;
  currentMonthIncome: number;
  navigate: (path: string) => void;
}

export function SummaryCardsSection({ 
  totalSPP, 
  totalSosial, 
  totalWisuda, 
  totalCuti, 
  cutiSiswaCount, 
  pendingCount, 
  approvedCount, 
  currentMonthIncome,
  navigate 
}: SummaryCardsSectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      <SummaryCard 
        title="Total SPP"
        value={totalSPP}
        isCurrency={true}
        subtext="Pemasukan SPP Utama"
        icon={Landmark}
        colorClass="bg-primary/10 text-primary dark:bg-primary/20"
        onClick={() => navigate('/reports')}
      />
      <SummaryCard 
        title="Dana Sosial"
        value={totalSosial}
        isCurrency={true}
        subtext="Donasi Kebersamaan"
        icon={HandCoins}
        colorClass="bg-secondary/10 text-secondary dark:bg-secondary/20"
        onClick={() => navigate('/reports')}
      />
      <SummaryCard 
        title="Wisuda"
        value={totalWisuda}
        isCurrency={true}
        subtext="Tabungan Kelulusan"
        icon={GraduationCap}
        colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20"
        onClick={() => navigate('/reports')}
      />
      <SummaryCard 
        title="Cuti"
        value={totalCuti}
        isCurrency={true}
        subtext={`👥 ${cutiSiswaCount} Siswa Cuti`}
        icon={Archive}
        colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20"
        onClick={() => navigate('/reports')}
      />
      <SummaryCard 
        title="Pending"
        value={pendingCount}
        isCurrency={false}
        subtext="Perlu Verifikasi"
        icon={Clock}
        colorClass="bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20"
        borderClass="border-orange-500/20 hover:border-orange-500/40"
        onClick={() => navigate('/reports')}
      />
      <SummaryCard 
        title="Approved"
        value={approvedCount}
        isCurrency={false}
        subtext="Siklus Sukses"
        icon={CheckCircle}
        colorClass="bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-500/20"
        borderClass="border-green-500/20 hover:border-green-500/40"
        onClick={() => navigate('/reports')}
      />
      <SummaryCard 
        title="Income Bulan Ini"
        value={currentMonthIncome}
        isCurrency={true}
        subtext={`Periode ${new Date().toLocaleString('id-ID', { month: 'short' })}`}
        icon={TrendingUp}
        colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20"
        onClick={() => navigate('/reports')}
      />
    </div>
  );
}

interface InteractiveDashboardChartProps {
  approvedPayments: any[];
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  isLoading?: boolean;
}

const INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getPaymentMonthAndYear(p: any) {
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
  if (!monthName || !INDO_MONTHS.includes(monthName)) {
    if (p.createdAt) {
      const d = p.createdAt.toDate 
        ? p.createdAt.toDate() 
        : (p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt));
      if (!isNaN(d.getTime())) {
        monthName = INDO_MONTHS[d.getMonth()];
        year = d.getFullYear();
      }
    }
  }

  if (!monthName) {
    monthName = 'Januari';
  }

  return { monthName, year };
}

export function InteractiveDashboardChart({ approvedPayments, selectedYear, setSelectedYear, isLoading }: InteractiveDashboardChartProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'spp' | 'sosial' | 'wisuda' | 'cuti'>('all');
  const [viewMode, setViewMode] = useState<'yearly' | 'daily'>('yearly');
  const [selfLoading, setSelfLoading] = useState(true);

  const currentMonthStr = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(currentMonthStr);

  const INDO_MONTH_MAP: Record<string, number> = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
  };

  useEffect(() => {
    const t = setTimeout(() => setSelfLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Generate unique months dynamically using robust parsing to avoid duplicate representations
  const uniqueMonthsSet = new Set<string>();
  approvedPayments.forEach((p: any) => {
    const { monthName, year } = getPaymentMonthAndYear(p);
    uniqueMonthsSet.add(`${monthName} ${year}`);
  });
  uniqueMonthsSet.add(currentMonthStr);
  const uniqueMonths = Array.from(uniqueMonthsSet);

  const sortedMonths = [...uniqueMonths].sort((a, b) => {
    const partsA = a.split(' ');
    const partsB = b.split(' ');
    const yearA = partsA.length > 1 ? (parseInt(partsA[1]) || 2026) : 2026;
    const yearB = partsB.length > 1 ? (parseInt(partsB[1]) || 2026) : 2026;
    
    if (yearA !== yearB) return yearA - yearB;
    
    const monthA = INDO_MONTH_MAP[partsA[0].toLowerCase()] ?? 0;
    const monthB = INDO_MONTH_MAP[partsB[0].toLowerCase()] ?? 0;
    return monthA - monthB;
  });

  // Ensure selectedMonthStr is valid inside sortedMonths
  useEffect(() => {
    if (sortedMonths.length > 0 && !sortedMonths.includes(selectedMonthStr)) {
      setSelectedMonthStr(sortedMonths[sortedMonths.length - 1]);
    }
  }, [sortedMonths, selectedMonthStr]);

  // Calculate yearly chart data (monthly bars)
  const chartData = INDO_MONTHS.map(m => {
    const monthPayments = approvedPayments.filter((p: any) => {
      const { monthName, year } = getPaymentMonthAndYear(p);
      return monthName === m && year === selectedYear;
    });
    
    const spp = monthPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('spp'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('spp') ? (p.amount || 0) : 0));
    }, 0);
    
    const sosial = monthPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('sosial'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('sosial') ? (p.amount || 0) : 0));
    }, 0);

    const wisuda = monthPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('wisuda'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('wisuda') ? (p.amount || 0) : 0));
    }, 0);

    const cuti = monthPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('cuti'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('cuti') ? (p.amount || 0) : 0));
    }, 0);

    return {
      name: m.substring(0, 3),
      fullName: m,
      SPP: spp,
      Sosial: sosial,
      Wisuda: wisuda,
      Cuti: cuti,
      Total: spp + sosial + wisuda + cuti
    };
  });

  // Calculate daily chart data for the selected month-year string
  const parseMonthYearStr = (mStr: string) => {
    const parts = mStr.split(' ');
    const mName = parts[0].toLowerCase();
    const year = parts.length > 1 ? (parseInt(parts[1]) || 2026) : 2026;
    const month = INDO_MONTH_MAP[mName] ?? 0;
    return { month, year };
  };

  const { month: targetMonth, year: targetYear } = parseMonthYearStr(selectedMonthStr);
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayPayments = approvedPayments.filter((p: any) => {
      const { monthName, year } = getPaymentMonthAndYear(p);
      if (`${monthName} ${year}` !== selectedMonthStr) return false;
      if (!p.createdAt) return false;
      
      const dateVal = p.createdAt.toDate 
        ? p.createdAt.toDate() 
        : (p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt));
      
      if (isNaN(dateVal.getTime())) return false;
      
      return dateVal.getDate() === day;
    });

    const spp = dayPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('spp'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('spp') ? (p.amount || 0) : 0));
    }, 0);
    
    const sosial = dayPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('sosial'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('sosial') ? (p.amount || 0) : 0));
    }, 0);

    const wisuda = dayPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('wisuda'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('wisuda' ) ? (p.amount || 0) : 0));
    }, 0);

    const cuti = dayPayments.reduce((acc: number, p: any) => {
      const item = p.paymentItems?.find((i: any) => i && i.type && i.type.toLowerCase().includes('cuti'));
      return acc + (item ? (item.amount || 0) : (p.type?.toLowerCase().includes('cuti') ? (p.amount || 0) : 0));
    }, 0);

    return {
      name: day.toString().padStart(2, '0'),
      fullName: `${day} ${selectedMonthStr}`,
      SPP: spp,
      Sosial: sosial,
      Wisuda: wisuda,
      Cuti: cuti,
      Total: spp + sosial + wisuda + cuti
    };
  });

  const activeData = viewMode === 'yearly' ? chartData : dailyData;

  const showLoading = isLoading || selfLoading;

  // Determine if the currently loaded dataset is empty (i.e. strictly zero payments)
  let totalInChart = 0;
  if (activeTab === 'all') {
    totalInChart = activeData.reduce((acc, item) => acc + item.Total, 0);
  } else if (activeTab === 'spp') {
    totalInChart = activeData.reduce((acc, item) => acc + item.SPP, 0);
  } else if (activeTab === 'sosial') {
    totalInChart = activeData.reduce((acc, item) => acc + item.Sosial, 0);
  } else if (activeTab === 'wisuda') {
    totalInChart = activeData.reduce((acc, item) => acc + item.Wisuda, 0);
  } else if (activeTab === 'cuti') {
    totalInChart = activeData.reduce((acc, item) => acc + item.Cuti, 0);
  }
  const isChartEmpty = totalInChart === 0;

  return (
    <div className="bg-surface-container-lowest rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border border-outline-variant/10 shadow-sm transition-all duration-300">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl sm:text-2xl font-display font-medium text-on-surface">
            {viewMode === 'yearly' ? 'Grafik Arus Kas Tahunan' : `Tren Harian Kas - ${selectedMonthStr}`}
          </h3>
          <p className="text-xs text-outline font-bold mt-1">
            {viewMode === 'yearly' 
              ? `Interaksi dinamis & rincian data bulanan Tahun ${selectedYear}` 
              : `Rincian pemasukan harian dan kumulatif periode ${selectedMonthStr}`}
          </p>
        </div>
        
        {/* Year, View Mode & Tab Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex p-1 bg-surface-container rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
            <button 
              onClick={() => setActiveTab('all')} 
              className={cn("px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer", activeTab === 'all' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}
            >
              Semua
            </button>
            <button 
              onClick={() => setActiveTab('spp')} 
              className={cn("px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer", activeTab === 'spp' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}
            >
              SPP
            </button>
            <button 
              onClick={() => setActiveTab('sosial')} 
              className={cn("px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer", activeTab === 'sosial' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}
            >
              Sosial
            </button>
            <button 
              onClick={() => setActiveTab('wisuda')} 
              className={cn("px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer", activeTab === 'wisuda' ? "bg-surface text-blue-600 shadow-sm" : "text-outline hover:text-on-surface")}
            >
              Wisuda
            </button>
            <button 
              onClick={() => setActiveTab('cuti')} 
              className={cn("px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer", activeTab === 'cuti' ? "bg-surface text-amber-600 shadow-sm" : "text-outline hover:text-on-surface")}
            >
              Cuti
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex p-1 bg-surface-container rounded-2xl">
            <button
              onClick={() => setViewMode('yearly')}
              className={cn(
                "px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                viewMode === 'yearly' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface"
              )}
            >
              Tahunan
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={cn(
                "px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                viewMode === 'daily' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface"
              )}
            >
              Bulanan
            </button>
          </div>

          {/* Context Dropdown (Year or Month depending on mode) */}
          {viewMode === 'yearly' ? (
            <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-2xl border border-outline-variant/10 shadow-sm">
               <Landmark className="w-4 h-4 text-primary" />
               <select 
                 value={selectedYear} 
                 onChange={(e) => setSelectedYear(Number(e.target.value))}
                 className="bg-transparent font-bold text-xs outline-none pr-1 text-on-surface cursor-pointer dark:text-zinc-100"
               >
                  {[2024, 2025, 2026].map(y => <option className="bg-surface-container text-on-surface text-xs" key={y} value={y}>{y}</option>)}
               </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-2xl border border-outline-variant/10 shadow-sm">
               <Clock className="w-4 h-4 text-primary" />
               <select 
                 value={selectedMonthStr} 
                 onChange={(e) => setSelectedMonthStr(e.target.value)}
                 className="bg-transparent font-bold text-xs outline-none pr-1 text-on-surface cursor-pointer max-w-[130px] dark:text-zinc-100"
               >
                  {sortedMonths.map(m => m && <option className="bg-surface-container text-on-surface text-xs" key={m} value={m}>{m}</option>)}
               </select>
            </div>
          )}
        </div>
      </div>

      <div className="h-80 w-full relative flex items-center justify-center">
        {showLoading ? (
          <div className="h-72 w-full flex items-end justify-between px-4 pb-4 border-b border-l border-outline-variant/10 animate-pulse">
            {Array.from({ length: viewMode === 'yearly' ? 12 : 15 }).map((_, idx) => (
              <div 
                key={idx} 
                className="w-4 sm:w-8 bg-primary/10 rounded-t transition-all" 
                style={{ height: `${[40, 65, 50, 85, 30, 70, 55, 45, 90, 35, 60, 40, 75, 50, 60][idx % 15]}%` }}
              />
            ))}
          </div>
        ) : isChartEmpty ? (
          <div className="h-72 w-full flex flex-col items-center justify-center text-center p-6 bg-surface-container/5 rounded-3xl border border-dashed border-outline-variant/20">
            <div className="w-16 h-16 bg-outline-variant/10 rounded-full flex items-center justify-center text-outline mb-4">
              <Archive className="w-8 h-8 opacity-40" />
            </div>
            <h4 className="text-base font-bold text-on-surface">Belum ada data transaksi pada periode ini</h4>
            <p className="text-xs text-outline max-w-sm mt-1 mb-5">
              Semua transaksi pembayaran dengan status Approved (Lunas) akan dimuat secara realtime di sini.
            </p>
            <button 
              onClick={() => navigate('/payments')} 
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Transaksi</span>
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'all' ? (
              <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant, #E5E7EB)" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10, fontWeight: 755 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--outline-variant, #E5E7EB)', opacity: 0.1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const headerLabel = viewMode === 'daily'
                        ? (payload[0].payload.fullName || `${label} ${selectedMonthStr}`)
                        : `${payload[0].payload.fullName || label} ${selectedYear}`;
                      return (
                        <div className="bg-surface-container-highest/95 backdrop-blur-md dark:bg-zinc-950/95 dark:text-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-2xl border border-outline-variant/30 min-w-[200px] text-on-surface text-xs font-bold leading-relaxed">
                           <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-3">{headerLabel}</p>
                           <div className="space-y-1.5">
                              {payload.map((entry: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center">
                                   <span style={{ color: entry.color }}>{entry.name}</span>
                                   <span>Rp {entry.value.toLocaleString('id-ID')}</span>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-outline-variant/20 mt-1.5 flex justify-between items-center text-primary font-black uppercase tracking-wide">
                                 <span>Total</span>
                                 <span>Rp {payload.reduce((a: number, b: any) => a + b.value, 0).toLocaleString('id-ID')}</span>
                              </div>
                           </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="SPP" stackId="a" fill="var(--primary, #65528A)" name="SPP Utama" />
                <Bar dataKey="Sosial" stackId="a" fill="var(--secondary, #006A60)" name="Dana Sosial" />
                <Bar dataKey="Wisuda" stackId="a" fill="#3B82F6" name="Wisuda" />
                <Bar dataKey="Cuti" stackId="a" fill="#D97706" name="Cuti" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeTab === 'spp' ? (
              <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary, #65528A)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary, #65528A)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant, #E5E7EB)" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10, fontWeight: 755 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ stroke: 'var(--primary, #65528A)', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const headerLabel = viewMode === 'daily'
                        ? (payload[0].payload.fullName || `${label} ${selectedMonthStr}`)
                        : `${payload[0].payload.fullName || label} ${selectedYear}`;
                      return (
                        <div className="bg-surface-container-highest/95 backdrop-blur-md dark:bg-zinc-950/95 dark:text-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xl border border-outline-variant/30 text-on-surface text-xs font-bold">
                           <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2">{headerLabel}</p>
                           <p className="text-sm font-display font-black text-primary">Rp {payload[0].value.toLocaleString('id-ID')}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="SPP" stroke="var(--primary, #65528A)" strokeWidth={3} fillOpacity={1} fill="url(#colorSpp)" name="SPP Utama" />
              </AreaChart>
            ) : activeTab === 'sosial' ? (
              <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSosial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary, #006A60)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--secondary, #006A60)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant, #E5E7EB)" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10, fontWeight: 755 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ stroke: 'var(--secondary, #006A60)', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const headerLabel = viewMode === 'daily'
                        ? (payload[0].payload.fullName || `${label} ${selectedMonthStr}`)
                        : `${payload[0].payload.fullName || label} ${selectedYear}`;
                      return (
                        <div className="bg-surface-container-highest/95 backdrop-blur-md dark:bg-zinc-950/95 dark:text-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xl border border-outline-variant/30 text-on-surface text-xs font-bold">
                           <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2">{headerLabel}</p>
                           <p className="text-sm font-display font-black text-secondary">Rp {payload[0].value.toLocaleString('id-ID')}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="Sosial" stroke="var(--secondary, #006A60)" strokeWidth={3} fillOpacity={1} fill="url(#colorSosial)" name="Dana Sosial" />
              </AreaChart>
            ) : activeTab === 'wisuda' ? (
              <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant, #E5E7EB)" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10, fontWeight: 755 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--outline-variant, #E5E7EB)', opacity: 0.1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const headerLabel = viewMode === 'daily'
                        ? (payload[0].payload.fullName || `${label} ${selectedMonthStr}`)
                        : `${payload[0].payload.fullName || label} ${selectedYear}`;
                      return (
                        <div className="bg-surface-container-highest/95 backdrop-blur-md dark:bg-zinc-950/95 dark:text-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xl border border-outline-variant/30 text-on-surface text-xs font-bold">
                           <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2">{headerLabel}</p>
                           <p className="text-sm font-display font-black text-blue-600">Rp {payload[0].value.toLocaleString('id-ID')}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Wisuda" fill="#3B82F6" name="Wisuda" radius={[6, 6, 0, 0]} barSize={viewMode === 'daily' ? 10 : 25} />
              </BarChart>
            ) : (
              <BarChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--outline-variant, #E5E7EB)" strokeOpacity={0.15} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10, fontWeight: 755 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--outline, #6b7280)', fontSize: 10 }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--outline-variant, #E5E7EB)', opacity: 0.1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const headerLabel = viewMode === 'daily'
                        ? (payload[0].payload.fullName || `${label} ${selectedMonthStr}`)
                        : `${payload[0].payload.fullName || label} ${selectedYear}`;
                      return (
                        <div className="bg-surface-container-highest/95 backdrop-blur-md dark:bg-zinc-950/95 dark:text-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xl border border-outline-variant/30 text-on-surface text-xs font-bold">
                           <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2">{headerLabel}</p>
                           <p className="text-sm font-display font-black text-amber-600">Rp {payload[0].value.toLocaleString('id-ID')}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Cuti" fill="#D97706" name="Cuti" radius={[6, 6, 0, 0]} barSize={viewMode === 'daily' ? 10 : 25} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
