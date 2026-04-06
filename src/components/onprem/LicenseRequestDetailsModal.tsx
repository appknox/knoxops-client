import { useState, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { LicenseRequestStatusBadge } from './LicenseRequestStatusBadge';
import { useOnpremLicenseRequestStore } from '@/stores/onpremLicenseRequestStore';
import { onpremLicenseRequestsApi } from '@/api/onpremLicenseRequests';
import { onpremApi } from '@/api/onprem';
import { Upload, Download, FileJson, PanelRightOpen, PanelRightClose, Copy, Check, X } from 'lucide-react';
import type { OnpremLicenseRequest } from '@/types/onprem-license-request.types';
import type { OnpremDeployment } from '@/types';

interface LicenseRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: OnpremLicenseRequest | null;
  deploymentId: string;
  isAdmin: boolean;
  onFileUploaded?: () => void;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="ml-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between text-sm gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`font-medium text-gray-900 text-right break-all flex items-center ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
        <CopyButton value={value} />
      </span>
    </div>
  );
}

export function LicenseRequestDetailsModal({
  isOpen,
  onClose,
  request,
  deploymentId,
  isAdmin,
  onFileUploaded,
}: LicenseRequestDetailsModalProps) {
  const { uploadFile, cancelRequest } = useOnpremLicenseRequestStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [showClientPanel, setShowClientPanel] = useState(false);
  const [deployment, setDeployment] = useState<OnpremDeployment | null>(null);
  const [clientLoading, setClientLoading] = useState(false);

  const handleToggleClientPanel = async () => {
    if (!showClientPanel && !deployment) {
      setClientLoading(true);
      try {
        const d = await onpremApi.getById(deploymentId);
        setDeployment(d);
      } catch {
        // ignore
      } finally {
        setClientLoading(false);
      }
    }
    setShowClientPanel((v) => !v);
  };

  const handleClose = () => {
    setShowCancelConfirm(false);
    setCancelReason('');
    setCancelError(null);
    setUploadError(null);
    setShowClientPanel(false);
    setDeployment(null);
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

  const handleExportJson = async () => {
    if (!request) return;
    setIsExporting(true);
    try {
      const d = deployment ?? await onpremApi.getById(deploymentId);
      if (!deployment) setDeployment(d);
      // Request fields take priority; fall back to client data when not provided in the request
      const resolvedFingerprint = request.fingerprint?.trim() || d.infrastructure?.fingerprint || undefined;
      const resolvedVersion = request.targetVersion?.trim() || d.currentVersion || undefined;
      const resolvedStartDate = request.licenseStartDate || d.license?.startDate || undefined;
      const resolvedEndDate = request.licenseEndDate || d.license?.endDate || undefined;
      const resolvedProjects = request.numberOfProjects ?? d.license?.numberOfApps ?? undefined;

      const payload = {
        request: {
          requestNo: request.requestNo,
          requestType: request.requestType,
          targetVersion: resolvedVersion,
          licenseStartDate: resolvedStartDate,
          licenseEndDate: resolvedEndDate,
          numberOfProjects: resolvedProjects,
          fingerprint: resolvedFingerprint,
          notes: request.notes || undefined,
          requestedBy: request.requestedByUser
            ? `${request.requestedByUser.firstName} ${request.requestedByUser.lastName}`
            : undefined,
        },
        client: {
          name: d.clientName,
          domainName: d.domainName,
          contactEmail: d.contactEmail,
          licenseUser: d.license?.userFullName ? {
            fullName: d.license.userFullName,
            email: d.license.email,
            username: d.license.username,
            pricingPlan: d.license.pricingPlan,
          } : undefined,
          network: d.infrastructure?.network ? {
            staticIP: d.infrastructure.network.staticIP,
            gateway: d.infrastructure.network.gateway,
            netmask: d.infrastructure.network.netmask,
            dnsServers: d.infrastructure.network.dnsServers,
            ntpServer: d.infrastructure.network.ntpServer,
            smtpServer: d.infrastructure.network.smtpServer,
          } : undefined,
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licence-request-${request.requestNo}-${d.clientName.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadFile(deploymentId, request!.id, file);
      onFileUploaded?.();
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { downloadUrl, fileName } = await onpremLicenseRequestsApi.downloadFile(request!.id);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fullName = (user?: { firstName: string; lastName: string } | null) =>
    user ? `${user.firstName} ${user.lastName}` : 'Unknown';

  if (!request) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className={showClientPanel ? 'max-w-4xl' : 'max-w-lg'}
    >
      {/* Custom header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          License Request #{request.requestNo}
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                disabled={isExporting}
                isLoading={isExporting}
                title="Download as JSON"
              >
                <FileJson className="h-4 w-4 mr-1.5" />
                Export JSON
              </Button>
              <button
                onClick={handleToggleClientPanel}
                title={showClientPanel ? 'Hide client info' : 'Show client info'}
                className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {showClientPanel
                  ? <PanelRightClose className="h-5 w-5" />
                  : <PanelRightOpen className="h-5 w-5" />
                }
              </button>
            </>
          )}
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body — two column when panel open */}
      <div className="flex divide-x divide-gray-200">

        {/* Left: request details */}
        <div className={`p-6 space-y-6 ${showClientPanel ? 'w-1/2' : 'w-full'}`}>

          {/* Status */}
          <div className="flex items-center justify-between">
            <LicenseRequestStatusBadge status={request.status} />
            <span className="text-xs text-gray-400">Submitted {formatDate(request.createdAt)}</span>
          </div>

          {/* Request Details */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Request Details</p>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                request.requestType === 'patch_update' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {request.requestType === 'patch_update' ? 'Patch Update' : 'License Renewal'}
              </span>
            </div>

            {request.targetVersion && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Version:</span>
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
                <span className="text-gray-900 bg-white p-2 rounded border border-gray-200">{request.notes}</span>
              </div>
            )}
          </div>

          {/* Upload Section - Admin Only & Pending */}
          {isAdmin && request.status === 'pending' && (
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Upload License File</p>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} disabled={isUploading} className="hidden" />
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
              <Button type="button" onClick={handleDownload} disabled={isDownloading} isLoading={isDownloading} className="w-full">
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
                  <span className="text-red-900 bg-white p-2 rounded border border-red-200">{request.cancellationReason}</span>
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
                <Button variant="outline" size="sm" onClick={() => { setShowCancelConfirm(false); setCancelError(null); }} disabled={isCancelling}>
                  Keep it
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={handleCancelRequest} disabled={isCancelling} isLoading={isCancelling}>
                  Confirm Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            {request.status === 'pending' && !showCancelConfirm ? (
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowCancelConfirm(true)}>
                Cancel Request
              </Button>
            ) : (
              <span />
            )}
            <Button variant="outline" onClick={handleClose}>Close</Button>
          </div>
        </div>

        {/* Right: client info panel */}
        {showClientPanel && (
          <div className="w-1/2 p-6 space-y-5 bg-gray-50 overflow-y-auto max-h-[80vh]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client Prerequisites</p>

            {clientLoading ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : deployment ? (
              <>
                {/* Resolved licence generation values — request takes priority, falls back to client */}
                {(() => {
                  const fingerprint = request.fingerprint?.trim() || deployment.infrastructure?.fingerprint;
                  const version = request.targetVersion?.trim() || deployment.currentVersion;
                  const startDate = request.licenseStartDate || deployment.license?.startDate;
                  const endDate = request.licenseEndDate || deployment.license?.endDate;
                  const projects = request.numberOfProjects ?? deployment.license?.numberOfApps;
                  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString() : undefined;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Licence Generation Data</p>
                      <InfoRow label="Version" value={version} />
                      <InfoRow label="Start Date" value={fmtDate(startDate)} />
                      <InfoRow label="End Date" value={fmtDate(endDate)} />
                      <InfoRow label="No. of Projects" value={projects != null ? String(projects) : undefined} />
                      <InfoRow label="Fingerprint" value={fingerprint} mono />
                    </div>
                  );
                })()}

                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Client</p>
                  <InfoRow label="Name" value={deployment.clientName} />
                  <InfoRow label="Domain" value={deployment.domainName} mono />
                  <InfoRow label="Contact" value={deployment.contactEmail} />
                </div>

                {(deployment.infrastructure?.network?.staticIP || deployment.infrastructure?.network?.smtpServer) && (
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Network</p>
                    <InfoRow label="Static IP" value={deployment.infrastructure.network?.staticIP} mono />
                    <InfoRow label="Gateway" value={deployment.infrastructure.network?.gateway} mono />
                    <InfoRow label="Netmask" value={deployment.infrastructure.network?.netmask} mono />
                    <InfoRow label="DNS" value={deployment.infrastructure.network?.dnsServers?.join(', ')} mono />
                    <InfoRow label="NTP" value={deployment.infrastructure.network?.ntpServer} mono />
                    <InfoRow label="SMTP" value={deployment.infrastructure.network?.smtpServer} mono />
                  </div>
                )}

                {deployment.license?.userFullName && (
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Licence User</p>
                    <InfoRow label="Full Name" value={deployment.license.userFullName} />
                    <InfoRow label="Email" value={deployment.license.email} />
                    <InfoRow label="Username" value={deployment.license.username} mono />
                    <InfoRow label="Pricing Plan" value={deployment.license.pricingPlan} />
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400">Failed to load client data.</div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
