import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth, logoutUser } from '../lib/firebase';
import { useTheme } from '../lib/theme';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-surface-container-lowest shadow-sm sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white overflow-hidden shadow-lg shadow-primary/20">
            <School className="w-6 h-6" />
          </div>
          <span className="text-primary font-display font-bold text-lg tracking-tight">SMART PAY</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-primary"
            title="Toggle Theme"
          >
            {getThemeIcon()}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-primary-container overflow-hidden ring-2 ring-primary/10"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-sm">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </div>
              )}
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
      <header className="hidden md:flex justify-between items-center w-full px-12 h-20 bg-surface-container-lowest shadow-sm fixed top-0 left-0 z-40 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-primary font-display text-2xl font-bold tracking-tight">SMART PAY SYSTEM</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex p-1 bg-surface-container rounded-2xl">
             <button onClick={() => setTheme('light')} className={cn("p-2 rounded-xl transition-all", theme === 'light' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}>
               <Sun className="w-5 h-5" />
             </button>
             <button onClick={() => setTheme('dark')} className={cn("p-2 rounded-xl transition-all", theme === 'dark' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}>
               <Moon className="w-5 h-5" />
             </button>
             <button onClick={() => setTheme('system')} className={cn("p-2 rounded-xl transition-all", theme === 'system' ? "bg-surface text-primary shadow-sm" : "text-outline hover:text-on-surface")}>
               <Monitor className="w-5 h-5" />
             </button>
          </div>
          <div className="w-px h-8 bg-outline-variant"></div>
          
          {/* Profile Dropdown Desktop */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-surface-container transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden ring-2 ring-primary/10 transition-transform group-hover:scale-95">
                 {user?.photoURL ? (
                   <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                     {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                   </div>
                 )}
              </div>
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
      <aside className="hidden md:flex fixed left-0 top-20 h-[calc(100vh-80px)] w-72 bg-surface-container-low flex-col p-8 border-r border-outline-variant/10 transition-colors">
        <div className="space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-200px)] no-scrollbar">
          <p className="px-4 text-[10px] text-outline font-black uppercase tracking-[0.2em] mb-4 opacity-50">Menu Operasional</p>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold",
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.03]" 
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm tracking-tight">{item.name}</span>
            </NavLink>
          ))}
        </div>
        
        <div className="mt-auto pt-6 border-t border-outline-variant/20">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-error font-bold w-full hover:bg-error/10 rounded-2xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Keluar Sesi</span>
          </button>
        </div>
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
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-surface-container-lowest z-50 md:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-10">
                <School className="text-primary w-10 h-10" fill="currentColor" />
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
              <div className="mt-6 pt-6 border-t border-outline-variant/20">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-4 py-4 text-error font-bold hover:bg-error/5 rounded-2xl transition-all w-full"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow md:pl-72 md:pt-20 pb-24 md:pb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/20 flex justify-around items-center px-2 py-2 pb-8 md:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
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
