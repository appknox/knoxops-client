import { Badge } from '@/components/ui';
import type { Role } from '@/types';

const roleConfig: Record<
  Role,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  admin: { label: 'Admin', variant: 'danger' },
  devices_admin: { label: 'Devices Admin', variant: 'warning' },
  devices_viewer: { label: 'Devices Viewer', variant: 'info' },
  onprem_admin: { label: 'On-Prem Admin', variant: 'warning' },
  onprem_viewer: { label: 'On-Prem Viewer', variant: 'info' },
  full_viewer: { label: 'Viewer', variant: 'default' },
  full_editor: { label: 'Editor', variant: 'success' },
};

interface UserRoleBadgeProps {
  role: Role;
}

const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
  const config = roleConfig[role] || { label: role, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export { UserRoleBadge };
