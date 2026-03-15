import { ConfirmDialog } from '@/components/ui';
import { useDeviceStore } from '@/stores';
import type { DeviceListItem } from '@/types';

interface DeleteDeviceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceListItem | null;
}

const DeleteDeviceDialog = ({ isOpen, onClose, device }: DeleteDeviceDialogProps) => {
  const { deleteDevice, isLoading } = useDeviceStore();

  const handleConfirm = async () => {
    if (!device) return;

    try {
      await deleteDevice(device.id);
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
      title="Delete Device?"
      message={`Are you sure you want to delete ${device?.name || 'this device'}? This action cannot be undone and will remove all associated data.`}
      confirmLabel="Delete Device"
      variant="danger"
      isLoading={isLoading}
    />
  );
};

export { DeleteDeviceDialog };
