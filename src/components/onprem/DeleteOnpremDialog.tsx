import { ConfirmDialog } from '@/components/ui';
import { useOnpremStore } from '@/stores';
import type { OnpremDeployment } from '@/types';

interface DeleteOnpremDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: OnpremDeployment | null;
}

const DeleteOnpremDialog = ({ isOpen, onClose, deployment }: DeleteOnpremDialogProps) => {
  const { deleteDeployment, isLoading } = useOnpremStore();

  const handleConfirm = async () => {
    if (!deployment) return;
    try {
      await deleteDeployment(deployment.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete deployment:', error);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete On-Prem Client"
      message={`Are you sure you want to delete "${deployment?.clientName}"? This action cannot be undone and will remove all associated data including device associations and version history.`}
      confirmLabel="Delete"
      isLoading={isLoading}
      variant="danger"
    />
  );
};

export { DeleteOnpremDialog };
