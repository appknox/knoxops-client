import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Select, Button, SearchInput, MultiSelect } from '@/components/ui';
import { useOnpremStore } from '@/stores';
import { onpremApi } from '@/api';
import type { ClientStatus, EnvironmentType } from '@/types';

const clientStatusOptions = [
  { value: '', label: 'All Client Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const environmentOptions = [
  { value: '', label: 'All Environments' },
  { value: 'poc', label: 'POC' },
  { value: 'production', label: 'Production' },
];

const OnpremFilters = () => {
  const { filters, setFilters, clearFilters } = useOnpremStore();
  const [versionOptions, setVersionOptions] = useState<{ value: string; label: string }[]>([]);
  const [csmOptions, setCsmOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    // Fetch distinct versions
    onpremApi
      .getDistinctVersions()
      .then((versions) => {
        setVersionOptions(versions.map((v) => ({ value: v, label: v })));
      })
      .catch((error) => {
        console.error('Failed to fetch distinct versions:', error);
      });

    // Fetch distinct CSM users
    onpremApi
      .getDistinctCsmUsers()
      .then((users) => {
        setCsmOptions(
          users.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName}`,
          }))
        );
      })
      .catch((error) => {
        console.error('Failed to fetch distinct CSM users:', error);
      });
  }, []);

  const hasActiveFilters =
    filters.search ||
    filters.clientStatus ||
    filters.environmentType ||
    filters.appknoxVersions.length > 0 ||
    filters.csmIds.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={filters.search}
            onChange={(value) => setFilters({ search: value })}
            placeholder="Search clients, domains..."
          />
        </div>

        <div className="w-40">
          <Select
            options={clientStatusOptions}
            value={filters.clientStatus}
            onChange={(e) => setFilters({ clientStatus: e.target.value as ClientStatus | '' })}
          />
        </div>

        <div className="w-40">
          <Select
            options={environmentOptions}
            value={filters.environmentType}
            onChange={(e) => setFilters({ environmentType: e.target.value as EnvironmentType | '' })}
          />
        </div>

        <div className="w-52">
          <MultiSelect
            options={versionOptions}
            selected={filters.appknoxVersions}
            onChange={(vals) => setFilters({ appknoxVersions: vals })}
            placeholder="All Versions"
          />
        </div>

        <div className="w-52">
          <MultiSelect
            options={csmOptions}
            selected={filters.csmIds}
            onChange={(vals) => setFilters({ csmIds: vals })}
            placeholder="All CSMs"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export { OnpremFilters };
