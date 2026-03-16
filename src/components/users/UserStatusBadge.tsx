import { Badge } from '@/components/ui';
import type { UserStatus } from '@/types';

interface UserStatusBadgeProps {
  status: UserStatus;
}

const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
  const config = {
    active:  { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Invite Pending' },
    expired: { variant: 'error',   label: 'Invite Expired' },
    deleted: { variant: 'default', label: 'Deleted' },
  }[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export { UserStatusBadge };
