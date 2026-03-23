import { RotateCcw, Filter, Download } from 'lucide-react';
import { Select, Button, SearchInput } from '@/components/ui';
import { useDeviceStore } from '@/stores';
import { PURPOSE_OPTIONS, DEVICE_TYPE_OPTIONS } from '@/constants/deviceOptions';
import type { DeviceType, DeviceStatus } from '@/types';

const platformOptions = [
  { value: '', label: 'All Platforms' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'macOS', label: 'macOS' },
  { value: 'Windows', label: 'Windows' },
  { value: 'Linux', label: 'Linux' },
];

const typeOptions = [
  { value: '', label: 'All Device Types' },
  ...DEVICE_TYPE_OPTIONS,
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'In Inventory' },
  { value: 'inactive', label: 'Checked out of inventory' },
  { value: 'maintenance', label: 'Out for repair' },
  { value: 'decommissioned', label: 'To be sold' },
];

const purposeOptions = [
  { value: '', label: 'All Purposes' },
  ...PURPOSE_OPTIONS.filter((o) => o.value !== '__other__'),
];

const DeviceFilters = () => {
  const { filters, setFilters, clearFilters } = useDeviceStore();

  const hasActiveFilters =
    filters.search || filters.platform || filters.type || filters.status || filters.purpose;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters({ search: value })}
            placeholder="Search devices, serials..."
          />
        </div>

        <div className="w-40">
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(e) => setFilters({ type: e.target.value as DeviceType | '' })}
          />
        </div>

        <div className="w-40">
          <Select
            options={platformOptions}
            value={filters.platform}
            onChange={(e) => setFilters({ platform: e.target.value })}
          />
        </div>

        <div className="w-40">
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as DeviceStatus | '' })}
          />
        </div>

        <div className="w-40">
          <Select
            options={purposeOptions}
            value={filters.purpose}
            onChange={(e) => setFilters({ purpose: e.target.value })}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export { DeviceFilters };
