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
  Database
} from 'lucide-react';
import { studentService } from '../services/paymentService';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/firebase';
import * as XLSX from 'xlsx';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
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

  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    parentName: '',
    classId: '',
    className: ''
  });

  React.useEffect(() => {
    const unsubscribe = studentService.listenStudents((data) => {
      setStudents(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nis && s.nis.includes(searchTerm)) ||
    (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setFormData({
      name: student.name,
      nis: student.nis || '',
      parentName: student.parentName || '',
      classId: student.classId,
      className: student.className
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
    setFormData({ name: '', nis: '', parentName: '', classId: '', className: '' });
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
      const student = {
        name: item['Nama'] || item['Nama Siswa'] || 'Noname',
        nis: String(item['NIS'] || ''),
        parentName: item['Orang Tua'] || item['Nama Orang Tua'] || '',
        classId: item['ID Kelas'] || 'A1',
        className: item['Nama Kelas'] || item['Kelas'] || 'Umum',
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
      { 'Nama Siswa': 'Aditya Pratama', 'NIS': '1001', 'Nama Orang Tua': 'Pratama', 'ID Kelas': 'A1', 'Nama Kelas': 'A1 - Playgroup' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-on-surface font-display text-4xl font-bold mb-2">Manajemen Siswa</h2>
          <p className="text-on-surface-variant font-medium text-lg italic opacity-80">Profesionalkan pendataan siswa sekolah Anda.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="group px-6 py-3.5 bg-surface-container-high text-on-surface rounded-2xl font-bold flex items-center gap-3 hover:bg-surface-container-highest transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
            <span>Import Excel</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </header>

      {/* Stats and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <School className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Siswa Aktif</span>
          </div>
          <p className="text-3xl font-display font-bold text-primary">{students.length}</p>
        </div>
        
        <div className="bg-surface-container-lowest p-2 rounded-[32px] border border-outline-variant/10 shadow-sm col-span-1 md:col-span-3 flex items-center">
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
      </div>

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
              </div>

              <div className="mt-8 pt-6 border-t border-outline-variant/10 flex gap-2">
                <button 
                  onClick={() => editStudent(s)}
                  className="flex-1 py-3 px-4 bg-surface-container hover:bg-primary hover:text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => confirmDelete(s.id)}
                  className="p-3 bg-error/5 text-error hover:bg-error hover:text-white rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-surface-container-lowest rounded-[48px] p-8 md:p-12 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-display font-bold">{editingStudent ? 'Koreksi Data' : 'Siswa Baru'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-surface-container rounded-full"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Nama Lengkap Siswa</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-surface-container rounded-2xl px-6 py-4 font-bold text-lg focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Input nama lengkap..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Nomor Induk Siswa (NIS)</label>
                    <input 
                      type="text"
                      className="w-full bg-surface-container rounded-2xl px-6 py-4 font-bold focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.nis}
                      onChange={e => setFormData({...formData, nis: e.target.value})}
                      placeholder="Contoh: 100231"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Nama Orang Tua</label>
                    <input 
                      type="text"
                      className="w-full bg-surface-container rounded-2xl px-6 py-4 font-bold focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.parentName}
                      onChange={e => setFormData({...formData, parentName: e.target.value})}
                      placeholder="Ayah / Ibu kandung"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">ID Kelas</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-surface-container rounded-2xl px-6 py-4 font-bold focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.classId}
                      onChange={e => setFormData({...formData, classId: e.target.value})}
                      placeholder="A-1"
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-outline uppercase tracking-[0.2em] ml-2">Label Kelas Lengkap</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-surface-container rounded-2xl px-6 py-4 font-bold focus:ring-4 focus:ring-primary/10 transition-all border-none"
                      value={formData.className}
                      onChange={e => setFormData({...formData, className: e.target.value})}
                      placeholder="Kindergarten A1"
                    />
                  </div>
                </div>
                
                <button className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-xl hover:shadow-2xl hover:shadow-primary/30 transition-all mt-6 flex items-center justify-center gap-3">
                  <Check className="w-7 h-7" />
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
    </div>
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
