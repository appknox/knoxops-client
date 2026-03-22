import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';
import { devicesApi } from '@/api/devices.js';
import type { DeviceListItem } from '@/types';
import { Search, X } from 'lucide-react';

interface CompleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

export function CompleteRequestModal({ isOpen, onClose, requestId }: CompleteRequestModalProps) {
  const { completeRequest } = useDeviceRequestStore();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [selectedDevice, setSelectedDevice] = useState<DeviceListItem | null>(null);
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const response = await devicesApi.list({ status: 'active', limit: 100 });
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDevices = devices.filter((device) => {
    const query = searchQuery.toLowerCase();
    return device.name.toLowerCase().includes(query) || device.model?.toLowerCase().includes(query);
  });

  const handleSelectDevice = (device: DeviceListItem) => {
    setSelectedDevice(device);
    setSelectedDeviceId(device.id);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleClearDevice = () => {
    setSelectedDevice(null);
    setSelectedDeviceId(undefined);
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeRequest(requestId, selectedDeviceId);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedDevice(null);
    setSelectedDeviceId(undefined);
    setSearchQuery('');
    setShowDropdown(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Request" size="md">
      <div className="space-y-6 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Device (Optional)</label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by device name or model..."
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              />
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Loading devices...</div>
                ) : filteredDevices.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No active devices found</div>
                ) : (
                  filteredDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleSelectDevice(device)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-0"
                    >
                      <div className="font-medium text-gray-900">{device.name}</div>
                      <div className="text-sm text-gray-600">{device.model || 'Unknown Model'}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedDevice && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="font-medium text-gray-900">{selectedDevice.name}</div>
                <div className="text-sm text-gray-600">{selectedDevice.model}</div>
              </div>
              <button
                onClick={handleClearDevice}
                className="ml-auto p-1 hover:bg-blue-100 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Completing...' : 'Complete Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
