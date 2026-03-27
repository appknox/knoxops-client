import { useState, useEffect } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import { Select, Button, SearchInput, MultiSelect } from '@/components/ui';
import { useDeviceStore } from '@/stores';
import { devicesApi } from '@/api';
import { PURPOSE_OPTIONS, DEVICE_TYPE_OPTIONS } from '@/constants/deviceOptions';
import type { DeviceType, DeviceStatus } from '@/types';

// Mobile/tablet first, then the rest
const MOBILE_TYPES = ['mobile', 'tablet'];
const typeOptions = [
  { value: '', label: 'All Device Types' },
  ...DEVICE_TYPE_OPTIONS.filter((o) => MOBILE_TYPES.includes(o.value)),
  ...DEVICE_TYPE_OPTIONS.filter((o) => o.value === 'charging_hub'),
  ...DEVICE_TYPE_OPTIONS.filter((o) => !MOBILE_TYPES.includes(o.value) && o.value !== 'charging_hub'),
];

const platformOptions = [
  { value: '', label: 'All Platforms' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'in_inventory', label: 'In Inventory' },
  { value: 'checked_out', label: 'Checked out of inventory' },
  { value: 'maintenance', label: 'Out for repair' },
  { value: 'decommissioned', label: 'Removed from inventory' },
  { value: 'for_sale', label: 'For Sale' },
  { value: 'sold', label: 'Sold' },
  { value: 'not_verified', label: 'Not Verified' },
];

const purposeOptions = [
  { value: '', label: 'All Purposes' },
  ...PURPOSE_OPTIONS.filter((o) => o.value !== '__other__'),
];

const DeviceFilters = () => {
  const { filters, setFilters, clearFilters, fetchDevices, pagination } = useDeviceStore();
  const [osVersions, setOsVersions] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const showMobileFilters = filters.type === 'mobile' || filters.type === 'tablet';
  const showOsFilter = showMobileFilters && (filters.platform === 'iOS' || filters.platform === 'Android');

  // Fetch OS versions when platform changes (mobile/tablet only)
  useEffect(() => {
    if (!showMobileFilters || !filters.platform || (filters.platform !== 'iOS' && filters.platform !== 'Android')) {
      setOsVersions([]);
      return;
    }
    devicesApi
      .getDistinctOsVersions(filters.platform as 'iOS' | 'Android')
      .then(setOsVersions)
      .catch(() => setOsVersions([]));
  }, [filters.platform, showMobileFilters]);

  const handleTypeChange = (value: string) => {
    const isMobile = value === 'mobile' || value === 'tablet';
    setFilters({
      type: value as DeviceType | '',
      ...(isMobile ? {} : { platform: '', osVersions: [] }),
    });
  };

  const handlePlatformChange = (value: string) => {
    setFilters({ platform: value, osVersions: [] });
  };

  const hasActiveFilters =
    !!filters.search || !!filters.platform || !!filters.type || !!filters.status ||
    !!filters.purpose || filters.osVersions.length > 0;

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await devicesApi.list({
        page: 1,
        limit: 10000,
        search: filters.search || undefined,
        type: (filters.type as DeviceType) || undefined,
        status: (filters.status as DeviceStatus) || undefined,
        platform: filters.platform || undefined,
        osVersion: filters.osVersions.length > 0 ? filters.osVersions.join(',') : undefined,
        purpose: filters.purpose || undefined,
      });

      const rows = response.data;
      const headers = ['Name', 'Type', 'Platform', 'OS Version', 'Model', 'Status', 'Purpose', 'Assigned To'];
      const csvRows = [
        headers.join(','),
        ...rows.map((d) =>
          [
            d.name,
            d.type,
            d.platform ?? '',
            d.osVersion ?? '',
            d.model ?? '',
            d.status,
            d.purpose ?? '',
            d.assignedTo ?? '',
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];

      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devices-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters({ search: value })}
            placeholder="Search devices, serials, assigned to..."
          />
        </div>

        <div className="w-44">
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(e) => handleTypeChange(e.target.value)}
          />
        </div>

        {showMobileFilters && (
          <div className="w-40">
            <Select
              options={platformOptions}
              value={filters.platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
            />
          </div>
        )}

        {showOsFilter && osVersions.length > 0 && (
          <div className="w-36">
            <MultiSelect
              options={osVersions.map((v) => ({ value: v, label: v }))}
              selected={filters.osVersions}
              onChange={(values) => setFilters({ osVersions: values })}
              placeholder="All OS"
            />
          </div>
        )}

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

        <div className="ml-auto flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              title="Clear filters"
              className="p-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportLoading}
            title={exportLoading ? 'Exporting...' : 'Export devices'}
            className="p-2"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { DeviceFilters };
