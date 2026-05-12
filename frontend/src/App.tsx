import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/common/Layout';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from 'next-themes';

// Lazy load pages
// Lazy load pages (Anti-Fraud Core)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const FiscalManager = React.lazy(() => import('./pages/FiscalManager'));
const WMSDistributed = React.lazy(() => import('./pages/WMSDistributed'));
const TraceabilityCenter = React.lazy(() => import('./pages/TraceabilityCenter'));
const UserManual = React.lazy(() => import('./pages/UserManual'));
const AntiFraudLab = React.lazy(() => import('./pages/AntiFraudLab'));
const Settings = React.lazy(() => import('./pages/Settings'));
const StoreSales = React.lazy(() => import('./pages/StoreSales'));
const Units = React.lazy(() => import('./pages/Units'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const RecoverPassword = React.lazy(() => import('./pages/RecoverPassword'));

// Placeholder components for other pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-lg">Esta seção está em desenvolvimento.</p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<React.Suspense fallback={<PageLoader />}><Login /></React.Suspense>} />
              <Route path="/register" element={<React.Suspense fallback={<PageLoader />}><Register /></React.Suspense>} />
              <Route path="/recover-password" element={<React.Suspense fallback={<PageLoader />}><RecoverPassword /></React.Suspense>} />

              {/* Protected Routes (Anti-Fraud Core) */}
              <Route path="/" element={<AppLayout><React.Suspense fallback={<PageLoader />}><Dashboard /></React.Suspense></AppLayout>} />
              <Route path="/fiscal" element={<AppLayout><React.Suspense fallback={<PageLoader />}><FiscalManager /></React.Suspense></AppLayout>} />
              <Route path="/wms-distributed" element={<AppLayout><React.Suspense fallback={<PageLoader />}><WMSDistributed /></React.Suspense></AppLayout>} />
              <Route path="/traceability" element={<AppLayout><React.Suspense fallback={<PageLoader />}><TraceabilityCenter /></React.Suspense></AppLayout>} />
              <Route path="/anti-fraud" element={<AppLayout><React.Suspense fallback={<PageLoader />}><AntiFraudLab /></React.Suspense></AppLayout>} />
              <Route path="/units" element={<AppLayout><React.Suspense fallback={<PageLoader />}><Units /></React.Suspense></AppLayout>} />
              <Route path="/settings" element={<AppLayout><React.Suspense fallback={<PageLoader />}><Settings /></React.Suspense></AppLayout>} />
              <Route path="/checkout" element={<AppLayout><React.Suspense fallback={<PageLoader />}><StoreSales /></React.Suspense></AppLayout>} />
              <Route path="/manual" element={<AppLayout><React.Suspense fallback={<PageLoader />}><UserManual /></React.Suspense></AppLayout>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
