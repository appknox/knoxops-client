import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Briefcase, Smartphone, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { onpremApi } from '@/api/onprem';
import { devicesApi } from '@/api/devices';
import { auditLogsApi } from '@/api/audit-logs';
import { notificationsApi } from '@/api/notifications';
import type { OnpremDeployment, DeviceStats, AuditLog } from '@/types';
import type { UpcomingPatch } from '@/api/notifications';

interface DashboardData {
  deployments: OnpremDeployment[];
  deviceStats: DeviceStats | null;
  recentLogs: AuditLog[];
  upcomingPatches: UpcomingPatch[];
}

interface LoadingState {
  deployments: boolean;
  devices: boolean;
  auditLogs: boolean;
  patches: boolean;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    deployments: [],
    deviceStats: null,
    recentLogs: [],
    upcomingPatches: [],
  });
  const [loading, setLoading] = useState<LoadingState>({
    deployments: true,
    devices: true,
    auditLogs: true,
    patches: true,
  });
  const [errors, setErrors] = useState<Partial<LoadingState>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [depResult, devResult, auditResult, patchResult] = await Promise.allSettled([
          onpremApi.list({ limit: 100 }),
          devicesApi.getStats(),
          auditLogsApi.list({ limit: 5 }),
          notificationsApi.previewPatchReminders(10),
        ]);

        // Handle deployments
        if (depResult.status === 'fulfilled') {
          setData((prev) => ({ ...prev, deployments: depResult.value.data || [] }));
        } else {
          console.error('Deployments fetch failed:', depResult.reason);
          setErrors((prev) => ({ ...prev, deployments: true }));
        }
        setLoading((prev) => ({ ...prev, deployments: false }));

        // Handle devices
        if (devResult.status === 'fulfilled') {
          setData((prev) => ({ ...prev, deviceStats: devResult.value }));
        } else {
          console.error('Devices fetch failed:', devResult.reason);
          setErrors((prev) => ({ ...prev, devices: true }));
        }
        setLoading((prev) => ({ ...prev, devices: false }));

        // Handle audit logs
        if (auditResult.status === 'fulfilled') {
          setData((prev) => ({ ...prev, recentLogs: auditResult.value.data || [] }));
        } else {
          console.error('Audit logs fetch failed:', auditResult.reason);
          setErrors((prev) => ({ ...prev, auditLogs: true }));
        }
        setLoading((prev) => ({ ...prev, auditLogs: false }));

        // Handle patches
        if (patchResult.status === 'fulfilled') {
          setData((prev) => ({ ...prev, upcomingPatches: patchResult.value.upcomingPatches || [] }));
        } else {
          console.error('Patches fetch failed:', patchResult.reason);
          setErrors((prev) => ({ ...prev, patches: true }));
        }
        setLoading((prev) => ({ ...prev, patches: false }));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const canViewDevices = ['admin', 'devices_admin', 'full_editor', 'devices_viewer', 'full_viewer'].includes(
    user?.role || ''
  );
  const canViewOnprem = ['admin', 'onprem_admin', 'onprem_viewer', 'full_editor', 'full_viewer'].includes(
    user?.role || ''
  );
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* On-Prem Deployments Card */}
        {canViewOnprem && (
          <OnpremDeploymentsCard
            deployments={data.deployments}
            loading={loading.deployments}
            error={errors.deployments}
          />
        )}

        {/* Device Inventory Card */}
        {canViewDevices && (
          <DeviceInventoryCard deviceStats={data.deviceStats} loading={loading.devices} error={errors.devices} />
        )}
      </div>

      {/* Activity and Sidebar Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <RecentActivityFeed logs={data.recentLogs} loading={loading.auditLogs} error={errors.auditLogs} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard isAdmin={isAdmin} canViewDevices={canViewDevices} canViewOnprem={canViewOnprem} navigate={navigate} />
          {canViewOnprem && (
            <UpcomingPatchesCard patches={data.upcomingPatches} loading={loading.patches} error={errors.patches} navigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component: OnpremDeploymentsCard
function OnpremDeploymentsCard({
  deployments,
  loading,
  error,
}: {
  deployments: OnpremDeployment[];
  loading: boolean;
  error?: boolean;
}) {
  const active = deployments.filter((d) => d.clientStatus === 'active').length;
  const inactive = deployments.filter((d) => d.clientStatus === 'inactive').length;
  const cancelled = deployments.filter((d) => d.clientStatus === 'cancelled').length;
  const total = active + inactive + cancelled;

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">On-Premise Deployments</h3>
        <div className="flex items-center justify-center h-40 text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Failed to load deployments
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">On-Premise Deployments</h3>
        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
      </div>
    );
  }

  // Calculate percentages
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const inactivePct = total > 0 ? (inactive / total) * 100 : 0;
  const cancelledPct = total > 0 ? (cancelled / total) * 100 : 0;

  // Build conic-gradient with cumulative stops
  let gradientStr = '';
  if (total === 0) {
    // Empty state: solid gray
    gradientStr = '#e5e7eb';
  } else {
    const stops: string[] = [];
    let currentPos = 0;

    // Active
    if (activePct > 0) {
      stops.push(`#E5493A ${currentPos}% ${currentPos + activePct}%`);
      currentPos += activePct;
    }

    // Inactive
    if (inactivePct > 0) {
      stops.push(`#fbbf24 ${currentPos}% ${currentPos + inactivePct}%`);
      currentPos += inactivePct;
    }

    // Cancelled
    if (cancelledPct > 0) {
      stops.push(`#94a3b8 ${currentPos}% ${currentPos + cancelledPct}%`);
    }

    gradientStr = `conic-gradient(${stops.join(', ')})`;
  }

  const segments = [
    { label: 'Active', count: active, color: '#E5493A' },
    { label: 'Inactive', count: inactive, color: '#fbbf24' },
    { label: 'Cancelled', count: cancelled, color: '#94a3b8' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="font-semibold text-gray-900 mb-4">On-Premise Deployments</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full flex-shrink-0" style={{ background: gradientStr }}>
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900">{total}</span>
          </div>
        </div>
        <div className="space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-gray-600">
                {seg.count} {seg.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component: DeviceInventoryCard
function DeviceInventoryCard({
  deviceStats,
  loading,
  error,
}: {
  deviceStats: DeviceStats | null;
  loading: boolean;
  error?: boolean;
}) {
  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Device Inventory</h3>
        <div className="flex items-center justify-center h-40 text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Failed to load devices
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Device Inventory</h3>
        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
      </div>
    );
  }

  const available = deviceStats?.inInventory || 0;
  const inUse = (deviceStats?.outForRepair || 0) + (deviceStats?.toBeSold || 0) + (deviceStats?.inactive || 0);
  const total = inUse + available;

  const inUsePct = total > 0 ? (inUse / total) * 100 : 0;
  const availablePct = total > 0 ? (available / total) * 100 : 0;

  // Build conic-gradient with proper cumulative stops
  let gradientStr = '';
  if (total === 0) {
    // Empty state: solid gray
    gradientStr = '#e5e7eb';
  } else {
    const stops: string[] = [];
    if (inUsePct > 0) {
      stops.push(`#E5493A 0% ${inUsePct}%`);
    }
    if (availablePct > 0) {
      stops.push(`#10b981 ${inUsePct}% 100%`);
    }
    gradientStr = `conic-gradient(${stops.join(', ')})`;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Device Inventory</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full flex-shrink-0" style={{ background: gradientStr }}>
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900">{total}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E5493A' }} />
            <span className="text-sm text-gray-600">{inUse} In Use</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
            <span className="text-sm text-gray-600">{available} Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component: RecentActivityFeed
function RecentActivityFeed({
  logs,
  loading,
  error,
}: {
  logs: AuditLog[];
  loading: boolean;
  error?: boolean;
}) {
  const getIcon = (module: string, action: string) => {
    const key = `${module}_${action}`;
    const iconMap: Record<string, { icon: React.ReactNode }> = {
      device_create: { icon: '📱' },
      device_update: { icon: '✏️' },
      devices_create: { icon: '📱' },
      devices_update: { icon: '✏️' },
      onprem_create: { icon: '🖥️' },
      onprem_update: { icon: '✏️' },
      auth_login: { icon: '🔐' },
      users_create: { icon: '👤' },
      users_update: { icon: '✏️' },
    };
    return iconMap[key] || { icon: '•' };
  };

  const formatRelativeTime = (createdAt: string) => {
    const now = new Date();
    const date = new Date(createdAt);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center h-40 text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Failed to load activity
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
      </div>
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No recent activity</div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const { icon } = getIcon(log.module, log.action);
            const description = log.entityName ? `${log.action} ${log.entityType || ''}: ${log.entityName}` : `${log.module} ${log.action}`;
            return (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate capitalize">{description}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(log.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper component: QuickActionsCard
function QuickActionsCard({
  isAdmin,
  canViewDevices,
  canViewOnprem,
  navigate,
}: {
  isAdmin: boolean;
  canViewDevices: boolean;
  canViewOnprem: boolean;
  navigate: any;
}) {
  const actions = [
    ...(canViewDevices ? [{ label: 'Register Device', icon: Plus, action: () => navigate('/devices/register') }] : []),
    ...(canViewOnprem ? [{ label: 'View On-Prem', icon: Briefcase, action: () => navigate('/onprem/clients') }] : []),
    ...(isAdmin ? [{ label: 'Manage Users', icon: UserPlus, action: () => navigate('/settings/users') }] : []),
    ...(canViewOnprem ? [{ label: 'License Requests', icon: FileText, action: () => navigate('/onprem/licence-requests') }] : []),
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.action}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <action.icon className="h-4 w-4 text-gray-600" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper component: UpcomingPatchesCard
function UpcomingPatchesCard({
  patches,
  loading,
  error,
  navigate,
}: {
  patches: UpcomingPatch[];
  loading: boolean;
  error?: boolean;
  navigate: any;
}) {
  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Upcoming Patches</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          Failed to load
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Upcoming Patches</h3>
        <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-red-50 to-red-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Upcoming Patches</h3>
      {patches.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm font-medium text-green-700">✓ All up to date</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-red-700 mb-3">{patches.length} patches due in next 10 days</p>
          <div className="space-y-2 mb-4">
            {patches.slice(0, 3).map((patch) => (
              <div key={patch.id} className="text-xs text-gray-700">
                <p className="font-medium">{patch.clientName}</p>
                <p className="text-gray-600">Due in {patch.daysUntilPatch} days</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/onprem/notifications')}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            View All →
          </button>
        </div>
      )}
    </div>
  );
}
