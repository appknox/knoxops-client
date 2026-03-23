import { useState } from 'react';
import { Modal, Button, Textarea } from '@/components/ui';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';
import type { DeviceRequest } from '@/types/device-request.types.js';

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: DeviceRequest;
}

export function RejectRequestModal({ isOpen, onClose, request }: RejectRequestModalProps) {
  const { rejectRequest } = useDeviceRequestStore();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await rejectRequest(request.id, reason);
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
    <Modal isOpen={isOpen} onClose={handleClose} title={`Reject Request #${request.requestNo}`} size="md">
      <div className="space-y-5 p-6">
        <div className="p-3 bg-gray-50 rounded-lg border text-sm space-y-1">
          <div><span className="font-medium text-gray-700">Device:</span> {request.platform} {request.deviceType}{request.osVersion ? ` · ${request.osVersion}` : ''}</div>
          <div><span className="font-medium text-gray-700">Purpose:</span> {request.purpose}</div>
          {request.requestingFor && (
            <div><span className="font-medium text-gray-700">Requesting for:</span> {request.requestingFor}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Rejection Reason *</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this request is being rejected..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
