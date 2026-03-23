import { X } from 'lucide-react';
import { SearchInput, Select, MultiSelect } from '@/components/ui';
import { useUserStore } from '@/stores';
import type { Role, UserStatus } from '@/types';

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'full_viewer', label: 'Member' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'deleted', label: 'Deleted' },
];

const UserFilters = () => {
  const { filters, setFilters, clearFilters } = useUserStore();

  const hasActiveFilters = filters.search || filters.role || filters.status.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <select
          value={filters.role}
          onChange={(e) => setFilters({ role: e.target.value as Role | '' })}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {roleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="w-40">
          <MultiSelect
            options={statusOptions}
            selected={filters.status}
            onChange={(selected) => setFilters({ status: selected as UserStatus[] })}
            placeholder="All Status"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export { UserFilters };
