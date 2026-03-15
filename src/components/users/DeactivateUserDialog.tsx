import { ConfirmDialog } from '@/components/ui';
import { useUserStore } from '@/stores';
import type { UserListItem } from '@/types';

interface DeactivateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
}

const DeactivateUserDialog = ({
  isOpen,
  onClose,
  user,
}: DeactivateUserDialogProps) => {
  const { deactivateUser, isLoading } = useUserStore();

  const handleConfirm = async () => {
    if (!user) return;

    try {
      await deactivateUser(user.id);
      onClose();
    } catch {
      // Error handled in store
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Deactivate User?"
      message={`Are you sure you want to deactivate ${user?.firstName} ${user?.lastName}? They will no longer be able to access the system.`}
      confirmLabel="Deactivate"
      variant="danger"
      isLoading={isLoading}
    />
  );
};

export { DeactivateUserDialog };
