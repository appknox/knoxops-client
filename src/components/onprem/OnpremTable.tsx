import { History, Pencil, Trash2, Server, Download, MessageSquare } from 'lucide-react';
import { Pagination } from '@/components/ui';
import { ClientStatusBadge, EnvironmentTypeBadge } from './OnpremStatusBadge';
import { usePermissions } from '@/hooks/usePermissions';
import type { OnpremDeployment } from '@/types';

interface OnpremTableProps {
  deployments: OnpremDeployment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onEdit: (deployment: OnpremDeployment) => void;
  onDelete: (deployment: OnpremDeployment) => void;
  onViewHistory: (deployment: OnpremDeployment) => void;
  onViewComments: (deployment: OnpremDeployment) => void;
  onDownload?: (deployment: OnpremDeployment) => void;
  isLoading?: boolean;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const OnpremTable = ({
  deployments,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onViewHistory,
  onViewComments,
  onDownload,
  isLoading,
}: OnpremTableProps) => {
  const { canManageOnprem, canDeleteOnprem } = usePermissions();

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

  if (deployments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No deployments found</h3>
        <p className="text-gray-500">Try adjusting your filters or register a new on-prem client.</p>
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
                Client Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Environment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Patch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {deployments.map((deployment) => (
              <tr key={deployment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Server className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-gray-900">{deployment.clientName}</span>
                    {(() => {
                      if (!deployment.nextScheduledPatchDate) return null;
                      const days = Math.ceil(
                        (new Date(deployment.nextScheduledPatchDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      );
                      if (days < 0 || days > 10) return null;
                      const color =
                        days <= 3 ? 'bg-red-500' : days <= 7 ? 'bg-yellow-400' : 'bg-green-500';
                      const label =
                        days === 0
                          ? 'Patch due today'
                          : `Patch in ${days} day${days === 1 ? '' : 's'} — ${new Date(deployment.nextScheduledPatchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      return (
                        <span className="relative group ml-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${color} animate-pulse`}
                          />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
                            {label}
                          </span>
                        </span>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ClientStatusBadge status={deployment.clientStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EnvironmentTypeBadge type={deployment.environmentType} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {deployment.currentVersion || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(deployment.lastPatchDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {deployment.domainName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onDownload && (
                      <button
                        onClick={() => onDownload(deployment)}
                        className="p-1.5 rounded-lg transition-colors text-green-600 hover:bg-green-50 cursor-pointer"
                        title="Download All Files (ZIP)"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onViewComments(deployment)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Comments & History"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={canManageOnprem ? () => onEdit(deployment) : undefined}
                      disabled={!canManageOnprem}
                      className={`p-1.5 rounded-lg transition-colors ${
                        canManageOnprem
                          ? 'text-orange-600 hover:bg-orange-50 cursor-pointer'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={canManageOnprem ? 'Edit' : 'You do not have permission to edit'}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={canDeleteOnprem ? () => onDelete(deployment) : undefined}
                      disabled={!canDeleteOnprem}
                      className={`p-1.5 rounded-lg transition-colors ${
                        canDeleteOnprem
                          ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={canDeleteOnprem ? 'Delete' : 'You do not have permission to delete'}
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

export { OnpremTable };
