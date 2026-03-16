import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  OnpremFilters,
  OnpremTable,
  DeleteOnpremDialog,
  VersionHistoryModal,
  DeploymentHistoryModal,
} from '@/components/onprem';
import { useOnpremStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { onpremApi } from '@/api';
import type { OnpremDeployment } from '@/types';

const OnpremListPage = () => {
  const navigate = useNavigate();
  const { canManageOnprem } = usePermissions();
  const { deployments, pagination, isLoading, fetchDeployments, setPage } = useOnpremStore();

  const [deleteDeployment, setDeleteDeployment] = useState<OnpremDeployment | null>(null);
  const [historyDeployment, setHistoryDeployment] = useState<OnpremDeployment | null>(null);
  const [commentsDeployment, setCommentsDeployment] = useState<OnpremDeployment | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const handleView = (deployment: OnpremDeployment) => {
    navigate(`/onprem/${deployment.id}`);
  };

  const handleEdit = (deployment: OnpremDeployment) => {
    navigate(`/onprem/${deployment.id}/edit`);
  };

  const handleDownload = async (deployment: OnpremDeployment) => {
    if (!deployment.prerequisiteFileUrl) return;

    try {
      const blob = await onpremApi.downloadPrerequisite(deployment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = deployment.prerequisiteFileName || 'prerequisite.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">On-Prem Client Management</h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage on-premise deployments across all clients.
          </p>
        </div>
        {canManageOnprem && (
          <Link to="/onprem/register">
            <Button className="shadow-md shadow-primary-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Register New Client
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <OnpremFilters />

      {/* Table */}
      <OnpremTable
        deployments={deployments}
        pagination={pagination}
        onPageChange={setPage}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeleteDeployment}
        onViewHistory={setHistoryDeployment}
        onViewComments={setCommentsDeployment}
        onDownload={handleDownload}
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
    </div>
  );
};

export { OnpremListPage };
