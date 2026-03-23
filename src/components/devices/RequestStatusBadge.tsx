import type { DeviceRequestStatus } from '@/types/device-request.types.js';

interface RequestStatusBadgeProps {
  status: DeviceRequestStatus;
}

const statusConfig: Record<DeviceRequestStatus, { icon: string; label: string; color: string }> = {
  pending: {
    icon: '🟡',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
  },
  approved: {
    icon: '🔵',
    label: 'Approved',
    color: 'bg-blue-100 text-blue-800',
  },
  rejected: {
    icon: '🔴',
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
  },
  completed: {
    icon: '🟢',
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
  },
};

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
