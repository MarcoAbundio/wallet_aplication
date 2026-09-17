import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/common/Toast';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Loans from '@/pages/Loans';
import NewLoan from '@/pages/NewLoan';
import LoanDetail from '@/pages/LoanDetail';
import Payments from '@/pages/Payments';
import Users from '@/pages/Users';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clientes" element={<Clients />} />
                  <Route path="/clientes/:id" element={<ClientDetail />} />
                  <Route path="/prestamos" element={<Loans />} />
                  <Route path="/prestamos/nuevo" element={<NewLoan />} />
                  <Route path="/prestamos/:id" element={<LoanDetail />} />
                  <Route path="/depositos" element={<Payments />} />

                  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/usuarios" element={<Users />} />
                  </Route>
                </Route>
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
