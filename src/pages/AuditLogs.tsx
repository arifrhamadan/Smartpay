import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, History, User, Clock, Terminal, Shield, RefreshCcw } from 'lucide-react';
import { auditLogService } from '../services/paymentService';
import { cn } from '../lib/utils';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await auditLogService.getLogs();
    setLogs(data || []);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogIcon = (action: string) => {
    if (action.includes('PAYMENT')) return <Terminal className="w-5 h-5 text-primary" />;
    if (action.includes('STUDENT')) return <User className="w-5 h-5 text-secondary" />;
    if (action.includes('CONFIG')) return <Shield className="w-5 h-5 text-orange-500" />;
    return <Terminal className="w-5 h-5 text-outline" />;
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-on-surface font-display text-3xl font-bold mb-1">Audit Logs</h2>
          <p className="text-on-surface-variant text-base font-medium">Catatan aktivitas sistem untuk keamanan dan transparansi.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-surface-container-high text-on-surface px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-all"
        >
          <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </header>

      <div className="bg-surface-container-lowest p-4 rounded-[32px] border border-outline-variant/10 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
          <input 
            type="text"
            placeholder="Cari aksi, pengguna, atau detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 pl-12 h-14 text-lg font-bold"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-[40px] border border-outline-variant/10 shadow-sm divide-y divide-outline-variant/5">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="p-6 md:p-8 flex gap-6 hover:bg-surface-container-low transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0">
                {getLogIcon(log.action)}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-on-surface text-base md:text-lg leading-tight uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</h4>
                    <p className="text-sm font-medium text-on-surface-variant mt-1">{log.detail}</p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <p className="text-xs font-black text-primary uppercase tracking-widest">{log.userName}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-outline font-bold mt-1 md:justify-end">
                      <Clock className="w-3 h-3" />
                      {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Bara Saja'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded uppercase tracking-widest">{log.role}</span>
                  <span className="px-2 py-0.5 bg-surface-container text-outline text-[10px] font-bold rounded uppercase tracking-widest">ID: {log.id.slice(0, 8)}</span>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="py-32 text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-outline opacity-20" />
              <p className="text-on-surface-variant font-bold text-xl">Belum ada aktivitas tercatat.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
