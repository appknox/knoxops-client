import { History, Pencil, Trash2, Server, Eye, Download, MessageSquare } from 'lucide-react';
import { Pagination } from '@/components/ui';
import { ClientStatusBadge, EnvironmentTypeBadge } from './OnpremStatusBadge';
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
  onView: (deployment: OnpremDeployment) => void;
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
  onView,
  onEdit,
  onDelete,
  onViewHistory,
  onViewComments,
  onDownload,
  isLoading,
}: OnpremTableProps) => {
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
                    <button
                      onClick={() => onView(deployment)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onDownload && (
                      <button
                        onClick={() => onDownload(deployment)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          deployment.prerequisiteFileUrl
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={deployment.prerequisiteFileUrl ? 'Download Prerequisite File' : 'No prerequisite file uploaded'}
                        disabled={!deployment.prerequisiteFileUrl}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onViewComments(deployment)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Comments & History"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(deployment)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(deployment)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
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
