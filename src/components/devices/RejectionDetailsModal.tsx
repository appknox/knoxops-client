import { Modal, Button } from '@/components/ui';
import { X } from 'lucide-react';
import type { DeviceRequest } from '@/types/device-request.types';

interface RejectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: DeviceRequest | null;
  rejectedByUserName?: string;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function RejectionDetailsModal({
  isOpen,
  onClose,
  request,
  rejectedByUserName,
}: RejectionDetailsModalProps) {
  if (!request || request.status !== 'rejected') {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rejection Details" size="md">
      <div className="p-6 space-y-6">
        {/* Request ID */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Request ID
          </label>
          <p className="text-sm font-mono text-gray-900 break-all">{request.id}</p>
        </div>

        {/* Request Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
            <p className="text-sm text-gray-600 capitalize">{request.deviceType}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <p className="text-sm text-gray-600">{request.platform}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OS Version</label>
              <p className="text-sm text-gray-600">{request.osVersion || '—'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <p className="text-sm text-gray-600">{request.purpose}</p>
          </div>
        </div>

        {/* Rejection Information */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium text-gray-900">Rejection Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 whitespace-pre-wrap">{request.rejectionReason}</p>
            </div>
          </div>

          {request.rejectedBy && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejected By
                </label>
                <p className="text-sm text-gray-600">{rejectedByUserName || 'Unknown'}</p>
              </div>
              {request.rejectedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejected At
                  </label>
                  <p className="text-sm text-gray-600">{formatDate(request.rejectedAt)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
