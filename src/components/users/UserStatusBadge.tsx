import { Badge } from '@/components/ui';
import type { InviteStatus } from '@/types';

interface UserStatusBadgeProps {
  isActive: boolean;
  inviteStatus?: InviteStatus | null;
}

const UserStatusBadge = ({ isActive, inviteStatus }: UserStatusBadgeProps) => {
  // Check if user is pending invite
  if (inviteStatus === 'pending') {
    return (
      <Badge variant="warning">
        Invitation Pending
      </Badge>
    );
  }

  return (
    <Badge variant={isActive ? 'success' : 'default'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
};

export { UserStatusBadge };
