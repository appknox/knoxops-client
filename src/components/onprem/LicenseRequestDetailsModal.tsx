import { useState, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { LicenseRequestStatusBadge } from './LicenseRequestStatusBadge';
import { useOnpremLicenseRequestStore } from '@/stores/onpremLicenseRequestStore';
import { onpremLicenseRequestsApi } from '@/api/onpremLicenseRequests';
import { Upload, Download } from 'lucide-react';
import type { OnpremLicenseRequest } from '@/types/onprem-license-request.types';

interface LicenseRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: OnpremLicenseRequest | null;
  deploymentId: string;
  isAdmin: boolean;
  onFileUploaded?: () => void;
}

export function LicenseRequestDetailsModal({
  isOpen,
  onClose,
  request,
  deploymentId,
  isAdmin,
  onFileUploaded,
}: LicenseRequestDetailsModalProps) {
  const { uploadFile, generateToken, cancelRequest } = useOnpremLicenseRequestStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleClose = () => {
    setShowCancelConfirm(false);
    setCancelReason('');
    setCancelError(null);
    setUploadError(null);
    onClose();
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelRequest(deploymentId, request!.id, cancelReason.trim() || undefined);
      handleClose();
      onFileUploaded?.();
    } catch (err: any) {
      setCancelError(err.response?.data?.error || err.message || 'Failed to cancel request');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!request) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fullName = (user?: { firstName: string; lastName: string } | null) => {
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadFile(deploymentId, request.id, file);
      onFileUploaded?.();
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { token } = await generateToken(request.id);
      const downloadUrl = `${window.location.origin}/api${onpremLicenseRequestsApi.getDownloadUrl(request.id, token)}`;
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      console.error('Failed to download:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`License Request #${request.requestNo}`} size="md">
      <div className="p-6 space-y-6">
        {/* Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <LicenseRequestStatusBadge status={request.status} />
            </div>
            <span className="text-xs text-gray-400">Submitted {formatDate(request.createdAt)}</span>
          </div>
        </div>

        {/* Request Details */}
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Request Details</p>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Type:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
              request.requestType === 'patch_update'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {request.requestType === 'patch_update' ? 'Patch Update' : 'License Renewal'}
            </span>
          </div>

          {request.requestType === 'patch_update' && request.targetVersion && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target Version:</span>
              <span className="font-medium text-gray-900">{request.targetVersion}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Requested By:</span>
            <span className="font-medium text-gray-900">{fullName(request.requestedByUser)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">License Period:</span>
            <span className="font-medium text-gray-900">
              {new Date(request.licenseStartDate).toLocaleDateString()} —{' '}
              {new Date(request.licenseEndDate).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Number of Projects:</span>
            <span className="font-medium text-gray-900">{request.numberOfProjects}</span>
          </div>

          {request.fingerprint && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fingerprint:</span>
              <span className="font-medium text-gray-900 font-mono text-xs break-all text-right max-w-[60%]">{request.fingerprint}</span>
            </div>
          )}

          {request.notes && (
            <div className="flex flex-col text-sm">
              <span className="text-gray-600 mb-1">Notes:</span>
              <span className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                {request.notes}
              </span>
            </div>
          )}
        </div>

        {/* Upload Section - Admin Only & Pending */}
        {isAdmin && request.status === 'pending' && (
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Upload License File</p>

            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                isLoading={isUploading}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>
        )}

        {/* Download Section - Completed */}
        {request.status === 'completed' && (
          <div className="border rounded-lg p-4 bg-green-50 border-green-200 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Generated License File</p>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">File:</span>
              <span className="font-medium text-gray-900">{request.fileName}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Generated By:</span>
              <span className="font-medium text-gray-900">{fullName(request.uploadedByUser)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Generated At:</span>
              <span className="font-medium text-gray-900">{formatDate(request.uploadedAt)}</span>
            </div>

            <Button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              isLoading={isDownloading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Preparing...' : 'Download File'}
            </Button>

            <p className="text-xs text-gray-500 text-center">Download link valid for 10 days</p>
          </div>
        )}

        {/* Cancellation Section */}
        {request.status === 'cancelled' && (
          <div className="border rounded-lg p-4 bg-red-50 border-red-200 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Cancellation Details</p>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cancelled By:</span>
              <span className="font-medium text-gray-900">{fullName(request.cancelledByUser)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cancelled At:</span>
              <span className="font-medium text-gray-900">{formatDate(request.cancelledAt)}</span>
            </div>

            {request.cancellationReason && (
              <div className="flex flex-col text-sm">
                <span className="text-gray-600 mb-1">Reason:</span>
                <span className="text-red-900 bg-white p-2 rounded border border-red-200">
                  {request.cancellationReason}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cancel confirmation */}
        {request.status === 'pending' && showCancelConfirm && (
          <div className="border rounded-lg p-4 bg-red-50 border-red-200 space-y-3">
            <p className="text-sm font-medium text-red-700">Cancel this request?</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
            />
            {cancelError && <p className="text-xs text-red-600">{cancelError}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowCancelConfirm(false); setCancelError(null); }}
                disabled={isCancelling}
              >
                Keep it
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={handleCancelRequest}
                disabled={isCancelling}
                isLoading={isCancelling}
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          {request.status === 'pending' && !showCancelConfirm ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Request
            </Button>
          ) : (
            <span />
          )}
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
