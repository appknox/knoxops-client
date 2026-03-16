import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  UserFilters,
  UserTable,
  UserSummaryCards,
  DeactivateUserDialog,
} from '@/components/users';
import { useUserStore } from '@/stores';
import type { UserListItem } from '@/types';

const UserListPage = () => {
  const navigate = useNavigate();
  const { users, pagination, stats, isLoading, fetchUsers, fetchStats, setPage, resendInvite } =
    useUserStore();

  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleEdit = (user: UserListItem) => {
    navigate(`/users/${user.id}/edit`);
  };

  const handleResendInvite = async (user: UserListItem) => {
    try {
      await resendInvite(user.id);
      // Show success message - you can add a toast notification here
      await fetchUsers();
    } catch (error) {
      // Error handling - you can add a toast notification here
      console.error('Failed to resend invite:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage user access and permissions across the platform.
          </p>
        </div>
        <Link to="/settings/users/add">
          <Button className="shadow-md shadow-primary-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <UserSummaryCards stats={stats} />

      {/* Filters */}
      <UserFilters />

      {/* User Table */}
      <UserTable
        users={users}
        pagination={pagination}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={setDeleteUser}
        onResendInvite={handleResendInvite}
        isLoading={isLoading}
      />

      {/* Delete Dialog */}
      <DeactivateUserDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        user={deleteUser}
      />
    </div>
  );
};

export { UserListPage };
