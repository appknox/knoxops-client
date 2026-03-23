import { useAuthStore } from '@/stores';

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return {
    // On-Prem
    canManageOnprem: ['admin', 'onprem_admin', 'full_editor'].includes(role ?? ''),
    canViewOnprem: ['admin', 'onprem_admin', 'onprem_viewer', 'full_editor', 'full_viewer'].includes(role ?? ''),
    canDeleteOnprem: ['admin', 'full_editor'].includes(role ?? ''),

    // Devices
    canViewDevices: ['admin', 'devices_admin', 'full_editor', 'devices_viewer', 'full_viewer'].includes(role ?? ''),
    canManageDevices: ['admin', 'devices_admin', 'full_editor'].includes(role ?? ''),
    canDeleteDevices: ['admin', 'devices_admin', 'full_editor'].includes(role ?? ''),
  };
};
