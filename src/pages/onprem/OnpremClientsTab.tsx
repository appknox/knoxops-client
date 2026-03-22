import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  OnpremFilters,
  OnpremTable,
  DeleteOnpremDialog,
  VersionHistoryModal,
  DeploymentHistoryModal,
  RecordPatchDialog,
  PatchAlertModal,
} from '@/components/onprem';
import { useOnpremStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { onpremApi } from '@/api';
import type { OnpremDeployment } from '@/types';

const OnpremClientsTab = () => {
  const navigate = useNavigate();
  const { canManageOnprem } = usePermissions();
  const { deployments, pagination, isLoading, fetchDeployments, setPage } = useOnpremStore();

  const [deleteDeployment, setDeleteDeployment] = useState<OnpremDeployment | null>(null);
  const [historyDeployment, setHistoryDeployment] = useState<OnpremDeployment | null>(null);
  const [commentsDeployment, setCommentsDeployment] = useState<OnpremDeployment | null>(null);
  const [recordPatchDeployment, setRecordPatchDeployment] = useState<OnpremDeployment | null>(null);
  const [patchAlertTarget, setPatchAlertTarget] = useState<OnpremDeployment | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleEdit = (deployment: OnpremDeployment) => {
    navigate(`/onprem/${deployment.id}/edit`);
  };

  const handleDownload = async (deployment: OnpremDeployment) => {
    try {
      const blob = await onpremApi.downloadAll(deployment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deployment.clientName ?? deployment.id}-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download files:', error);
    }
  };

  return (
    <div>
      {/* Header with Register Button */}
      <div className="flex items-center justify-between mb-6">
        <div></div>
        {canManageOnprem && (
          <Link to="/onprem/register">
            <Button className="shadow-md shadow-primary-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Register New Client
            </Button>
          </Link>
        )}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <AlertCircle
            className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          />
          <p
            className={`text-sm ${
              notification.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {notification.message}
          </p>
        </div>
      )}

      {/* Filters */}
      <OnpremFilters />

      {/* Table */}
      <OnpremTable
        deployments={deployments}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={(deployment) => navigate(`/onprem/${deployment.id}`)}
        onEdit={handleEdit}
        onDelete={setDeleteDeployment}
        onViewHistory={setHistoryDeployment}
        onViewComments={setCommentsDeployment}
        onDownload={handleDownload}
        onPatchClick={setPatchAlertTarget}
        onRecordPatch={setRecordPatchDeployment}
        isLoading={isLoading}
      />

      {/* Modals */}
      <DeleteOnpremDialog
        isOpen={!!deleteDeployment}
        onClose={() => setDeleteDeployment(null)}
        deployment={deleteDeployment}
      />

      <VersionHistoryModal
        isOpen={!!historyDeployment}
        onClose={() => setHistoryDeployment(null)}
        deployment={historyDeployment}
      />

      <DeploymentHistoryModal
        isOpen={!!commentsDeployment}
        onClose={() => setCommentsDeployment(null)}
        deployment={commentsDeployment}
      />

      <RecordPatchDialog
        isOpen={!!recordPatchDeployment}
        onClose={() => setRecordPatchDeployment(null)}
        deployment={recordPatchDeployment}
        onSuccess={() => {
          setRecordPatchDeployment(null);
          fetchDeployments();
        }}
      />

      <PatchAlertModal
        isOpen={!!patchAlertTarget}
        onClose={() => setPatchAlertTarget(null)}
        deployment={patchAlertTarget}
        onSent={(clientName) => {
          setPatchAlertTarget(null);
          setNotification({
            type: 'success',
            message: `Slack alert sent for ${clientName}`,
          });
        }}
      />
    </div>
  );
};

export { OnpremClientsTab };
