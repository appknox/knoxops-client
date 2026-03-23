import { Badge } from '@/components/ui';
import type { DeviceStatus } from '@/types';

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
}

const statusConfig: Record<DeviceStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'primary' }> = {
  active: { label: 'In Inventory', variant: 'primary' },
  inactive: { label: 'Checked out of inventory', variant: 'default' },
  maintenance: { label: 'Out for repair', variant: 'warning' },
  decommissioned: { label: 'To be sold', variant: 'danger' },
};

const DeviceStatusBadge = ({ status }: DeviceStatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export { DeviceStatusBadge };
