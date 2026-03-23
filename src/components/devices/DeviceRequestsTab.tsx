import { useEffect, useState } from 'react';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { usePermissions } from '@/hooks/usePermissions.js';
import { Button } from '@/components/ui';
import { RequestStatusBadge } from './RequestStatusBadge.js';
import { RejectRequestModal } from './RejectRequestModal.js';
import { CompleteRequestModal } from './CompleteRequestModal.js';
import { RequestDetailsModal } from './RequestDetailsModal.js';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { DeviceRequest } from '@/types/device-request.types.js';

const PAGE_SIZE = 20;

export function DeviceRequestsTab() {
  const { requests, fetchRequests, pagination, isLoading } = useDeviceRequestStore();
  const { user } = useAuthStore();
  const { canManageDevices } = usePermissions();
  const [page, setPage] = useState(1);
  const [rejectingRequest, setRejectingRequest] = useState<DeviceRequest | null>(null);
  const [completingRequest, setCompletingRequest] = useState<DeviceRequest | null>(null);
  const [detailsRequest, setDetailsRequest] = useState<DeviceRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const isAdmin = canManageDevices;
  const displayedRequests = isAdmin ? requests : requests.filter((r) => r.requestedBy === user?.id);
  const paginatedRequests = displayedRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(displayedRequests.length / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading requests...</div>
      </div>
    );
  }

  if (displayedRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {isAdmin ? 'No device requests yet' : 'You have no device requests'}
        </h3>
        <p className="text-gray-500">
          {isAdmin ? 'Device requests will appear here' : 'Request a device to get started'}
        </p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">#</th>
              {isAdmin && <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Requested By</th>}
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Device Type</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Platform</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">OS Version</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Purpose</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Requested At</th>
              {isAdmin && <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setDetailsRequest(request)}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-500">#{request.requestNo}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {request.requestedByUser?.firstName} {request.requestedByUser?.lastName}
                  </td>
                )}
                <td className="px-6 py-4 text-sm text-gray-900 capitalize">{request.deviceType}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.platform}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{request.osVersion || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={request.purpose}>
                  {request.purpose}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <RequestStatusBadge status={request.status} />
                    {request.status === 'completed' && request.linkedDeviceId && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Allocated
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.createdAt)}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Approve logic would call approveRequest from store
                              useDeviceRequestStore.getState().approveRequest(request.id);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingRequest(request)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCompletingRequest(request)}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectingRequest(request)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Showing {paginatedRequests.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to{' '}
          {Math.min(page * PAGE_SIZE, displayedRequests.length)} of {displayedRequests.length} requests
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      {rejectingRequest && (
        <RejectRequestModal
          isOpen={!!rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          request={rejectingRequest}
        />
      )}
      <RequestDetailsModal
        isOpen={!!detailsRequest}
        onClose={() => setDetailsRequest(null)}
        request={detailsRequest}
      />

      {completingRequest && (
        <CompleteRequestModal
          isOpen={!!completingRequest}
          onClose={() => setCompletingRequest(null)}
          requestId={completingRequest.id}
          request={completingRequest}
        />
      )}
    </>
  );
}
