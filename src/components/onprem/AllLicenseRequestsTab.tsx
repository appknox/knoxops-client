import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { LicenseRequestStatusBadge } from './LicenseRequestStatusBadge';
import { LicenseRequestDetailsModal } from './LicenseRequestDetailsModal';
import { useOnpremLicenseRequestStore } from '@/stores/onpremLicenseRequestStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { OnpremLicenseRequest } from '@/types/onprem-license-request.types';

export function AllLicenseRequestsTab() {
  const { requests, fetchAllRequests, isLoading } = useOnpremLicenseRequestStore();
  const { canManageOnprem } = usePermissions();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<OnpremLicenseRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  const handleRowClick = (request: OnpremLicenseRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedRequest(null);
  };

  const handleFileUploaded = () => {
    handleDetailsClose();
    fetchAllRequests();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const fullName = (user?: { firstName: string; lastName: string } | null) =>
    user ? `${user.firstName} ${user.lastName}` : '—';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No licence requests</h3>
        <p className="text-gray-500">No licence key requests have been submitted yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">#</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Type</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Client</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Requested By</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Requested At</th>
              {canManageOnprem && (
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(request)}
              >
                <td className="px-6 py-4 text-sm text-center font-medium text-gray-500">
                  #{request.requestNo}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                    request.requestType === 'patch_update'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {request.requestType === 'patch_update' ? 'Patch Update' : 'Renewal'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  <button
                    className="text-primary-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/onprem/${request.deploymentId}`);
                    }}
                  >
                    {request.clientName || '—'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-900">
                  {fullName(request.requestedByUser)}
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <LicenseRequestStatusBadge status={request.status} />
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  {formatDate(request.createdAt)}
                </td>
                {canManageOnprem && (
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleRowClick(request)}>
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleRowClick(request)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {request.status === 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => handleRowClick(request)}>
                          Download
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LicenseRequestDetailsModal
        isOpen={detailsOpen}
        onClose={handleDetailsClose}
        request={selectedRequest}
        deploymentId={selectedRequest?.deploymentId || ''}
        isAdmin={canManageOnprem}
        onFileUploaded={handleFileUploaded}
      />
    </>
  );
}
