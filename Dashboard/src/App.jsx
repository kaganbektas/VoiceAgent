import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { lazy, Suspense } from 'react';
import Layout from './Layout';
import './index.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CallsPage = lazy(() => import('./pages/CallsPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const FaqsPage = lazy(() => import('./pages/FaqsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="faqs" element={<FaqsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

