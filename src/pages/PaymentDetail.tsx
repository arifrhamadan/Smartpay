import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Clock, ChevronRight, UserPlus, Search, Filter, History, CheckCircle, Smartphone } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const studentData = [
  { id: 1, name: 'Adrian Wijaya', total: 500000, paid: 500000, status: 'Lunas', color: 'green', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBevctNaV7kk70Pvn9rXGwEPJ5Af7vS6Xwa8mO0y71f0Pbnc4vk2TkWA_fnVmqpAOxFHAofHXt8W8ecb1DjX362guZXfCarSAKeH3gOxoLvRQWg5wXMEPDpb4fZQXbVerWXLrDs1AW5EfsoFblZj1xD2M4Qlx-Q_UKk0aQtMY1gqD-9aj72IVJJshsJi7qgIC-F22dg1gnAnbC_rzJwYWNBveFMZIQnt3HE_UAU8xY_OdKvZW3e1Bd_51Hf3tZHS06wpFC-4bQqBw' },
  { id: 2, name: 'Bella Safira', total: 500000, paid: 250000, status: 'Cicilan', color: 'yellow', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlOTAdZrolDSvUwhlTPtCiGfLDsEDJXKhPhxQGCYMjA7LPtZEtsPJXKsc-1rZG0IKcnJUpKl59evCeDQoF3ibIgnMBObXcZ-Jz67gawzAYrnG8K6Ii_3hzlIiR3uaSkxo0zKu0cqTIKdRn0P7uwUkE1_ae_CfrBnPShaz-QdJoreZbidTFwcgdkJNTLSWM6bNhy4HqGsxMVHgOinSXYkXKxa5VZ_R7D_PScsFh0-ia-TyAewErxoWFO4oP9fNOCR7sK7t77w6JpA' },
  { id: 3, name: 'Cakra Buana', total: 500000, paid: 0, status: 'Belum Bayar', color: 'red', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEI3XyVxe8uBkyspQ5YUWNTyUa8cjwF2Pz_eQZ1kn_cdaU3VmfA6FWqfJqJLsEx69HZMNA-sCmPFgNIo878whpHHrjH3hc3ln16nTzww-uvYM_493TcYfrk7R8aOQx9di3jHyaWUo9p3R1OWAHvZwqeF9U08gwHOROKZunl56EkPj-hkB4pfhSWLY9NPUV9K0gUx6tZ9GO09pekOpylJULrlUZHytxA2SAm_SxMvOgFBeV2Rfa8F0HwPQUWBEFgxEmFgmWgsDt4Q' },
  { id: 4, name: 'Dania Putri', total: 500000, paid: 500000, status: 'Lunas', color: 'green', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD_sFidvVEszdobyqmEg1E1CHmPGHBQhPOC6XLy4P3EK5tuB3hHrMzLLQzu-4tynRjG-LQNdmwNC1Amy4yc1zGzcODKfWTvzhreHYP2yM9GIvXlQPDF9qH46NJZQ4l4SVe6h2w2ZOS6h6ZmVfg7P3vViHiHm8FwWGDtaeWi1H6USXfjLyeiGoj5DHSxKJ1LsTCFJ8CIlpZ7eKsWaq72yvgo8L1soidZjN93-_rAzAVXvSdpmKz-f-DZKGKeC7tqNnIIsmdaFSgWw' },
  { id: 5, name: 'Evan Fariz', total: 500000, paid: 100000, status: 'Cicilan', color: 'yellow', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADF-M66f7JlDCnu4AiNH1Rg84plLRtYPWPMkyGfLP8NWDKTOSAHWYiERQrCyREkXyA-X98xUfI3q76rRYt5vEYIunffPbOEdEyTUBrlUWiC_C0OVzIidRY9r1CIh6ndM5S_wRQYvH0Hk5y0cd5JtFexpGiIVbva3qiw3UBM7y_GQHmF0NS-_7Jlf6gX1hZ3K7hu9g6p-EUt2WkS7O8KoN0L5rxcClCyEtfw4zLe3V0vlWfNDUqiA7R4XBnB1qtHb0rwP5HY3ZR4g' },
];

export default function PaymentDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-surface-container rounded-2xl transition-colors active:scale-95"
          >
            <ArrowLeft className="text-primary w-6 h-6" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">Detail Pembayaran</h1>
            <p className="text-sm font-bold text-on-surface-variant opacity-60">Kelas A1 - Playgroup</p>
          </div>
        </div>
        <button className="p-3 hover:bg-surface-container rounded-2xl transition-colors active:scale-95">
          <Bell className="text-primary w-6 h-6" />
        </button>
      </header>

      {/* Summary Bento Stats */}
      <section className="grid grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-surface-container-lowest border border-primary/5 rounded-3xl p-6 shadow-xl shadow-primary/5 text-center flex flex-col items-center"
        >
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 mb-2">
             <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Lunas</p>
          <p className="text-3xl font-display font-bold text-primary">12</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-surface-container-lowest border border-primary/5 rounded-3xl p-6 shadow-xl shadow-primary/5 text-center flex flex-col items-center"
        >
          <div className="w-10 h-10 bg-secondary-container/20 rounded-xl flex items-center justify-center text-secondary mb-2">
             <Clock className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Cicilan</p>
          <p className="text-3xl font-display font-bold text-primary">5</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-surface-container-lowest border border-primary/5 rounded-3xl p-6 shadow-xl shadow-primary/5 text-center flex flex-col items-center"
        >
          <div className="w-10 h-10 bg-error-container/20 rounded-xl flex items-center justify-center text-error mb-2">
             <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Belum</p>
          <p className="text-3xl font-display font-bold text-primary">3</p>
        </motion.div>
      </section>

      {/* Filter Chips */}
      <section className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
        {['Semua', 'Lunas', 'Cicilan', 'Belum'].map((filter, i) => (
          <button 
            key={filter}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shrink-0 transition-all border outline-none",
              i === 0 
                ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary" 
                : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {filter === 'Lunas' && <CheckCircle2 className="w-4 h-4" />}
            {filter === 'Cicilan' && <Clock className="w-4 h-4" />}
            {filter === 'Belum' && <AlertCircle className="w-4 h-4" />}
            <span>{filter}</span>
          </button>
        ))}
      </section>

      {/* Student List */}
      <section className="space-y-4">
        {studentData.map((student) => {
          const progress = (student.paid / student.total) * 100;
          return (
            <motion.div 
              key={student.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-surface-container-lowest border border-primary/5 rounded-[32px] p-5 shadow-sm flex items-center gap-5 transition-all hover:shadow-md cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/20">
                <img className="w-full h-full object-cover" src={student.img} alt={student.name} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display font-bold text-on-surface truncate pr-2">{student.name}</h3>
                  <span className={cn(
                    "px-4 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest",
                    student.status === 'Lunas' ? "bg-green-50 text-green-700" :
                    student.status === 'Cicilan' ? "bg-secondary-container/20 text-on-secondary-container" :
                    "bg-error-container/20 text-error"
                  )}>
                    {student.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-on-surface-variant text-xs font-bold">
                  <span className="text-primary">Rp {student.paid.toLocaleString()}</span>
                  <span className="opacity-40">/</span>
                  <span className="opacity-40">Rp {student.total.toLocaleString()}</span>
                </div>

                {student.status === 'Cicilan' && (
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="bg-secondary-container h-full rounded-full" 
                    />
                  </div>
                )}
              </div>
              
              <ChevronRight className="w-6 h-6 text-outline-variant shrink-0" />
            </motion.div>
          );
        })}
      </section>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-28 right-8 w-16 h-16 bg-secondary text-white shadow-2xl rounded-[24px] flex items-center justify-center z-50 hover:bg-secondary/90 transition-all"
      >
        <UserPlus className="w-8 h-8" />
      </motion.button>
    </div>
  );
}
