import { useState } from 'react';
import { Modal, Button, Textarea } from '@/components/ui';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

export function RejectRequestModal({ isOpen, onClose, requestId }: RejectRequestModalProps) {
  const { rejectRequest } = useDeviceRequestStore();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectRequest(requestId, reason);
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Request" size="md">
      <div className="space-y-6 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Rejection Reason *</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this request is being rejected..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
