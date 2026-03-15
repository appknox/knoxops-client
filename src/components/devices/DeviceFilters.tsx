import { RotateCcw, Filter, Download } from 'lucide-react';
import { Select, Button, SearchInput } from '@/components/ui';
import { useDeviceStore } from '@/stores';
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
  { value: '', label: 'All Models' },
  { value: 'server', label: 'Server' },
  { value: 'workstation', label: 'Workstation' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'iot', label: 'IoT' },
  { value: 'network', label: 'Network' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'In Inventory' },
  { value: 'maintenance', label: 'Out for Repair' },
  { value: 'decommissioned', label: 'To Be Sold' },
  { value: 'inactive', label: 'Not Verified' },
];

const allocatedToOptions = [
  { value: '', label: 'All Assignees' },
  { value: 'Engineering Team', label: 'Engineering Team' },
  { value: 'Testing Team', label: 'Testing Team' },
  { value: 'Sales Team', label: 'Sales Team' },
  { value: 'Marketing Team', label: 'Marketing Team' },
];

const purposeOptions = [
  { value: '', label: 'All Purposes' },
  { value: 'Development', label: 'Development' },
  { value: 'Production', label: 'Production' },
  { value: 'QA', label: 'QA / Testing' },
];

const DeviceFilters = () => {
  const { filters, setFilters, clearFilters } = useDeviceStore();

  const hasActiveFilters =
    filters.search || filters.platform || filters.type || filters.status || filters.assignedTo || filters.purpose;

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
            options={platformOptions}
            value={filters.platform}
            onChange={(e) => setFilters({ platform: e.target.value })}
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
            options={statusOptions}
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as DeviceStatus | '' })}
          />
        </div>

        <div className="w-44">
          <Select
            options={allocatedToOptions}
            value={filters.assignedTo}
            onChange={(e) => setFilters({ assignedTo: e.target.value })}
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
