import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Navbar } from './Navbar';

const AppLayout = () => {
  const location = useLocation();
  const { user, isAuthenticated, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route protection
  const adminOnlyPaths = ['/users'];
  const isAdminRoute = adminOnlyPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  if (isAdminRoute && user?.role !== 'admin') {
    return <Navigate to="/devices" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export { AppLayout };
