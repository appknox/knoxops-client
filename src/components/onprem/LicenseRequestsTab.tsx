import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { LicenseRequestStatusBadge } from './LicenseRequestStatusBadge';
import { LicenseRequestDetailsModal } from './LicenseRequestDetailsModal';
import { useOnpremLicenseRequestStore } from '@/stores/onpremLicenseRequestStore';
import { usePermissions } from '@/hooks/usePermissions';
import { Plus, AlertCircle } from 'lucide-react';
import type { OnpremLicenseRequest } from '@/types/onprem-license-request.types';

interface LicenseRequestsTabProps {
  deploymentId: string;
  clientName: string;
  onOpenRequestModal: () => void;
}

export function LicenseRequestsTab({
  deploymentId,
  clientName,
  onOpenRequestModal,
}: LicenseRequestsTabProps) {
  const { requests, fetchRequests, isLoading } = useOnpremLicenseRequestStore();
  const { canManageOnprem } = usePermissions();
  const [selectedRequest, setSelectedRequest] = useState<OnpremLicenseRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests(deploymentId);
  }, [deploymentId, fetchRequests]);

  const handleRowClick = (request: OnpremLicenseRequest) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleFileUploaded = () => {
    handleDetailsClose();
    fetchRequests(deploymentId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fullName = (user?: { firstName: string; lastName: string } | null) => {
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

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
        <h3 className="text-lg font-medium text-gray-900 mb-1">No license requests</h3>
        <p className="text-gray-500 mb-4">No license key requests have been submitted yet</p>
        <Button onClick={onOpenRequestModal}>
          <Plus className="h-4 w-4 mr-2" />
          Request License Key
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">#</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Requested By</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">License Period</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Projects</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Requested At</th>
              {canManageOnprem && <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(request)}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-500">#{request.requestNo}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{fullName(request.requestedByUser)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(request.licenseStartDate)} — {formatDate(request.licenseEndDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.numberOfProjects}</td>
                <td className="px-6 py-4 text-sm">
                  <LicenseRequestStatusBadge status={request.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.createdAt)}</td>
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
        isOpen={detailsModalOpen}
        onClose={handleDetailsClose}
        request={selectedRequest}
        deploymentId={deploymentId}
        isAdmin={canManageOnprem}
        onFileUploaded={handleFileUploaded}
      />
    </>
  );
}
