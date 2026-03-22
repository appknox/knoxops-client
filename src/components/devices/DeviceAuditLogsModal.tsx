import { useState, useEffect } from 'react';
import { History, PackageCheck, RefreshCw, UserCheck, Tag } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/ui';
import { devicesApi } from '@/api';
import { formatDateTime } from '@/utils/formatters';
import type { DeviceListItem } from '@/types';
import type { AuditLog } from '@/types';

interface DeviceAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceListItem | null;
}

// Status label mapping (same as DeviceStatusBadge)
const statusLabel: Record<string, string> = {
  active: 'In Inventory',
  inactive: 'Checked Out',
  maintenance: 'Out for Repair',
  decommissioned: 'Decommissioned',
};

// Action metadata
const actionConfig: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    bgColor: string;
  }
> = {
  device_created: {
    icon: <PackageCheck className="h-5 w-5 text-green-600" />,
    label: 'Enrolled',
    bgColor: 'bg-green-100',
  },
  status_changed: {
    icon: <RefreshCw className="h-5 w-5 text-blue-600" />,
    label: 'Status Changed',
    bgColor: 'bg-blue-100',
  },
  assigned_to_changed: {
    icon: <UserCheck className="h-5 w-5 text-purple-600" />,
    label: 'Reassigned',
    bgColor: 'bg-purple-100',
  },
  purpose_changed: {
    icon: <Tag className="h-5 w-5 text-orange-600" />,
    label: 'Purpose Changed',
    bgColor: 'bg-orange-100',
  },
};

const ActivityItem = ({ log }: { log: AuditLog }) => {
  const config = actionConfig[log.action];
  if (!config) return null; // Skip events not in actionConfig (e.g., device_updated, device_deleted)

  const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';

  const getDescription = () => {
    const changes = log.changes as {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    } | null;
    const before = changes?.before;
    const after = changes?.after;

    switch (log.action) {
      case 'device_created': {
        const status = (after?.status as string | null | undefined) || 'active';
        const assignedTo = (after?.assignedTo as string | null | undefined) || null;
        const purpose = (after?.purpose as string | null | undefined) || null;
        const statusLabel_ = statusLabel[status] ?? status;
        const parts: JSX.Element[] = [];
        if (statusLabel_ && statusLabel_ !== 'In Inventory') parts.push(<span key="status"><span className="font-semibold">Status:</span> {statusLabel_}</span>);
        if (assignedTo) parts.push(<span key="assigned"><span className="font-semibold">Assigned to:</span> {assignedTo}</span>);
        if (purpose) parts.push(<span key="purpose"><span className="font-semibold">Purpose:</span> {purpose}</span>);
        return (
          <div>
            <div>Registered</div>
            {parts.length > 0 && <div className="mt-1">{parts.map((part, idx) => <div key={idx}>{part}</div>)}</div>}
          </div>
        );
      }
      case 'status_changed': {
        const beforeStatus = (before?.status as string | null | undefined) ?? 'Unknown';
        const afterStatus = (after?.status as string | null | undefined) ?? 'Unknown';
        const beforeLabel = statusLabel[beforeStatus] ?? beforeStatus;
        const afterLabel = statusLabel[afterStatus] ?? afterStatus;
        return (
          <div>
            <span className="font-semibold">Status:</span> {beforeLabel} → {afterLabel}
          </div>
        );
      }
      case 'assigned_to_changed': {
        const beforeName = (before?.assignedTo as string | null | undefined) ?? '—';
        const afterName = (after?.assignedTo as string | null | undefined) ?? '—';
        return (
          <div>
            <span className="font-semibold">Assigned to:</span> {beforeName} → {afterName}
          </div>
        );
      }
      case 'purpose_changed': {
        const beforePurpose = (before?.purpose as string | null | undefined) ?? '—';
        const afterPurpose = (after?.purpose as string | null | undefined) ?? '—';
        return (
          <div>
            <span className="font-semibold">Purpose:</span> {beforePurpose} → {afterPurpose}
          </div>
        );
      }
      default:
        return <div>{log.action}</div>;
    }
  };

  const description = getDescription();

  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <div className={`mt-0.5 p-2 rounded-full ${config.bgColor}`}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
        </div>
        <div className="text-sm text-gray-600 mt-0.5">{description}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Avatar name={userName} size="xs" />
          <span className="text-xs text-gray-500">{userName}</span>
        </div>
      </div>
    </div>
  );
};

const DeviceAuditLogsModal = ({ isOpen, onClose, device }: DeviceAuditLogsModalProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    if (!device) return;

    setIsLoading(true);
    try {
      const response = await devicesApi.getAuditLogs(device.id);
      setLogs(response.data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && device) {
      fetchLogs();
    }
  }, [isOpen, device]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Device Activity Timeline" size="lg">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-gray-900 font-medium">
            {device?.name || '—'}
            {device?.model ? ` — ${device.model}` : ''}
          </span>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity found</div>
        ) : (
          <div className="px-6 py-4">
            {logs.map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Showing {logs.length} events</span>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export { DeviceAuditLogsModal };
