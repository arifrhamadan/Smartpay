import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronDown, 
  Camera, 
  Save, 
  CheckCircle2, 
  FileText, 
  ArrowLeft, 
  MessageCircle, 
  Plus,
  Lock,
  Smartphone,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { paymentService, studentService, configService } from '../services/paymentService';
import { useAuth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function PaymentInput() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    month: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
    method: 'Cash',
    bankName: '',
    proofFile: null as File | null,
    notes: '',
    discount: 0,
  });

  const [selectedItems, setSelectedItems] = useState<{type: string, amount: number, isManual?: boolean}[]>([]);

  const paymentTypes = [
    { id: 'spp', label: 'SPP Bulanan', defaultAmount: 0 },
    { id: 'sosial', label: 'Dana Sosial', defaultAmount: 10000 },
    { id: 'wisuda', label: 'Wisuda', defaultAmount: 500000 },
  ];

  useEffect(() => {
    const unsubscribe = studentService.listenStudents((data) => {
      setStudents(data);
    });
    
    configService.getConfig().then(cfg => {
      setConfig(cfg);
    });
    
    return () => unsubscribe();
  }, []);

  const isMonthLocked = config?.lockedMonths?.includes(formData.month);

  const handleStudentSearch = (name: string) => {
    setFormData({ ...formData, studentName: name, studentId: '' });
    setSelectedStudent(null);
    setSelectedItems([]); // Reset items when student changes
    if (name.length >= 0) {
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(name.toLowerCase()) ||
        s.className.toLowerCase().includes(name.toLowerCase()) ||
        (s.nis && s.nis.includes(name))
      );
      setFilteredStudents(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectStudent = (student: any) => {
    setFormData({ 
      ...formData, 
      studentName: student.name, 
      studentId: student.id 
    });
    setSelectedStudent(student);
    setShowDropdown(false);
  };

  const toggleItem = (type: {id: string, label: string, defaultAmount: number, isManual?: boolean}) => {
    const exists = selectedItems.find(i => i.type === type.label);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.type !== type.label));
    } else {
      let amount = type.defaultAmount;
      if (type.id === 'spp' && selectedStudent) {
        amount = selectedStudent.monthlyFee || 250000;
      } else if (config?.prices?.[type.id]) {
        amount = config.prices[type.id];
      }
      setSelectedItems([...selectedItems, { type: type.label, amount, isManual: type.isManual }]);
    }
  };

  const updateItemAmount = (label: string, newAmount: number) => {
    setSelectedItems(selectedItems.map(i => i.type === label ? { ...i, amount: newAmount } : i));
  };

  const subtotal = selectedItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalAmount = Math.max(0, subtotal - formData.discount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran file awal maksimal 10MB");
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert("Format file harus JPG, PNG, atau PDF");
        return;
      }
      setFormData({ ...formData, proofFile: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMonthLocked) {
      alert("Input terkunci! Periode pembayaran ini telah dikunci oleh administrator.");
      return;
    }
    if (!formData.studentId) {
      alert("Harap pilih siswa dari daftar yang tersedia.");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Pilih minimal satu jenis pembayaran.");
      return;
    }
    if (!formData.proofFile) {
      alert("Wajib mengunggah bukti pembayaran.");
      return;
    }
    if (!user) {
      alert("Sesi Anda berakhir. Harap login kembali.");
      return;
    }
    
    setIsLoading(true);
    setUploadProgress(0);

    let fileToUpload = formData.proofFile;

    if (fileToUpload.type.includes('image')) {
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(fileToUpload, options);
      } catch (error) {
        console.error("Compression failed", error);
      } finally {
        setIsCompressing(false);
      }
    }

    try {
      const proofUrl = await paymentService.uploadProof(fileToUpload, (progress) => {
        setUploadProgress(progress);
      });
      
      const sanitizedItems = selectedItems.map(item => ({
        type: item.type,
        amount: item.amount,
        ...(item.isManual !== undefined && { isManual: item.isManual })
      }));

      await paymentService.addPayment({
        studentId: formData.studentId,
        studentName: formData.studentName,
        month: formData.month,
        amount: totalAmount, // For backward compatibility/summary
        subtotal,
        discount: formData.discount,
        paymentItems: sanitizedItems,
        method: formData.method,
        bankName: formData.method === 'Transfer Bank' ? (formData.bankName || 'Unknown') : '',
        proofUrl,
        notes: formData.notes || '',
        type: selectedItems.length === 1 ? selectedItems[0].type.toLowerCase() : 'multi'
      });
      
      setIsSuccess(true);
      setTimeout(() => navigate('/reports'), 2000);
    } catch (error: any) {
      console.error("Failed to save payment", error);
      alert("Gagal menyimpan data: " + (error.message || "Kesalahan tidak diketahui"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-40 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-4 rounded-3xl bg-surface-container border border-outline-variant/10 text-primary hover:bg-surface-container-high transition-all"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <div>
             <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">Multi-Item Payment</h1>
             <p className="text-on-surface-variant font-medium text-lg mt-1 italic">Input beberapa tagihan sekaligus dalam satu transaksi.</p>
          </div>
        </div>
      </header>

      {isMonthLocked && (
        <section className="bg-error/10 border-2 border-error/20 p-8 rounded-[40px] flex items-center gap-6 text-error">
           <Lock className="w-10 h-10" />
           <div>
              <h3 className="text-xl font-display font-bold">Periode {formData.month} Diterkunci</h3>
              <p className="font-medium opacity-80">Administrator telah mengunci periode ini untuk proses audit.</p>
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-primary" /> Informasi Siswa
            </h3>
            
            <div className="space-y-4 relative">
              <div className="relative">
                <input 
                  className="w-full h-20 px-8 rounded-[32px] bg-surface-container font-bold text-xl border-none focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                  placeholder="Cari Nama Siswa atau NIS..." 
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  onFocus={() => formData.studentName && setShowDropdown(true)}
                  required
                />
                <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-outline w-6 h-6" />
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 w-full mt-4 bg-white border border-outline-variant/30 rounded-[32px] shadow-2xl overflow-hidden"
                  >
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredStudents.length > 0 ? filteredStudents.slice(0, 10).map((s) => (
                        <button
                          key={s.id} type="button" onClick={() => selectStudent(s)}
                          className="w-full px-8 py-5 text-left hover:bg-primary/5 flex items-center gap-4 transition-colors border-b border-outline-variant/5 last:border-0"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold">{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-on-surface text-lg">{s.name}</p>
                            <p className="text-xs text-on-surface-variant font-medium">{s.className} | {s.nis || 'No-NIS'}</p>
                          </div>
                        </button>
                      )) : (
                        <div className="p-12 text-center text-outline">Tidak ada siswa ditemukan.</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                 <div className="relative">
                    <label className="text-[10px] font-black text-outline uppercase tracking-widest mb-2 block ml-4">Periode Bulan</label>
                    <select 
                      required
                      className="w-full h-16 px-6 pr-12 rounded-2xl bg-surface-container font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.month}
                      onChange={e => setFormData({...formData, month: e.target.value})}
                    >
                      {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map(m => {
                        const val = `${m} ${new Date().getFullYear()}`;
                        return <option key={val} value={val}>{val}</option>
                      })}
                    </select>
                    <ChevronDown className="absolute right-4 bottom-5 w-4 h-4 text-outline pointer-events-none" />
                 </div>
                 <div className="relative">
                    <label className="text-[10px] font-black text-outline uppercase tracking-widest mb-2 block ml-4">Metode Bayar</label>
                    <select 
                      className="w-full h-16 px-6 pr-12 rounded-2xl bg-surface-container font-bold text-sm appearance-none outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.method}
                      onChange={e => setFormData({...formData, method: e.target.value})}
                    >
                       <option value="Cash">Cash / Tunai</option>
                       <option value="Transfer Bank">Transfer Bank</option>
                       <option value="Voucher">Voucher / Subsidi</option>
                    </select>
                    <ChevronDown className="absolute right-4 bottom-5 w-4 h-4 text-outline pointer-events-none" />
                 </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-sm border border-outline-variant/10">
            <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" /> Rincian Pembayaran
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {paymentTypes.map((type) => {
                 const isSelected = selectedItems.find(i => i.type === type.label);
                 return (
                   <div 
                    key={type.id}
                    onClick={() => toggleItem(type)}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                      isSelected ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "bg-surface-container border-transparent hover:border-outline-variant/50"
                    )}
                   >
                     <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                         isSelected ? "bg-primary border-primary text-white" : "border-outline-variant bg-white"
                       )}>
                         {isSelected && <CheckCircle2 className="w-4 h-4" />}
                       </div>
                       <span className={cn("font-bold", isSelected ? "text-primary" : "text-on-surface")}>{type.label}</span>
                     </div>
                     {isSelected && isSelected.isManual ? (
                       <input 
                        type="number"
                        placeholder="Rp 0"
                        value={isSelected.amount}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateItemAmount(type.label, Number(e.target.value))}
                        className="w-28 bg-white rounded-xl px-3 py-2 text-primary font-bold text-right outline-none ring-1 ring-primary/20"
                       />
                     ) : (
                       <span className="font-display font-bold text-outline">
                         Rp {((type.id === 'spp' && selectedStudent) ? (selectedStudent.monthlyFee || 250000) : (config?.prices?.[type.id] || type.defaultAmount)).toLocaleString()}
                       </span>
                     )}
                   </div>
                 );
               })}
            </div>
            
            <div className="mt-10 pt-10 border-t border-outline-variant/10">
               <div className="space-y-4 max-w-md">
                  <label className="text-[10px] font-black text-outline uppercase tracking-widest ml-4">Voucher / Potongan (Rp)</label>
                  <input 
                    type="number"
                    value={formData.discount || ''}
                    onChange={e => setFormData({...formData, discount: Number(e.target.value)})}
                    placeholder="Contoh: 75000"
                    className="w-full h-16 px-6 rounded-3xl bg-surface-container font-bold text-error outline-none focus:ring-2 focus:ring-error/20 transition-all"
                  />
               </div>
            </div>
          </section>
        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-8">
           <div className="bg-primary rounded-[48px] p-10 text-white shadow-2xl sticky top-24 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <h3 className="text-xl font-display font-bold mb-8 border-b border-white/10 pb-4">Ringkasan Bayar</h3>
              
              <div className="space-y-4 mb-8 min-h-[150px]">
                 {selectedItems.length > 0 ? selectedItems.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center text-sm font-medium">
                      <span className="opacity-70">{item.type}</span>
                      <span className="font-bold">Rp {item.amount.toLocaleString()}</span>
                   </div>
                 )) : (
                   <div className="h-full flex items-center justify-center italic opacity-40 text-xs">Belum ada item dipilih.</div>
                 )}
              </div>

              <div className="space-y-1 mb-8 pt-6 border-t border-white/5">
                 <div className="flex justify-between text-xs opacity-60">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-xs text-red-300">
                    <span>Diskon / Subsidi</span>
                    <span>- Rp {formData.discount.toLocaleString()}</span>
                 </div>
              </div>

              <div className="mb-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Total Pembayaran</p>
                 <h2 className="text-4xl font-display font-bold tabular-nums">Rp {totalAmount.toLocaleString()}</h2>
              </div>

              <div className="space-y-4">
                 <div className="relative">
                    <input type="file" id="proof" className="hidden" onChange={handleFileChange} />
                    <label 
                      htmlFor="proof" 
                      className={cn(
                        "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold cursor-pointer transition-all border-2 border-dashed",
                        formData.proofFile ? "bg-white text-primary border-white" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      )}
                    >
                       <Camera className="w-5 h-5" />
                       <span className="text-sm">{formData.proofFile ? "Bukti Terlampir" : "Unggah Bukti"}</span>
                    </label>
                    {formData.proofFile && <p className="text-[10px] text-center mt-2 opacity-60 truncate px-4">{formData.proofFile.name}</p>}
                 </div>

                 <button 
                  onClick={handleSubmit}
                  disabled={isLoading || isMonthLocked || !selectedStudent || selectedItems.length === 0}
                  className={cn(
                    "w-full h-16 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                    isLoading ? "bg-white/20 text-white cursor-wait" : "bg-white text-primary hover:scale-[1.03] shadow-xl disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                 >
                   {isLoading ? (
                     <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <>
                        <Save className="w-6 h-6" />
                        <span>Kirim Transaksi</span>
                     </>
                   )}
                 </button>
              </div>
           </div>

           <div className="p-8 bg-primary/5 rounded-[40px] border border-primary/10">
              <div className="flex items-center gap-4 mb-4">
                 <AlertCircle className="w-5 h-5 text-primary" />
                 <h4 className="text-sm font-bold text-on-surface">Informasi Penting</h4>
              </div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                 Pastikan nominal yang Anda masukkan sesuai dengan bukti transfer. Transaksi yang sudah dikirim akan masuk antrean verifikasi Ketua Unit.
              </p>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
            <div className="bg-primary p-8 rounded-[40px] text-white shadow-2xl flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary shadow-xl shrink-0"><CheckCircle2 className="w-10 h-10" /></div>
              <div><h4 className="text-xl font-display font-bold">Sukses!</h4><p className="text-sm font-medium opacity-80">Pembayaran berhasil dicatat.</p></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
