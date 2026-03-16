import { useEffect, useState } from 'react';
import { Trash2, RotateCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { invitesApi } from '@/api/invites';
import type { Invite } from '@/types';

const InvitesTab = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await invitesApi.list();
      setInvites(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this invite?')) return;
    try {
      await invitesApi.revoke(id);
      setInvites(invites.filter(i => i.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await invitesApi.resend(id);
      fetchInvites();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-700"><Clock className="h-3 w-3" /> Pending</span>;
      case 'accepted':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700"><CheckCircle className="h-3 w-3" /> Accepted</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700"><XCircle className="h-3 w-3" /> Expired</span>;
      case 'revoked':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700"><XCircle className="h-3 w-3" /> Revoked</span>;
      default:
        return status;
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Invites</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading invites...</div>
      ) : invites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No invites found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{invite.email}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{invite.firstName} {invite.lastName}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 capitalize">{invite.role.replace('_', ' ')}</td>
                  <td className="px-6 py-3 text-sm">{getStatusBadge(invite.status)}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex gap-2">
                      {invite.status === 'expired' && (
                        <button
                          onClick={() => handleResend(invite.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Resend invite"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete invite"
                        disabled={invite.status === 'accepted'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { InvitesTab };
