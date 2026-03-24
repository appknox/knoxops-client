import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';
import { devicesApi } from '@/api/devices.js';
import type { DeviceRequest } from '@/types/device-request.types.js';
import type { SuggestedDevice } from '@/types/device-request.types.js';
import { Search, X } from 'lucide-react';

const MOBILE_PLATFORMS = ['iOS', 'Android'];

interface CompleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  request: DeviceRequest;
}

export function CompleteRequestModal({ isOpen, onClose, requestId, request }: CompleteRequestModalProps) {
  const { completeRequest } = useDeviceRequestStore();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [selectedDevice, setSelectedDevice] = useState<SuggestedDevice | null>(null);
  const [suggestedDevices, setSuggestedDevices] = useState<SuggestedDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [osVersions, setOsVersions] = useState<string[]>([]);
  const [selectedOsVersion, setSelectedOsVersion] = useState<string>(request.osVersion ?? '');

  const showOsFilter = MOBILE_PLATFORMS.includes(request.platform) &&
    ['mobile', 'tablet'].includes(request.deviceType);

  useEffect(() => {
    if (isOpen) {
      setSelectedOsVersion(request.osVersion ?? '');
      if (showOsFilter) {
        fetchOsVersions();
      }
      fetchSuggested(request.osVersion ?? undefined);
    }
  }, [isOpen]);

  const fetchOsVersions = async () => {
    try {
      const versions = await devicesApi.getDistinctOsVersions(
        request.platform as 'iOS' | 'Android'
      );
      setOsVersions(versions);
    } catch (error) {
      console.error('Failed to fetch OS versions:', error);
    }
  };

  const fetchSuggested = async (osVersion?: string) => {
    setIsLoading(true);
    try {
      const results = await devicesApi.suggestDevices(request.platform, osVersion);
      setSuggestedDevices(results);
    } catch (error) {
      console.error('Failed to fetch suggested devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOsVersionChange = (version: string) => {
    setSelectedOsVersion(version);
    setSelectedDevice(null);
    setSelectedDeviceId(undefined);
    setSearchQuery('');
    fetchSuggested(version || undefined);
  };

  const filteredDevices = suggestedDevices.filter((device) => {
    const query = searchQuery.toLowerCase();
    return (
      device.name.toLowerCase().includes(query) ||
      device.model?.toLowerCase().includes(query) ||
      device.osVersion?.toLowerCase().includes(query)
    );
  });

  const handleSelectDevice = (device: SuggestedDevice) => {
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
    setSelectedOsVersion(request.osVersion ?? '');
    onClose();
  };

  const deviceTypeLabel = request.deviceType.replace('_', ' ');
  const criteriaLabel = [request.platform, selectedOsVersion ? `${selectedOsVersion}+` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Complete Request #${request.requestNo}`} size="md">
      <div className="space-y-5 p-6">

        {/* Request summary */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm space-y-1">
          <div><span className="font-medium text-gray-700">Requested:</span> <span className="capitalize">{deviceTypeLabel}</span> · {criteriaLabel}</div>
          <div><span className="font-medium text-gray-700">Purpose:</span> {request.purpose}</div>
          {request.requestingFor && (
            <div><span className="font-medium text-gray-700">Assigning to:</span> {request.requestingFor}</div>
          )}
        </div>

        {/* OS Version filter (mobile/tablet only) */}
        {showOsFilter && osVersions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Filter by OS Version</label>
            <select
              value={selectedOsVersion}
              onChange={(e) => handleOsVersionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All {request.platform} versions</option>
              {osVersions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}

        {/* Device search */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Assign Device
            <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
          </label>
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
              placeholder={`Search ${request.platform}${selectedOsVersion ? ` ${selectedOsVersion}` : ''} devices...`}
              disabled={isLoading}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />

            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Loading matching devices...</div>
                ) : filteredDevices.length === 0 ? (
                  <div className="p-4 text-center text-sm">
                    <div className="text-gray-600">
                      No {request.platform}{selectedOsVersion ? ` ${selectedOsVersion}` : ''} devices in inventory
                    </div>
                    <div className="text-gray-400 text-xs mt-1">You can still complete without assigning a device</div>
                  </div>
                ) : (
                  filteredDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleSelectDevice(device)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b last:border-0"
                    >
                      <div className="font-medium text-gray-900 text-sm">{device.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {device.model || 'Unknown Model'}
                        {device.platform && <span> · {device.platform}</span>}
                        {device.osVersion && <span> {device.osVersion}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedDevice && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{selectedDevice.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {selectedDevice.model}
                  {selectedDevice.platform && <span> · {selectedDevice.platform}</span>}
                  {selectedDevice.osVersion && <span> {selectedDevice.osVersion}</span>}
                </div>
              </div>
              <button onClick={handleClearDevice} className="p-1 hover:bg-green-100 rounded">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
