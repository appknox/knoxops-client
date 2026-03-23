import { Pencil, Trash2, Users, MailPlus } from 'lucide-react';
import { Avatar, Pagination } from '@/components/ui';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { formatDateTime } from '@/utils/formatters';
import type { UserListItem } from '@/types';

interface UserTableProps {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onResendInvite: (user: UserListItem) => void;
  isLoading?: boolean;
}

const UserTable = ({
  users,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onResendInvite,
  isLoading,
}: UserTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
        <p className="text-gray-500">Try adjusting your filters or invite a new user.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${user.firstName} ${user.lastName}`}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {(user.status === 'pending' || user.status === 'expired' || user.status === 'deleted') && (() => {
                      const sentAt = user.inviteLastSentAt ? new Date(user.inviteLastSentAt) : null;
                      const cooldownMs = 24 * 60 * 60 * 1000;
                      const throttled = sentAt ? (Date.now() - sentAt.getTime()) < cooldownMs : false;
                      const nextAllowed = sentAt ? new Date(sentAt.getTime() + cooldownMs) : null;
                      const label = user.status === 'pending' ? 'Resend Invite' : 'Re-invite';
                      const title = throttled && nextAllowed
                        ? `${label} — available after ${nextAllowed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today`
                        : label;
                      return (
                        <button
                          onClick={() => !throttled && onResendInvite(user)}
                          disabled={throttled}
                          className={`p-1.5 rounded-lg transition-colors ${
                            throttled
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title={title}
                        >
                          <MailPlus className="h-4 w-4" />
                        </button>
                      );
                    })()}
                    {user.status !== 'deleted' && (
                      <button
                        onClick={() => onDelete(user)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export { UserTable };
