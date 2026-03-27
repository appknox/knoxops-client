import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { LoginPage, AcceptInvitePage, AuthCallback, AuthError } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { DeviceListPage, RegisterDevicePage, InventoryTab, DeviceRequestsTab } from '@/pages/devices';
import { UserListPage, AddUserPage, EditUserPage } from '@/pages/users';
import { SettingsPage, InvitesTab, IntegrationsTab, NotificationsSettingsTab } from '@/pages/settings';
import { OnpremPage, OnpremClientsTab, NotificationsTab, ReleasesTab, RegisterOnpremPage, OnpremDetailPage } from '@/pages/onprem';
import { AllLicenseRequestsTab } from '@/components/onprem';
import { ProfilePage } from '@/pages/profile';
import { SalePage } from '@/pages/sale/SalePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="/sale" element={<SalePage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/devices" element={<DeviceListPage />}>
            <Route index element={<Navigate to="inventory" replace />} />
            <Route path="inventory" element={<InventoryTab />} />
            <Route path="requests" element={<DeviceRequestsTab />} />
          </Route>
          <Route path="/devices/register" element={<RegisterDevicePage />} />

          {/* Settings with nested routes (admin only - protected in AppLayout) */}
          <Route path="/settings" element={<SettingsPage />}>
            <Route index element={<Navigate to="/settings/users" replace />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/add" element={<AddUserPage />} />
            <Route path="users/:id/edit" element={<EditUserPage />} />
            <Route path="invites" element={<InvitesTab />} />
            <Route path="integrations" element={<IntegrationsTab />} />
            <Route path="notifications" element={<NotificationsSettingsTab />} />
          </Route>

          {/* On-Prem management routes with nested layout */}
          <Route path="/onprem" element={<OnpremPage />}>
            <Route index element={<Navigate to="/onprem/clients" replace />} />
            <Route path="clients" element={<OnpremClientsTab />} />
            <Route path="licence-requests" element={<AllLicenseRequestsTab />} />
            <Route path="releases" element={<ReleasesTab />} />
            <Route path="notifications" element={<NotificationsTab />} />
            <Route path=":id" element={<OnpremDetailPage />} />
          </Route>
          <Route path="/onprem/register" element={<RegisterOnpremPage />} />
          <Route path="/onprem/:id/edit" element={<RegisterOnpremPage />} />

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
