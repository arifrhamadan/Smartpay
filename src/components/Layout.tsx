import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CrispAvatar } from './CrispAvatar';
import { 
  LayoutDashboard, 
  WalletCards, 
  FileBarChart2, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  User, 
  School, 
  CheckCircle, 
  AlertCircle, 
  History, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Lock,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth, logoutUser } from '../lib/firebase';
import { useTheme } from '../lib/theme';
import { getQuotaStatus } from '../services/paymentService';
import { PageHeader } from './PageHeader';

const pageConfigs: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Monitoring Pemasukan 📊',
    subtitle: 'Selamat datang kembali di SMART PAY.',
  },
  '/students': {
    title: 'Manajemen Data Siswa 👨‍🎓',
    subtitle: 'Kelola data registrasi, kelas, dan status keaktifan siswa.',
  },
  '/payments': {
    title: 'Multi-Item Payment 💳',
    subtitle: 'Input beberapa transaksi dan tagihan dengan aman.',
  },
  '/arrears': {
    title: 'Monitoring Tunggakan ⚠️',
    subtitle: 'Otorisasi pemantauan tagihan murid yang tertunda atau belum lunas.',
  },
  '/reports': {
    title: 'Laporan Keuangan 📑',
    subtitle: 'Analisis arus kas, cetak kwitansi, dan ekspor rincian laporan.',
  },
  '/audit-logs': {
    title: 'Audit Aktivitas Sistem 🛡️',
    subtitle: 'Rekaman jejak aktivitas operasional pengguna pada sistem.',
  },
  '/profile': {
    title: 'Profil Pengguna 👤',
    subtitle: 'Kelola rincian akun dan preferensi keamanan Anda.',
  }
};

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isCollapsed = false;
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuotaExceeded, setIsQuotaExceeded] = React.useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = React.useState(
    sessionStorage.getItem('smartpay_quota_dismissed') === 'true'
  );

  // PWA standalone installation trackers
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS and standalone mode checks
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isStandaloneMode);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation outcome: ${outcome}`);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  React.useEffect(() => {
    setIsQuotaExceeded(getQuotaStatus());

    const handleQuotaStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setIsQuotaExceeded(customEvent.detail.exceeded);
        // Reset dismissal if status turns on/off so user gets notified if state changes
        if (customEvent.detail.exceeded) {
          setIsBannerDismissed(sessionStorage.getItem('smartpay_quota_dismissed') === 'true');
        }
      }
    };

    window.addEventListener('firestore-quota-status', handleQuotaStatus);
    return () => {
      window.removeEventListener('firestore-quota-status', handleQuotaStatus);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'ketua_unit', 'staff'] },
    { name: 'Siswa', path: '/students', icon: User, roles: ['ketua_unit'] },
    { name: 'Tunggakan', path: '/arrears', icon: AlertCircle, roles: ['owner', 'ketua_unit'] },
    { name: 'Pembayaran', path: '/payments', icon: WalletCards, roles: ['staff', 'ketua_unit'] },
    { name: 'Laporan', path: '/reports', icon: FileBarChart2, roles: ['owner', 'ketua_unit'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['owner', 'ketua_unit'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    return item.roles.includes(role || 'staff');
  });

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const mobileProfileRef = React.useRef<HTMLDivElement>(null);
  const desktopProfileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        isProfileOpen &&
        (!mobileProfileRef.current || !mobileProfileRef.current.contains(event.target as Node)) &&
        (!desktopProfileRef.current || !desktopProfileRef.current.contains(event.target as Node))
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row transition-colors duration-300">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex justify-between items-center w-full px-4 h-16 bg-surface-container-lowest border-b border-outline-variant/10 shadow-sm sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-xs border border-outline-variant/10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover animate-pulse" referrerPolicy="no-referrer" />
          </div>
          <span className="text-primary font-display font-bold text-lg tracking-tight">SMART PAY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={mobileProfileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="outline-hidden focus:scale-105 transition-transform duration-200"
            >
              <CrispAvatar src={user?.photoURL} name={user?.displayName} email={user?.email} sizeClassName="w-10 h-10" />
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 p-2 z-[60]"
                >
                  <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container rounded-xl text-sm font-bold text-on-surface transition-colors">
                    <User className="w-4 h-4" /> Edit Profil
                  </button>
                  <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container rounded-xl text-sm font-bold text-on-surface transition-colors">
                    <Lock className="w-4 h-4" /> Ubah Password
                  </button>
                  <div className="h-px bg-outline-variant/20 my-2 mx-2"></div>
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-xs font-bold text-on-surface-variant">Mode</span>
                    <div className="flex p-0.5 bg-surface-container rounded-xl">
                      <button onClick={() => setTheme('light')} className={cn("p-1.5 rounded-lg transition-all", theme === 'light' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}>
                        <Sun className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setTheme('dark')} className={cn("p-1.5 rounded-lg transition-all", theme === 'dark' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}>
                        <Moon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-outline-variant/20 my-2 mx-2"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-error/10 rounded-xl text-sm font-bold text-error transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
          </button>
        </div>
      </header>

      {/* Desktop Top Bar */}
      <header className="hidden lg:flex justify-between items-center w-full px-12 h-20 bg-surface-container-lowest border-b border-outline-variant/10 shadow-sm fixed top-0 left-0 z-40 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-xs border border-outline-variant/10">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-primary font-display text-2xl font-bold tracking-tight">SMART PAY SYSTEM</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex p-1 bg-surface-container rounded-2xl">
             <button onClick={() => setTheme('light')} className={cn("p-2 rounded-xl transition-all", theme === 'light' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")} title="Light Mode">
               <Sun className="w-5 h-5" />
             </button>
             <button onClick={() => setTheme('dark')} className={cn("p-2 rounded-xl transition-all", theme === 'dark' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")} title="Dark Mode">
               <Moon className="w-5 h-5" />
             </button>
          </div>
          <div className="w-px h-8 bg-outline-variant"></div>
          
          {/* Profile Dropdown Desktop */}
          <div className="relative" ref={desktopProfileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-surface-container transition-all group outline-none"
            >
              <CrispAvatar src={user?.photoURL} name={user?.displayName} email={user?.email} sizeClassName="w-10 h-10 transition-transform group-hover:scale-95" />
              <div className="text-left">
                <p className="text-on-surface font-bold text-sm leading-tight">{user?.displayName || 'User Admin'}</p>
                <p className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">{(role || 'Staff').replace('_', ' ')}</p>
              </div>
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-64 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/10 p-3 z-50"
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  <div className="px-4 py-3 mb-2">
                    <p className="text-xs font-black text-outline uppercase tracking-[0.2em]">Pengaturan Akun</p>
                  </div>
                  <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-container rounded-2xl text-sm font-bold text-on-surface transition-all group">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <span>Edit Profil</span>
                  </button>
                  <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-container rounded-2xl text-sm font-bold text-on-surface transition-all group">
                    <div className="p-2 bg-secondary/10 text-secondary rounded-xl group-hover:bg-secondary group-hover:text-on-secondary-container transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span>Ubah Password</span>
                  </button>
                  <div className="h-px bg-outline-variant/10 my-3 mx-2"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-error/10 rounded-2xl text-sm font-bold text-error transition-all group">
                    <div className="p-2 bg-error/10 text-error rounded-xl group-hover:bg-error group-hover:text-white transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span>Keluar Sesi</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Sidebar for Desktop */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-20 h-[calc(100vh-80px)] bg-surface-container-low flex-col p-6 border-r border-outline-variant/10 transition-all duration-300 z-30",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <div className="space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-220px)] no-scrollbar flex-1">
          {!isCollapsed && <p className="px-4 text-[10px] text-outline font-black uppercase tracking-[0.2em] mb-4 opacity-50">Menu Operasional</p>}
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold group",
                isActive 
                  ? "text-white" 
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                isCollapsed && "justify-center px-0 w-12 mx-auto"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav" 
                      className="absolute inset-0 bg-primary rounded-2xl shadow-xl shadow-primary/20 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-outline group-hover:text-primary")} />
                  {!isCollapsed && <span className="text-sm tracking-tight transition-opacity duration-300">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* PWA Install Banner */}
        {((deferredPrompt || (isIOS && !isStandalone)) && !isCollapsed) && (
          <div className="mt-auto p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-sm">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
            <p className="font-bold text-xs text-on-surface leading-tight">Install SMART PAY</p>
            <p className="text-[10px] text-outline mt-1 mb-3">Pasang di perangkat untuk akses instan & offline</p>
            {isIOS ? (
              <button 
                onClick={() => alert('Untuk iOS (Safari):\n1. Ketuk tombol "Bagikan" (Share) di Safari di bar bawah.\n2. Gulir ke bawah lalu ketuk "Tambahkan ke Layar Utama" (Add to Home Screen).')}
                className="w-full text-[10px] bg-primary hover:bg-primary-container text-white hover:text-on-primary-container font-black py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                PANDUAN IOS 📱
              </button>
            ) : (
              <button onClick={handleInstallClick} className="w-full text-[10px] bg-primary hover:bg-primary-container text-white hover:text-on-primary-container font-black py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
                PASANG SEKARANG ⚡
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-surface-container-lowest z-50 lg:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-xs border border-outline-variant/10">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="text-primary font-display font-bold text-xl tracking-tight">SMART PAY</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 no-scrollbar">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold",
                      isActive 
                        ? "bg-primary text-white shadow-lg" 
                        : "text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>

              {/* Mobile Install Option */}
              {((deferredPrompt || (isIOS && !isStandalone))) && (
                <div className="mt-auto p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <p className="font-bold text-xs text-on-surface leading-tight">Aplikasi SMART PAY Mobile</p>
                  <p className="text-[9px] text-outline mt-0.5 mb-2.5">Pasang aplikasi ini di Android atau iOS Anda</p>
                  {isIOS ? (
                    <button 
                      onClick={() => alert('Untuk iOS (Safari):\n1. Ketuk tombol "Bagikan" (Share) di Safari di bar bawah.\n2. Gulir ke bawah lalu ketuk "Tambahkan ke Layar Utama" (Add to Home Screen).')}
                      className="w-full text-[9px] bg-primary text-white font-black py-1.5 rounded-lg active:scale-95 cursor-pointer"
                    >
                      PANDUAN IOS 📱
                    </button>
                  ) : (
                    <button onClick={handleInstallClick} className="w-full text-[9px] bg-primary text-white font-black py-1.5 rounded-lg active:scale-95 cursor-pointer">
                      PASANG SEKARANG ⚡
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-grow lg:pt-20 pb-24 lg:pb-8 transition-all duration-300",
        isCollapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
          {isQuotaExceeded && !isBannerDismissed && (
            <div className="bg-amber-500/10 dark:bg-amber-400/5 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-3xl p-5 mb-8 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 relative">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 pr-8">
                <h4 className="font-bold text-sm tracking-tight">Pemberitahuan: Sistem Backup Cadangan Diaktifkan ⚡</h4>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                  Batas kuota harian database cloud gratis terpenuhi (Quota Exceeded). SMART PAY otomatis menjalankan <b>Mode Penyimpanan Mandiri (Offline-First Memory Cache)</b> secara aman. Seluruh data siswa, pembayaran, & log yang Anda input tetap tersimpan secara instan di browser Anda dan bisa dikelola secara normal! Anda juga dapat mengekspor atau memulihkan data tersebut dari menu Laporan.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsBannerDismissed(true);
                  sessionStorage.setItem('smartpay_quota_dismissed', 'true');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-amber-500/15 active:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                aria-label="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {(() => {
            const getPageConfig = (pathname: string) => {
              if (pathname.startsWith('/payments/')) {
                return {
                  title: 'Detail Pembayaran Kelas 💳',
                  subtitle: 'Pantau dan catat transaksi pembayaran kelas secara mendalam.'
                };
              }
              return pageConfigs[pathname] || {
                title: 'SMART PAY 📊',
                subtitle: 'Aplikasi pengelolaan keuangan sekolah terpadu.'
              };
            };
            const config = getPageConfig(location.pathname);
            const isDashboardRoute = location.pathname === '/dashboard';

            return (
              <motion.div 
                key={location.pathname}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="mb-8 md:mb-10 bg-gradient-to-br from-primary/[0.04] to-secondary/[0.02] rounded-[32px] p-6 sm:p-8 md:p-10 border border-outline-variant/10 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Ambient background accent shapes */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/8 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-secondary/8 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10">
                  <PageHeader 
                    title={config.title}
                    subtitle={config.subtitle}
                    showGreeting={isDashboardRoute}
                    userDisplayName={user?.displayName || 'User'}
                    isDashboard={isDashboardRoute}
                  />
                </div>
              </motion.div>
            );
          })()}

          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/20 flex justify-around items-center px-2 py-2 pb-8 lg:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
        {filteredNavItems.slice(0, 5).map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] p-1 transition-all",
                isActive ? "text-primary" : "text-on-surface-variant"
              )}
            >
              <div className={cn(
                "w-12 h-8 rounded-full flex items-center justify-center mb-1 transition-all",
                isActive && "bg-primary-container text-on-primary-container"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
