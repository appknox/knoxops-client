import { Search, X } from 'lucide-react';
import { SearchInput, Select } from '@/components/ui';
import { useUserStore } from '@/stores';
import type { Role } from '@/types';

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'full_viewer', label: 'Member' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const UserFilters = () => {
  const { filters, setFilters, clearFilters } = useUserStore();

  const hasActiveFilters = filters.search || filters.role || filters.isActive;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <SearchInput
            placeholder="Search users by name or email..."
            value={filters.search}
            onChange={(value) => setFilters({ search: value })}
          />
        </div>

        <Select
          value={filters.role}
          onChange={(e) => setFilters({ role: e.target.value as Role | '' })}
          options={roleOptions}
          className="w-40"
        />

        <Select
          value={filters.isActive}
          onChange={(e) =>
            setFilters({ isActive: e.target.value as '' | 'true' | 'false' })
          }
          options={statusOptions}
          className="w-32"
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export { UserFilters };
