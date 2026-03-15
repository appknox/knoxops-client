import { RotateCcw, Filter, Download } from 'lucide-react';
import { Select, Button, SearchInput } from '@/components/ui';
import { useOnpremStore } from '@/stores';
import type { ClientStatus, DeploymentStatus, EnvironmentType, MaintenancePlan } from '@/types';

const clientStatusOptions = [
  { value: '', label: 'All Client Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const deploymentStatusOptions = [
  { value: '', label: 'All Health Statuses' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'offline', label: 'Offline' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const environmentOptions = [
  { value: '', label: 'All Environments' },
  { value: 'poc', label: 'POC' },
  { value: 'production', label: 'Production' },
];

const maintenanceOptions = [
  { value: '', label: 'All Maintenance Plans' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const OnpremFilters = () => {
  const { filters, setFilters, clearFilters } = useOnpremStore();

  const hasActiveFilters =
    filters.search || filters.clientStatus || filters.status || filters.environmentType || filters.maintenancePlan;

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

        <div className="w-44">
          <Select
            options={deploymentStatusOptions}
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as DeploymentStatus | '' })}
          />
        </div>

        <div className="w-44">
          <Select
            options={maintenanceOptions}
            value={filters.maintenancePlan}
            onChange={(e) => setFilters({ maintenancePlan: e.target.value as MaintenancePlan | '' })}
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

export { OnpremFilters };
