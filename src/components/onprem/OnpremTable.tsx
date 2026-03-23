import { History, Pencil, Trash2, Server, Download, MessageSquare, CheckCheck, BellRing } from 'lucide-react';
import { Pagination, Tooltip } from '@/components/ui';
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
  onRowClick?: (deployment: OnpremDeployment) => void;
  onEdit: (deployment: OnpremDeployment) => void;
  onDelete: (deployment: OnpremDeployment) => void;
  onViewHistory: (deployment: OnpremDeployment) => void;
  onViewComments: (deployment: OnpremDeployment) => void;
  onDownload?: (deployment: OnpremDeployment) => void;
  onPatchClick?: (deployment: OnpremDeployment) => void;
  onRecordPatch?: (deployment: OnpremDeployment) => void;
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
  onRowClick,
  onEdit,
  onDelete,
  onViewHistory,
  onViewComments,
  onDownload,
  onPatchClick,
  onRecordPatch,
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
    <div className="bg-white rounded-xl border border-gray-200">
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
            {deployments.map((deployment) => {
              // Calculate patch proximity once per row (includes overdue)
              const patchDaysAway = deployment.nextScheduledPatchDate
                ? Math.ceil(
                    (new Date(deployment.nextScheduledPatchDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;
              // Show for upcoming (0-5 days) OR overdue (< 0 days), hide only if > 5 days away
              // Only show indicator for active clients
              const shouldShowIndicator = deployment.clientStatus === 'active' && patchDaysAway !== null && patchDaysAway <= 5;

              return (
              <tr
                key={deployment.id}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(deployment)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Server className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-gray-900">{deployment.clientName}</span>
                    {shouldShowIndicator && (() => {
                      const patchDate = new Date(deployment.nextScheduledPatchDate!);
                      const days = patchDaysAway!;
                      const dateLabel = patchDate.toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      });
                      const isOverdue = days < 0;
                      const dotColor = isOverdue
                        ? 'bg-red-600'
                        : days === 0
                        ? 'bg-red-500'
                        : days <= 2
                        ? 'bg-orange-500'
                        : 'bg-yellow-400';
                      const pulseClass = isOverdue
                        ? 'animate-[pulse_0.8s_ease-in-out_infinite]'
                        : 'animate-pulse';
                      const tooltipTitle = isOverdue
                        ? '⚠️ Patch Overdue'
                        : days === 0
                        ? '🚨 Due Today'
                        : '🔔 Upcoming Patch';
                      const tooltipText = isOverdue
                        ? `Overdue — was due ${dateLabel} (${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago)`
                        : days === 0
                        ? `Due today — ${dateLabel}`
                        : `Due in ${days} day${days === 1 ? '' : 's'} — ${dateLabel}`;

                      return (
                        <div className="relative group inline-flex items-center ml-2 gap-1">
                          {/* Clickable dot with dynamic color/pulse */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onPatchClick?.(deployment); }}
                            className={`w-2.5 h-2.5 rounded-full ${dotColor} ${pulseClass} cursor-pointer hover:scale-125 transition-transform`}
                            title="Click to view patch details and send Slack alert"
                          />
                          {/* Bell icon */}
                          <BellRing className="h-3.5 w-3.5 text-blue-500" title="Patch Alert" />
                          {/* Hover tooltip card */}
                          <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg space-y-1">
                            <p className={`font-semibold ${isOverdue ? 'text-red-300' : 'text-yellow-300'}`}>{tooltipTitle}</p>
                            <p>📅 {dateLabel}</p>
                            <p>⏰ {tooltipText.split(' — ')[1] || tooltipText}</p>
                            {deployment.currentVersion && <p>🔖 v{deployment.currentVersion}</p>}
                            <p>🖥 {deployment.environmentType}</p>
                            <p className="text-yellow-200 mt-2 border-t border-gray-700 pt-1">Click to send Slack alert</p>
                          </div>
                        </div>
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
                <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {onDownload && (
                      <Tooltip content="Download All Files (ZIP)" size="sm" align="right">
                        <button
                          onClick={() => onDownload(deployment)}
                          className="p-1.5 rounded-lg transition-colors text-green-600 hover:bg-green-50 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip content="View Comments & Deployment History" size="sm" align="right">
                      <button
                        onClick={() => onViewComments(deployment)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content={canManageOnprem ? 'Edit Deployment' : 'You do not have permission to edit'} size="sm" align="right">
                      <button
                        onClick={canManageOnprem ? () => onEdit(deployment) : undefined}
                        disabled={!canManageOnprem}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canManageOnprem
                            ? 'text-orange-600 hover:bg-orange-50 cursor-pointer'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    {onRecordPatch && canManageOnprem && shouldShowIndicator && (
                      <Tooltip content="Record Patch Deployment" size="sm" align="right">
                        <button
                          onClick={() => onRecordPatch(deployment)}
                          className="p-1.5 rounded-lg transition-colors text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip content={canDeleteOnprem ? 'Delete Deployment' : 'You do not have permission to delete'} size="sm" align="right">
                      <button
                        onClick={canDeleteOnprem ? () => onDelete(deployment) : undefined}
                        disabled={!canDeleteOnprem}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canDeleteOnprem
                            ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            );
            })}
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
