import { useEffect, useState } from 'react';
import { DeviceFilters, DeviceTable, DeviceSummaryCards, EditDeviceModal, DeleteDeviceDialog, DeviceAuditLogsModal } from '@/components/devices';
import { useDeviceStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { devicesApi } from '@/api';
import type { Device, DeviceListItem } from '@/types';

const InventoryTab = () => {
  const { canManageDevices } = usePermissions();
  const { devices, pagination, stats, isLoading, fetchDevices, fetchStats, setPage } = useDeviceStore();

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
    <>
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
        onRowClick={handleEditDevice}
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      <DeviceSummaryCards stats={stats} />

      {/* Modals */}
      <EditDeviceModal
        isOpen={!!editDevice}
        onClose={() => setEditDevice(null)}
        device={editDevice}
        readOnly={!canManageDevices}
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
    </>
  );
};

export { InventoryTab };
