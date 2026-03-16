import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  DeviceFilters,
  DeviceTable,
  DeviceSummaryCards,
  EditDeviceModal,
  DeleteDeviceDialog,
  DeviceAuditLogsModal,
} from '@/components/devices';
import { useDeviceStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { devicesApi } from '@/api';
import type { Device, DeviceListItem } from '@/types';

const DeviceListPage = () => {
  const { canManageDevices } = usePermissions();
  const { devices, pagination, stats, isLoading, fetchDevices, fetchStats, setPage } =
    useDeviceStore();

  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<DeviceListItem | null>(null);
  const [historyDevice, setHistoryDevice] = useState<DeviceListItem | null>(null);

  // Fetch full device details for edit modal
  const handleEditDevice = async (device: DeviceListItem) => {
    try {
      const fullDevice = await devicesApi.getById(device.id);
      setEditDevice(fullDevice);
    } catch (error) {
      console.error('Failed to fetch device details:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [fetchDevices, fetchStats]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage hardware assets across all organizational units.
          </p>
        </div>
        {canManageDevices && (
          <Link to="/devices/register">
            <Button className="shadow-md shadow-primary-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Register New Device
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <DeviceFilters />

      {/* Device Table */}
      <DeviceTable
        devices={devices}
        pagination={pagination}
        onPageChange={setPage}
        onEdit={handleEditDevice}
        onDelete={setDeleteDevice}
        onViewHistory={setHistoryDevice}
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      <DeviceSummaryCards stats={stats} />

      {/* Modals */}
      <EditDeviceModal
        isOpen={!!editDevice}
        onClose={() => setEditDevice(null)}
        device={editDevice}
      />

      <DeleteDeviceDialog
        isOpen={!!deleteDevice}
        onClose={() => setDeleteDevice(null)}
        device={deleteDevice}
      />

      <DeviceAuditLogsModal
        isOpen={!!historyDevice}
        onClose={() => setHistoryDevice(null)}
        device={historyDevice}
      />
    </div>
  );
};

export { DeviceListPage };
