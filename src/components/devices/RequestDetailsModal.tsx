import { Modal, Button } from '@/components/ui';
import { RequestStatusBadge } from './RequestStatusBadge.js';
import type { DeviceRequest } from '@/types/device-request.types.js';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: DeviceRequest | null;
}

const formatDate = (date?: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex gap-2 text-sm">
    <span className="w-36 shrink-0 font-medium text-gray-500">{label}</span>
    <span className="text-gray-900">{value || '—'}</span>
  </div>
);

export function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  if (!request) return null;

  const fullName = (user?: { firstName: string; lastName: string } | null) =>
    user ? `${user.firstName} ${user.lastName}` : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Request #${request.requestNo}`} size="md">
      <div className="p-6 space-y-6">

        {/* Status */}
        <div className="flex items-center gap-3">
          <RequestStatusBadge status={request.status} />
          <span className="text-xs text-gray-400">Submitted {formatDate(request.createdAt)}</span>
        </div>

        {/* Device details */}
        <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Request Details</p>
          <Row label="Device Type" value={<span className="capitalize">{request.deviceType}</span>} />
          <Row label="Platform" value={request.platform} />
          <Row label="OS Version" value={request.osVersion} />
          <Row label="Purpose" value={request.purpose} />
          <Row label="Requesting For" value={request.requestingFor} />
          <Row label="Requested By" value={fullName(request.requestedByUser)} />
        </div>

        {/* Status-specific details */}
        {request.status === 'approved' && (
          <div className="space-y-3 border rounded-lg p-4 bg-green-50 border-green-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Approval</p>
            <Row label="Approved By" value={fullName(request.approvedByUser)} />
            <Row label="Approved At" value={formatDate(request.approvedAt)} />
          </div>
        )}

        {request.status === 'completed' && (
          <div className="space-y-3 border rounded-lg p-4 bg-blue-50 border-blue-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Completion</p>
            <Row label="Completed By" value={fullName(request.completedByUser)} />
            <Row label="Completed At" value={formatDate(request.completedAt)} />
            {request.linkedDevice && (
              <Row label="Device Allocated" value={`${request.linkedDevice.name}${request.linkedDevice.model ? ` — ${request.linkedDevice.model}` : ''}`} />
            )}
          </div>
        )}

        {request.status === 'rejected' && (
          <div className="space-y-3 border rounded-lg p-4 bg-red-50 border-red-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection</p>
            <Row label="Rejected By" value={fullName(request.rejectedByUser)} />
            <Row label="Rejected At" value={formatDate(request.rejectedAt)} />
            <div className="text-sm">
              <span className="font-medium text-gray-500">Reason</span>
              <p className="mt-1 text-red-900 bg-red-100 rounded p-2 whitespace-pre-wrap">{request.rejectionReason}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
