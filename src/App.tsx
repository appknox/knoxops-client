import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { LoginPage, AcceptInvitePage, AuthCallback, AuthError } from '@/pages/auth';
import { DeviceListPage, RegisterDevicePage } from '@/pages/devices';
import { UserListPage, AddUserPage, EditUserPage } from '@/pages/users';
import { OnpremListPage, RegisterOnpremPage } from '@/pages/onprem';
import { ProfilePage } from '@/pages/profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/error" element={<AuthError />} />

        {/* Immediate redirects (no auth check needed) */}
        <Route path="/dashboard" element={<Navigate to="/devices" replace />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/devices" replace />} />
          <Route path="/devices" element={<DeviceListPage />} />
          <Route path="/devices/register" element={<RegisterDevicePage />} />

          {/* User management routes (admin only - protected in AppLayout) */}
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/add" element={<AddUserPage />} />
          <Route path="/users/:id/edit" element={<EditUserPage />} />

          {/* On-Prem management routes (specific routes before generic) */}
          <Route path="/onprem" element={<OnpremListPage />} />
          <Route path="/onprem/register" element={<RegisterOnpremPage />} />
          <Route path="/onprem/:id/edit" element={<RegisterOnpremPage />} />
          <Route path="/onprem/:id" element={<OnpremListPage />} />

          {/* Profile route (all authenticated users) */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
