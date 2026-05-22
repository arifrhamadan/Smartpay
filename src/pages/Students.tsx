import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  User, 
  FileSpreadsheet, 
  Upload, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  School,
  Database,
  Calendar,
  MapPin,
  Phone,
  BookOpen
} from 'lucide-react';
import { studentService, paymentService } from '../services/paymentService';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/firebase';
import * as XLSX from 'xlsx';
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

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  
  // Excel Import UI State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateFee = (studentType: string, meetingPackage: string) => {
    if (studentType === 'Baru' || studentType === 'Murid Baru') {
      return meetingPackage === '16x' ? 325000 : 275000;
    } else {
      return meetingPackage === '16x' ? 300000 : 250000;
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    parentName: '',
    parentPhone: '',
    classId: '',
    className: '',
    studentType: 'Reguler',
    meetingPackage: '12x',
    monthlyFee: 250000,
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '',
    phone: '',
    address: ''
  });

  React.useEffect(() => {
    const unsubscribeStudents = studentService.listenStudents((data) => {
      setStudents(data);
    });
    const unsubscribePayments = paymentService.listenPayments((data) => {
      setPayments(data);
    });
    return () => {
      unsubscribeStudents();
      unsubscribePayments();
    };
  }, []);

  const filteredStudents = students.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.nis && s.nis.includes(searchTerm)) ||
    (s.phone && s.phone.includes(searchTerm)) ||
    (s.parentPhone && s.parentPhone.includes(searchTerm)) ||
    (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStudentArrearsAndHistory = (studentId: string, studentFee: number) => {
    const history = payments.filter(p => p.studentId === studentId);
    const checkMonths = Array.from({ length: 4 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    });

    const unpaidMonthsDetail: string[] = [];
    let arrearsSum = 0;

    for (const m of checkMonths) {
      const isPaid = history.some(p => 
        p.month === m && 
        p.status === 'approved' &&
        (
          (p.type && p.type.toLowerCase().includes('spp')) || 
          (p.paymentItems && p.paymentItems.some((item: any) => item.type && item.type.toLowerCase().includes('spp')))
        )
      );

      if (!isPaid) {
        unpaidMonthsDetail.push(m);
        arrearsSum += (studentFee || 250000);
      }
    }

    return {
      history,
      unpaidMonthsDetail,
      totalArrears: arrearsSum
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      await studentService.updateStudent(editingStudent.id, formData);
    } else {
      await studentService.addStudent(formData);
    }
    closeModal();
  };

  const editStudent = (student: any) => {
    setEditingStudent(student);
    const sType = student.studentType === 'Baru' || student.studentType === 'Murid Baru' ? 'Baru' : 'Reguler';
    const mPkg = student.meetingPackage || student.packageType || '12x';
    const fee = student.monthlyFee !== undefined ? student.monthlyFee : calculateFee(sType, mPkg);
    setFormData({
      name: student.name || '',
      nis: student.nis || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      classId: student.classId || '',
      className: student.className || '',
      studentType: sType,
      meetingPackage: mPkg,
      monthlyFee: fee,
      gender: student.gender || 'Laki-laki',
      birthPlace: student.birthPlace || '',
      birthDate: student.birthDate || '',
      phone: student.phone || '',
      address: student.address || ''
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setStudentToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (studentToDelete) {
      await studentService.deleteStudent(studentToDelete);
      setIsDeleteConfirmOpen(false);
      setStudentToDelete(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({ 
      name: '', 
      nis: '', 
      parentName: '', 
      parentPhone: '',
      classId: '', 
      className: '',
      studentType: 'Reguler',
      meetingPackage: '12x',
      monthlyFee: 250000,
      gender: 'Laki-laki',
      birthPlace: '',
      birthDate: '',
      phone: '',
      address: ''
    });
  };

  // Excel Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setImportData(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setIsImportLoading(true);
    for (const item of importData) {
      const rawType = item['studentType'] || item['Tipe Murid'] || item['Tipe'] || 'Reguler';
      const studentType = (rawType.toLowerCase().includes('baru') || rawType === 'Murid Baru') ? 'Baru' : 'Reguler';
      
      const rawPkg = String(item['meetingPackage'] || item['Paket'] || item['Sesi'] || '12x');
      const meetingPackage = rawPkg.includes('16') ? '16x' : '12x';
      
      const monthlyFee = Number(item['monthlyFee']) || calculateFee(studentType, meetingPackage);

      const student = {
        name: item['Nama'] || item['Nama Siswa'] || 'Noname',
        nis: String(item['NIS'] || ''),
        parentName: item['Orang Tua'] || item['Nama Orang Tua'] || '',
        parentPhone: item['No Telepon Orang Tua'] || item['parentPhone'] || '',
        classId: item['ID Kelas'] || 'A1',
        className: item['Nama Kelas'] || item['Kelas'] || 'Umum',
        studentType,
        meetingPackage,
        monthlyFee,
        gender: item['Jenis Kelamin'] || item['gender'] || 'Laki-laki',
        birthPlace: item['Tempat Lahir'] || item['birthPlace'] || '',
        birthDate: item['Tanggal Lahir'] || item['birthDate'] || '',
        phone: item['No Telepon'] || item['No Telepon Siswa'] || item['phone'] || '',
        address: item['Alamat Lengkap'] || item['Alamat'] || item['address'] || ''
      };
      await studentService.addStudent(student);
    }
    setIsImportLoading(false);
    setIsImportModalOpen(false);
    setImportData([]);
    alert("Berhasil mengimpor data siswa!");
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        'Nama Siswa': 'Aditya Pratama', 
        'NIS': '1001', 
        'Jenis Kelamin': 'Laki-laki',
        'Nama Orang Tua': 'Pratama', 
        'No Telepon Orang Tua': '08129876543',
        'ID Kelas': 'A1', 
        'Nama Kelas': 'A1 - Playgroup',
        'studentType': 'Reguler',
        'meetingPackage': '12x',
        'monthlyFee': 250000,
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir': '2015-05-12',
        'No Telepon': '08123456789',
        'Alamat Lengkap': 'Jl. Mawar No. 10'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
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
          onClick={() => setIsImportModalOpen(true)}
          className="group px-4 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-all shadow-xs cursor-pointer text-xs border border-outline-variant/10"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
          <span>Import Excel</span>
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa</span>
        </motion.button>
      </div>

      {/* Stats and Search Bar */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <School className="w-5 h-5 text-primary animate-bounce-slow" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Siswa Aktif</span>
          </div>
          <p className="text-3xl font-display font-bold text-primary">{students.length}</p>
        </div>
        
        <div className="bg-surface-container-lowest p-2 rounded-[32px] border border-outline-variant/10 shadow-sm col-span-1 md:col-span-3 flex items-center focus-within:border-primary/50 transition-all">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input 
              type="text"
              placeholder="Cari Nama, NIS, atau Nama Orang Tua..."
              className="w-full bg-transparent border-none focus:ring-0 pl-16 h-14 text-lg font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredStudents.length > 0 ? filteredStudents.map((s, i) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group bg-surface-container-lowest rounded-[40px] p-8 border border-outline-variant/10 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col"
            >
              <div 
                className="cursor-pointer hover:opacity-80 transition-all flex flex-col flex-1"
                onClick={() => setSelectedStudentDetail(s)}
                title="Klik untuk melihat detail lengkap siswa"
              >
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-[24px] bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-300">
                    <User className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-xl leading-tight">{s.name}</h3>
                    <p className="text-sm font-bold text-primary italic mt-0.5">{s.className}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-auto">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-bold uppercase tracking-widest text-[10px]">NIS</span>
                    <span className="font-mono bg-surface-container px-2 py-0.5 rounded text-xs font-bold">{s.nis || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-bold uppercase tracking-widest text-[10px]">Orang Tua</span>
                    <span className="font-bold text-on-surface-variant">{s.parentName || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-bold uppercase tracking-widest text-[10px]">Status Siswa</span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      (s.studentType === 'Murid Baru' || s.studentType === 'Baru') ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-primary/10 text-primary dark:text-primary-light"
                    )}>
                      {(s.studentType === 'Murid Baru' || s.studentType === 'Baru') ? 'Baru' : 'Reguler'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-bold uppercase tracking-widest text-[10px]">Paket SPP</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                      {`${s.meetingPackage || s.packageType || '12x'} Pertemuan`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-bold uppercase tracking-widest text-[10px]">Tarif SPP</span>
                    <span className="font-black text-primary font-display">Rp {(s.monthlyFee || 250000).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-outline-variant/10 flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => editStudent(s)}
                  className="flex-1 py-3 px-4 bg-surface-container hover:bg-primary hover:text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirmDelete(s.id)}
                  className="p-3 bg-error/5 text-error hover:bg-error hover:text-white rounded-2xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-40 text-center bg-surface-container-low/30 rounded-[60px] border-2 border-dashed border-outline-variant/20">
               <Database className="w-20 h-20 mx-auto mb-6 text-outline opacity-20" />
               <h3 className="text-2xl font-display font-bold text-on-surface mb-2">Belum Ada Data Siswa</h3>
               <p className="text-on-surface-variant max-w-sm mx-auto font-medium">Data siswa belum tersedia atau filter tidak ditemukan. Mulai dengan menambah data secara manual atau lewat Excel.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display font-bold">{editingStudent ? 'Koreksi Data' : 'Siswa Baru'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-surface-container rounded-full"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8 text-left">
                {/* 1. DATA UTAMA */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">1. Data Utama</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Nama Lengkap Siswa</label>
                      <input 
                        required
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Nama lengkap siswa..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">NIS (Nomor Induk Siswa)</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.nis}
                        onChange={e => setFormData({...formData, nis: e.target.value})}
                        placeholder="Contoh: 100231"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Jenis Kelamin</label>
                      <select
                        required
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none text-on-surface cursor-pointer"
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Status Siswa</label>
                      <select
                        required
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none text-on-surface cursor-pointer"
                        value={formData.studentType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setFormData({
                            ...formData,
                            studentType: newType,
                            monthlyFee: calculateFee(newType, formData.meetingPackage)
                          });
                        }}
                      >
                        <option value="Reguler">Reguler</option>
                        <option value="Baru">Baru</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Paket Pertemuan</label>
                      <select
                        required
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none text-on-surface cursor-pointer"
                        value={formData.meetingPackage}
                        onChange={(e) => {
                          const newPkg = e.target.value;
                          setFormData({
                            ...formData,
                            meetingPackage: newPkg,
                            monthlyFee: calculateFee(formData.studentType, newPkg)
                          });
                        }}
                      >
                        <option value="12x">12x Pertemuan</option>
                        <option value="16x">16x Pertemuan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">ID Kelas</label>
                      <input 
                        required
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.classId}
                        onChange={e => setFormData({...formData, classId: e.target.value})}
                        placeholder="ID Kelas (A1)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Label Kelas Lengkap</label>
                      <input 
                        required
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.className}
                        onChange={e => setFormData({...formData, className: e.target.value})}
                        placeholder="Playgroup A"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DATA ORANG TUA */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">2. Data Orang Tua</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Nama Orang Tua</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.parentName}
                        onChange={e => setFormData({...formData, parentName: e.target.value})}
                        placeholder="Nama Ayah / Ibu"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">No Telepon Orang Tua</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.parentPhone}
                        onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                        placeholder="Contoh: 08129876543"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. INFORMASI TAMBAHAN */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">3. Informasi Tambahan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Tempat Lahir</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.birthPlace}
                        onChange={e => setFormData({...formData, birthPlace: e.target.value})}
                        placeholder="Kota kelahiran..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Tanggal Lahir</label>
                      <input 
                        type="date"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none text-on-surface cursor-pointer whitespace-nowrap"
                        value={formData.birthDate}
                        onChange={e => setFormData({...formData, birthDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">No Telepon Siswa</label>
                      <input 
                        type="text"
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="No Telepon Siswa..."
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-wider ml-1">Alamat Lengkap</label>
                      <textarea 
                        rows={3}
                        className="w-full bg-surface-container rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all border-none resize-none"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Alamat domisili lengkap..."
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Fee Preview */}
                <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest block">Tarif SPP Bulanan (Otomatis)</span>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">Ditetapkan berdasarkan status dan paket pertemuan.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-black text-primary">
                      Rp {formData.monthlyFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-primary text-white py-4.5 rounded-3xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3">
                  <Check className="w-6 h-6" />
                  <span>Simpan Data Sekarang</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isImportLoading && setIsImportModalOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative w-full max-w-2xl bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 text-green-600 rounded-2xl"><FileSpreadsheet className="w-8 h-8" /></div>
                  <h2 className="text-3xl font-display font-bold">Import Batch</h2>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full"><X className="w-6 h-6" /></button>
              </div>

              {importData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 border-2 border-dashed border-outline-variant/30 rounded-[32px] bg-surface-container-low/20">
                  <Upload className="w-16 h-16 text-outline mb-6 opacity-30" />
                  <p className="font-bold text-on-surface text-lg">Pilih File Excel Siswa</p>
                  <p className="text-on-surface-variant text-sm mb-8">Hanya mendukung format .xlsx atau .xls</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-4 bg-on-surface text-surface rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Pilih File
                  </button>
                  <button onClick={downloadTemplate} className="mt-4 text-[10px] uppercase font-black text-primary tracking-widest hover:underline">Unduh Template Disini</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-sm font-bold text-on-surface">Pratinjau Data</p>
                      <p className="text-xs text-outline">{importData.length} baris data ditemukan</p>
                    </div>
                    <button onClick={() => setImportData([])} className="text-xs text-error font-bold flex items-center gap-1 hover:underline"><RefreshCcw className="w-3 h-3" /> Ganti File</button>
                  </div>
                  <div className="flex-1 overflow-y-auto rounded-2xl border border-outline-variant/20 mb-6 no-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container sticky top-0">
                        <tr>
                          <th className="p-3 text-[10px] font-black uppercase tracking-widest text-outline">Nama</th>
                          <th className="p-3 text-[10px] font-black uppercase tracking-widest text-outline">NIS</th>
                          <th className="p-3 text-[10px] font-black uppercase tracking-widest text-outline">Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 font-bold text-xs">
                        {importData.slice(0, 50).map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-3">{row['Nama'] || row['Nama Siswa'] || 'N/A'}</td>
                            <td className="p-3">{row['NIS'] || '-'}</td>
                            <td className="p-3">{row['Kelas'] || row['Nama Kelas'] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button 
                    onClick={handleImport}
                    disabled={isImportLoading}
                    className="w-full bg-green-600 text-white py-5 rounded-3xl font-bold text-xl hover:shadow-2xl hover:shadow-green-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isImportLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <FileCheck className="w-7 h-7" />}
                    <span>Impor Sekarang</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteConfirmOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-surface-container-lowest rounded-[40px] p-10 shadow-2xl text-center">
              <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">Hapus Data?</h3>
              <p className="text-on-surface-variant font-medium text-sm mb-10 italic">Siswa akan dipindahkan ke folder sampah (soft-delete) untuk sementara waktu.</p>
              <div className="flex gap-4">
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-4 bg-surface-container rounded-2xl font-bold hover:bg-surface-container-high transition-all">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-4 bg-error text-white rounded-2xl font-bold hover:shadow-xl shadow-error/20 transition-all">Ya, Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudentDetail && (() => {
          const { history, unpaidMonthsDetail, totalArrears } = getStudentArrearsAndHistory(selectedStudentDetail.id, selectedStudentDetail.monthlyFee);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedStudentDetail(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-3xl bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8 border-b border-outline-variant/15 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-on-surface">{selectedStudentDetail.name}</h2>
                      <p className="text-sm font-bold text-primary italic">{selectedStudentDetail.className} (Kelas: {selectedStudentDetail.classId})</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudentDetail(null)} className="p-2 hover:bg-surface-container rounded-full"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-8 text-left">
                  {/* Grid 1: Personal and Student Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-container-low/50 p-6 rounded-[32px] border border-outline-variant/10">
                    <div>
                      <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Profil & Info Utama</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">NIS:</span>
                          <span className="font-mono font-bold text-on-surface">{selectedStudentDetail.nis || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">Jenis Kelamin:</span>
                          <span className="font-bold text-on-surface">{selectedStudentDetail.gender || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">Status Siswa:</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            (selectedStudentDetail.studentType === 'Murid Baru' || selectedStudentDetail.studentType === 'Baru') ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-primary/10 text-primary dark:text-primary-light"
                          )}>
                            {(selectedStudentDetail.studentType === 'Murid Baru' || selectedStudentDetail.studentType === 'Baru') ? 'Baru' : 'Reguler'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">Paket Pertemuan:</span>
                          <span className="font-bold text-on-surface">{selectedStudentDetail.meetingPackage || selectedStudentDetail.packageType || '12x'} Pertemuan</span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5">
                          <span className="text-outline font-medium">Tarif SPP Bulanan:</span>
                          <span className="font-black text-primary">Rp {(selectedStudentDetail.monthlyFee || 250000).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">TTL & Kontak Siswa</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">Tempat Lahir:</span>
                          <span className="font-bold text-on-surface">{selectedStudentDetail.birthPlace || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">Tanggal Lahir:</span>
                          <span className="font-bold text-on-surface">{selectedStudentDetail.birthDate ? new Date(selectedStudentDetail.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/10">
                          <span className="text-outline font-medium">No Telepon:</span>
                          <span className="font-mono font-bold text-on-surface">{selectedStudentDetail.phone || '-'}</span>
                        </div>
                        <div className="flex flex-col text-sm py-1.5">
                          <span className="text-outline font-medium mb-1">Alamat Lengkap:</span>
                          <span className="font-bold text-on-surface text-xs leading-relaxed bg-surface-container rounded-xl p-3 mt-1 block max-h-[80px] overflow-y-auto whitespace-pre-wrap">{selectedStudentDetail.address || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Parents Info */}
                  <div className="bg-surface-container-low/50 p-6 rounded-[32px] border border-outline-variant/10">
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Orang Tua / Wali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-outline font-medium">Nama Orang Tua:</span>
                        <span className="font-bold text-on-surface">{selectedStudentDetail.parentName || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-outline font-medium">No Telepon Orang Tua:</span>
                        <span className="font-mono font-bold text-primary flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          {selectedStudentDetail.parentPhone || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrears Summary Box */}
                  <div className={cn(
                    "p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between gap-6",
                    totalArrears > 0 ? "bg-error/5 border-error/15 text-error" : "bg-green-500/5 border-green-500/15 text-green-600"
                  )}>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest block opacity-75">Tunggakan SPP Terhitung</span>
                      <p className="text-2xl font-display font-black mt-1">Rp {(totalArrears + (totalArrears > 0 ? 10000 : 0)).toLocaleString('id-ID')}</p>
                      {unpaidMonthsDetail.length > 0 && (
                        <p className="text-xs font-medium mt-1 dark:text-error-light opacity-90">
                          Berdasarkan sirkulasi pembayaran {unpaidMonthsDetail.length} bulan terakhir: {unpaidMonthsDetail.join(', ')} (Termasuk Dana Sosial Rp10.000)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "px-4 py-2 rounded-2xl text-xs font-bold",
                        totalArrears > 0 ? "bg-error/10 text-error animate-pulse" : "bg-green-500/10 text-green-600"
                      )}>
                        {totalArrears > 0 ? `Lunas Bayar Kurang: ${unpaidMonthsDetail.length} Bulan` : 'Lunas Sempurna'}
                      </span>
                    </div>
                  </div>

                  {/* Payment History Section */}
                  <div>
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Riwayat Pembayaran Terbaru</h3>
                    {history.length > 0 ? (
                      <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-low max-h-[250px] overflow-y-auto no-scrollbar">
                        <table className="w-full text-left">
                          <thead className="bg-surface-container sticky top-0 text-[10px] font-black uppercase tracking-wider text-outline border-b border-outline-variant/10">
                            <tr>
                              <th className="p-4">Tanggal</th>
                              <th className="p-4">Bulan</th>
                              <th className="p-4">Kategori</th>
                              <th className="p-4">Slip</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/5 text-xs font-bold">
                            {history.map((h, hIdx) => (
                              <tr key={hIdx} className="hover:bg-surface-container/30 transition-colors">
                                <td className="p-4 text-on-surface-variant">
                                  {h.createdAt ? new Date(h.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}
                                </td>
                                <td className="p-4 text-on-surface">{h.month}</td>
                                <td className="p-4">
                                  <span className="capitalize">{h.type || 'Lainnya'}</span>
                                </td>
                                <td className="p-4">
                                  {h.receiptUrl ? (
                                    <a href={h.receiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                      Lihat Slip
                                    </a>
                                  ) : '-'}
                                </td>
                                <td className="p-4">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                    h.status === 'approved' ? "bg-green-500/10 text-green-600" :
                                    h.status === 'pending' ? "bg-amber-500/10 text-amber-600" :
                                    "bg-error/10 text-error"
                                  )}>
                                    {h.status === 'approved' ? 'Disetujui' : h.status === 'pending' ? 'Tertunda' : 'Ditolak'}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-black text-primary">
                                  Rp {(h.amount || 0).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-surface-container-low/30 rounded-3xl border border-dashed border-outline-variant/10">
                        <AlertCircle className="w-8 h-8 text-outline mx-auto opacity-30 mb-2" />
                        <p className="text-on-surface-variant font-medium text-xs">Belum ada transaksi pembayaran disetorkan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
