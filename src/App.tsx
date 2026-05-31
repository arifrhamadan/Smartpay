import React, { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import PaymentInput from './pages/PaymentInput';
import PaymentDetail from './pages/PaymentDetail';
import Students from './pages/Students';
import Arrears from './pages/Arrears';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import { AuthProvider, useAuth, logoutUser } from './lib/firebase';
import { ThemeProvider } from './lib/theme';

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-on-surface-variant font-bold animate-pulse">Menghubungkan...</p>
          <p className="text-on-surface-variant/60 text-xs mt-1">Mengambil profil dan hak akses Anda.</p>
        </div>
        {/* Safety valve if stuck */}
        <button 
          onClick={logoutUser}
          className="text-[10px] text-outline font-bold uppercase tracking-widest hover:text-error transition-colors mt-8"
        >
          Masalah koneksi? Klik untuk Reset Sesi
        </button>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['owner', 'ketua_unit']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="students" element={
                <ProtectedRoute allowedRoles={['ketua_unit']}>
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="arrears" element={
                <ProtectedRoute allowedRoles={['owner', 'ketua_unit']}>
                  <Arrears />
                </ProtectedRoute>
              } />
              <Route path="audit-logs" element={
                <ProtectedRoute allowedRoles={['owner', 'ketua_unit']}>
                  <AuditLogs />
                </ProtectedRoute>
              } />
              <Route path="payments" element={
                <ProtectedRoute allowedRoles={['staff', 'ketua_unit']}>
                  <PaymentInput />
                </ProtectedRoute>
              } />
              <Route path="payments/:classId" element={
                <ProtectedRoute allowedRoles={['staff', 'ketua_unit']}>
                  <PaymentDetail />
                </ProtectedRoute>
              } />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
