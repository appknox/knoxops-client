import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  UserFilters,
  UserTable,
  UserSummaryCards,
  DeactivateUserDialog,
} from '@/components/users';
import { ConfirmDialog } from '@/components/ui';
import { useUserStore } from '@/stores';
import type { UserListItem } from '@/types';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const UserListPage = () => {
  const navigate = useNavigate();
  const { users, pagination, stats, isLoading, fetchUsers, fetchStats, setPage, resendInvite } =
    useUserStore();

  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
  const [resendTarget, setResendTarget] = useState<UserListItem | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleEdit = (user: UserListItem) => {
    navigate(`/settings/users/${user.id}/edit`);
  };

  const handleConfirmResend = async () => {
    if (!resendTarget) return;
    setIsSending(true);
    try {
      await resendInvite(resendTarget.id);
      setNotification({
        type: 'success',
        message: `Invite sent to ${resendTarget.email}.`,
      });
      await fetchUsers();
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (error as Error).message
        ?? 'Failed to send invite.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setIsSending(false);
      setResendTarget(null);
    }
  };

  return (
    <div>
      {/* Notification banner */}
      {notification && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-4 text-sm ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
        onResendInvite={(user) => setResendTarget(user)}
        isLoading={isLoading}
      />

      {/* Delete Dialog */}
      <DeactivateUserDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        user={deleteUser}
      />

      {/* Resend Invite Confirmation */}
      <ConfirmDialog
        isOpen={!!resendTarget}
        onClose={() => setResendTarget(null)}
        onConfirm={handleConfirmResend}
        title="Send Invite"
        message={
          resendTarget
            ? `Send ${resendTarget.status === 'pending' ? 'a reminder' : 'a new'} invite to ${resendTarget.email}?`
            : ''
        }
        confirmLabel="Send Invite"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isSending}
      />
    </div>
  );
};

export { UserListPage };
