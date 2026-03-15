import { useState, useEffect } from 'react';
import { History, Download, RefreshCw } from 'lucide-react';
import { Modal, Button, Badge, Avatar } from '@/components/ui';
import { devicesApi } from '@/api';
import { formatDateTime } from '@/utils/formatters';
import type { DeviceListItem } from '@/types';
import type { AuditLog } from '@/types';

interface DeviceAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceListItem | null;
}

const actionBadgeVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  device_created: 'success',
  device_updated: 'info',
  device_deleted: 'danger',
  status_changed: 'info',
};

const actionLabels: Record<string, string> = {
  device_created: 'Enrollment',
  device_updated: 'Updated',
  device_deleted: 'Deleted',
  status_changed: 'Status Change',
};

const DeviceAuditLogsModal = ({ isOpen, onClose, device }: DeviceAuditLogsModalProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async (filterStartDate?: string, filterEndDate?: string) => {
    if (!device) return;

    setIsLoading(true);
    try {
      const response = await devicesApi.getAuditLogs(device.id, filterStartDate, filterEndDate);
      setLogs(response.data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchLogs(startDate || undefined, endDate || undefined);
  };

  useEffect(() => {
    if (isOpen && device) {
      fetchLogs();
    }
  }, [isOpen, device]);

  const handleExportCSV = () => {
    const headers = ['Date/Time', 'User', 'Action', 'Details'];
    const rows = logs.map((log) => [
      formatDateTime(log.createdAt),
      log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      actionLabels[log.action] || log.action,
      JSON.stringify(log.changes || {}),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((row) => row.join(',')).join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `device-${device?.id}-audit-logs.csv`;
    link.click();
  };

  const getActionDetails = (log: AuditLog): string => {
    if (!log.changes) return '';

    const { before, after } = log.changes;
    if (log.action === 'status_changed' && before && after) {
      return `Changed status from '${before.status}' to '${after.status}'`;
    }
    if (log.action === 'device_created') {
      return 'Device registered';
    }
    if (log.action === 'device_updated') {
      const changedFields = Object.keys(after || {}).filter(
        (key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])
      );
      return `Updated: ${changedFields.join(', ')}`;
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Device Audit Logs" size="xl">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <History className="h-4 w-4" />
          DEVICE ID: {device?.id?.substring(0, 8).toUpperCase() || '-'}
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">FROM DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">TO DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="mt-5" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={`${log.user.firstName} ${log.user.lastName}`} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-500">S</span>
                        </div>
                        <span className="text-sm text-gray-500">System</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={actionBadgeVariant[log.action] || 'default'}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {getActionDetails(log)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Showing {logs.length} logs</span>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export { DeviceAuditLogsModal };
