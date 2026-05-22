import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Calendar, Users, AlertCircle, FileSpreadsheet, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { studentService, paymentService } from '../services/paymentService';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export default function Arrears() {
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }));

  useEffect(() => {
    let studentsLoaded = false;
    let paymentsLoaded = false;

    const unsubStudents = studentService.listenStudents((data) => {
      setStudents(data);
      studentsLoaded = true;
      if (studentsLoaded && paymentsLoaded) {
        setLoading(false);
      }
    });

    const unsubPayments = paymentService.listenPayments((data) => {
      setPayments(data);
      paymentsLoaded = true;
      if (studentsLoaded && paymentsLoaded) {
        setLoading(false);
      }
    });

    // Fallback if data is returned immediately or offline
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => {
      unsubStudents();
      unsubPayments();
      clearTimeout(timer);
    };
  }, []);

  const classes = ['Semua Kelas', ...new Set(students.map(s => s.className))];
  
  // Logical months for selection (last 12 months)
  const lastMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  });

  const arrearsData = students.filter(student => {
    // Basic filters
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (student.nis && student.nis.includes(searchTerm));
    const matchesClass = selectedClass === 'Semua Kelas' || student.className === selectedClass;
    
    if (!matchesSearch || !matchesClass) return false;

    // Check if paid for selected month
    const isPaid = payments.some(p => 
      p.studentId === student.id && 
      p.month === selectedMonth && 
      p.status === 'approved' &&
      (
        (p.type && p.type.toLowerCase().includes('spp')) || 
        (p.paymentItems && p.paymentItems.some((i: any) => i.type && i.type.toLowerCase().includes('spp')))
      )
    );

    return !isPaid;
  });

  const totalArrearsAmount = arrearsData.reduce((acc, s) => acc + (s.monthlyFee || 250000) + 10000, 0);

  const exportToExcel = () => {
    const data = arrearsData.map(s => ({
      'Nama Siswa': s.name,
      'NIS': s.nis || '-',
      'Kelas': s.className,
      'Bulan Tunggakan': selectedMonth,
      'Estimasi SPP': s.monthlyFee || 250000,
      'Dana Sosial': 10000,
      'Total Tunggakan': (s.monthlyFee || 250000) + 10000
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tunggakan');
    XLSX.writeFile(wb, `Tunggakan_${selectedMonth.replace(' ', '_')}.xlsx`);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-end gap-3 mb-6">
        <button 
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-green-600/10 hover:scale-[1.02] transition-all text-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-outline-variant/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Total Siswa Menunggak</span>
          </div>
          <p className="text-3xl font-display font-bold text-on-surface">{arrearsData.length}</p>
        </div>
        
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10 hover:border-error-container/30 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-all duration-300" />
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-error" />
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Total Estimasi Tunggakan</span>
          </div>
          <p className="text-3xl font-display font-bold text-error">Rp {totalArrearsAmount.toLocaleString()}</p>
        </div>
        
        {/* Filters */}
        <div className="bg-surface-container-lowest p-3 sm:p-2 rounded-[24px] sm:rounded-[32px] border border-outline-variant/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pr-3 sm:pr-6 col-span-1 md:col-span-2 shadow-sm transition-all duration-300 hover:border-outline-variant/25">
          <div className="flex-1 relative min-w-[180px] bg-surface-container-low sm:bg-transparent px-3 sm:px-0 rounded-2xl sm:rounded-none flex items-center">
            <Search className="absolute left-5 sm:left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text"
              placeholder="Cari siswa atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 pl-11 h-12 text-sm font-bold focus:outline-none"
            />
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-outline-variant/20 mx-1" />
          
          <div className="flex items-center gap-3 bg-surface-container-low sm:bg-transparent px-4 py-2 sm:p-0 rounded-2xl sm:rounded-none relative">
            <Filter className="w-4 h-4 text-outline flex-shrink-0" />
            <div className="flex-1 relative">
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold appearance-none cursor-pointer pr-10 py-1.5 focus:outline-none text-on-surface"
              >
                {classes.map(c => <option className="bg-surface-container text-on-surface font-bold" key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-outline/65 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          <div className="hidden sm:block h-8 w-px bg-outline-variant/20 mx-1" />
          
          <div className="flex items-center gap-3 bg-surface-container-low sm:bg-transparent px-4 py-2 sm:p-0 rounded-2xl sm:rounded-none relative">
            <Calendar className="w-4 h-4 text-outline flex-shrink-0" />
            <div className="flex-1 relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold appearance-none cursor-pointer pr-10 py-1.5 focus:outline-none text-on-surface"
              >
                {lastMonths.map(m => <option className="bg-surface-container text-on-surface font-bold" key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-outline/65 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-[40px] p-4 sm:p-8 md:p-10 border border-outline-variant/10 shadow-sm">
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-6 gap-4 border-b border-outline-variant/20 pb-5 px-4 text-[10px] font-black text-outline uppercase tracking-widest">
            <div className="col-span-2">Siswa</div>
            <div>NIS</div>
            <div>Kelas</div>
            <div className="text-right">Jumlah</div>
            <div className="text-right">Bulan</div>
          </div>
          
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-on-surface-variant font-bold text-sm">Memuat data tunggakan...</p>
            </div>
          ) : (
            <AnimatePresence>
              {arrearsData.length > 0 ? arrearsData.map((s, i) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group p-5 md:px-4 rounded-3xl md:rounded-none md:border-b border-outline-variant/5 hover:bg-surface-container-low transition-all bg-surface-container-low md:bg-transparent flex flex-col md:grid md:grid-cols-6 gap-4 md:items-center"
                >
                  <div className="col-span-2">
                    <p className="font-bold text-on-surface text-lg md:text-base">{s.name}</p>
                    <p className="text-[10px] text-outline font-bold uppercase tracking-tighter">{s.parentName || 'Nama Orang Tua -'}</p>
                  </div>
                  <div className="flex md:block items-center justify-between">
                    <span className="md:hidden text-[10px] font-black uppercase text-outline">NIS</span>
                    <span className="px-2 py-1 bg-surface-container md:bg-primary/5 text-primary md:text-on-surface rounded-lg text-xs font-mono font-bold">{s.nis || 'BE-000'}</span>
                  </div>
                  <div className="flex md:block items-center justify-between">
                    <span className="md:hidden text-[10px] font-black uppercase text-outline">Kelas</span>
                    <span className="text-sm font-bold text-on-surface-variant">{s.className}</span>
                  </div>
                  <div className="flex md:block items-center justify-between md:text-right">
                    <span className="md:hidden text-[10px] font-black uppercase text-outline">Jumlah</span>
                    <span className="text-sm font-bold text-on-surface font-mono">Rp {((s.monthlyFee || 250000) + 10000).toLocaleString()}</span>
                  </div>
                  <div className="flex md:block items-center justify-between md:text-right">
                    <span className="md:hidden text-[10px] font-black uppercase text-outline">Periode</span>
                    <span className="text-sm font-bold text-error italic">{selectedMonth}</span>
                  </div>
                </motion.div>
              )) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="text-on-surface-variant font-bold">Semua siswa sudah lunas untuk bulan ini!</p>
                  <p className="text-xs text-outline mt-1">Tidak ada tunggakan yang ditemukan.</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
