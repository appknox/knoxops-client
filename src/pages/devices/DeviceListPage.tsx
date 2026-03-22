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
  RequestDeviceModal,
  DeviceRequestsTab,
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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');

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
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage hardware assets across all organizational units.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowRequestModal(true)}
            className="shadow-md shadow-primary-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request a Device
          </Button>
          {canManageDevices && (
            <Link to="/devices/register">
              <Button className="shadow-md shadow-primary-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Register New Device
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'inventory'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'requests'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {canManageDevices ? 'Requests' : 'My Requests'}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'inventory' ? (
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
            isLoading={isLoading}
          />

          {/* Summary Cards */}
          <DeviceSummaryCards stats={stats} />
        </>
      ) : (
        <DeviceRequestsTab />
      )}

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

      <RequestDeviceModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  );
};

export { DeviceListPage };
