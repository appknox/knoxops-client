import type { LicenseRequestStatus } from '@/types/onprem-license-request.types';

interface LicenseRequestStatusBadgeProps {
  status: LicenseRequestStatus;
}

export function LicenseRequestStatusBadge({ status }: LicenseRequestStatusBadgeProps) {
  const config: Record<LicenseRequestStatus, { icon: string; label: string; color: string }> = {
    pending: {
      icon: '🟡',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
    },
    completed: {
      icon: '🟢',
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
    },
    cancelled: {
      icon: '🔴',
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
    },
  };

  const { icon, label, color } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
