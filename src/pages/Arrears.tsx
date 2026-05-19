import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Calendar, Users, AlertCircle, FileSpreadsheet, FileText, ChevronRight } from 'lucide-react';
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
    const unsubStudents = studentService.listenStudents(setStudents);
    const unsubPayments = paymentService.listenPayments(setPayments);
    setLoading(false);
    return () => {
      unsubStudents();
      unsubPayments();
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
      (p.type === 'spp' || (p.paymentItems && p.paymentItems.some((i: any) => i.type.includes('SPP'))))
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-on-surface font-display text-3xl font-bold mb-1">Data Tunggakan</h2>
          <p className="text-on-surface-variant text-base font-medium">Monitoring siswa yang belum menyelesaikan pembayaran.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 hover:scale-[1.02] transition-all"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Total Siswa Menunggak</span>
          </div>
          <p className="text-3xl font-display font-bold text-on-surface">{arrearsData.length}</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-error" />
            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Total Estimasi Tunggakan</span>
          </div>
          <p className="text-3xl font-display font-bold text-error">Rp {totalArrearsAmount.toLocaleString()}</p>
        </div>
        
        {/* Filters */}
        <div className="bg-surface-container-lowest p-2 rounded-[32px] border border-outline-variant/10 flex items-center gap-3 pr-6 col-span-1 md:col-span-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text"
              placeholder="Cari siswa atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 pl-10 h-12 text-sm font-bold"
            />
          </div>
          <div className="h-8 w-px bg-outline-variant/20 mx-2" />
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-outline" />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold appearance-none cursor-pointer pr-8"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="h-8 w-px bg-outline-variant/20 mx-2" />
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-outline" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold appearance-none cursor-pointer pr-8"
            >
              {lastMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-[40px] p-4 sm:p-8 md:p-10 border border-outline-variant/10 shadow-sm">
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-5 gap-4 border-b border-outline-variant/20 pb-5 px-4 text-[10px] font-black text-outline uppercase tracking-widest">
            <div className="col-span-2">Siswa</div>
            <div>NIS</div>
            <div>Kelas</div>
            <div className="text-right">Bulan</div>
          </div>
          
          <AnimatePresence>
            {arrearsData.length > 0 ? arrearsData.map((s, i) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-5 md:px-4 rounded-3xl md:rounded-none md:border-b border-outline-variant/5 hover:bg-surface-container-low transition-all bg-surface-container-low md:bg-transparent flex flex-col md:grid md:grid-cols-5 gap-4 md:items-center"
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
        </div>
      </div>
    </div>
  );
}
