import { useAuthStore } from '@/stores';

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return {
    // On-Prem
    canManageOnprem: ['admin', 'onprem_admin', 'full_editor'].includes(role ?? ''),
    canDeleteOnprem: ['admin', 'full_editor'].includes(role ?? ''),

    // Devices
    canManageDevices: ['admin', 'devices_admin', 'full_editor'].includes(role ?? ''),
    canDeleteDevices: ['admin', 'devices_admin', 'full_editor'].includes(role ?? ''),
  };
};
