import { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useMatch, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { RequestLicenseModal } from '@/components/onprem/RequestLicenseModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useOnpremStore } from '@/stores/onpremStore';
import type { OnpremDeployment } from '@/types';

const tabs = [
  { path: '/onprem/clients', label: 'Clients' },
  { path: '/onprem/licence-requests', label: 'Licence Requests' },
  { path: '/onprem/releases', label: 'OVA Releases' },
  { path: '/onprem/notifications', label: 'Notifications' },
];

const activeClass = 'border-primary-600 text-primary-600';
const inactiveClass = 'border-transparent text-gray-500 hover:text-gray-700';

const OnpremPage = () => {
  const { pathname } = useLocation();
  const { canManageOnprem } = usePermissions();
  const { deployments, fetchDeployments } = useOnpremStore();
  const detailMatch = useMatch('/onprem/:id');
  const knownSlugs = new Set(['clients', 'licence-requests', 'releases', 'notifications']);
  const isDetailPage = detailMatch && !knownSlugs.has(detailMatch.params.id ?? '');
  const isLicenceRequestsTab = pathname === '/onprem/licence-requests';

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelectedId, setPickerSelectedId] = useState('');
  const [requestModalDeployment, setRequestModalDeployment] = useState<OnpremDeployment | null>(null);

  const handleOpenPicker = () => {
    fetchDeployments();
    setPickerSelectedId('');
    setPickerOpen(true);
  };

  const handlePickerConfirm = () => {
    const deployment = deployments.find((d) => d.id === pickerSelectedId);
    if (!deployment) return;
    setPickerOpen(false);
    setRequestModalDeployment(deployment);
  };

  // Redirect /onprem exactly to /onprem/clients
  if (pathname === '/onprem') {
    return <Navigate to="/onprem/clients" replace />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">On-Prem Client Management</h1>
        <p className="text-gray-500 mt-1">
          Monitor and manage on-premise deployments across all clients.
        </p>
      </div>
      <div className="border-b border-gray-200 mb-6 flex items-end justify-between">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const forceActive = isDetailPage && tab.path === '/onprem/clients';
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `pb-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive || forceActive ? activeClass : inactiveClass
                  }`
                }
              >
                {tab.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex gap-3 pb-3">
          {isLicenceRequestsTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPicker}
              className="shadow-md shadow-primary-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Request Licence Key
            </Button>
          )}
          {canManageOnprem && (
            <Link to="/onprem/register">
              <Button size="sm" className="shadow-md shadow-primary-500/20">
                <Plus className="h-4 w-4 mr-1.5" />
                Register New Client
              </Button>
            </Link>
          )}
        </div>
      </div>
      <Outlet />

      {/* Client picker modal */}
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Select Client" size="sm">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={pickerSelectedId}
              onChange={(e) => setPickerSelectedId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a client...</option>
              {deployments.map((d) => (
                <option key={d.id} value={d.id}>{d.clientName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button>
            <Button onClick={handlePickerConfirm} disabled={!pickerSelectedId}>Continue</Button>
          </div>
        </div>
      </Modal>

      {/* Request licence modal */}
      {requestModalDeployment && (
        <RequestLicenseModal
          isOpen={!!requestModalDeployment}
          onClose={() => setRequestModalDeployment(null)}
          deploymentId={requestModalDeployment.id}
          clientName={requestModalDeployment.clientName}
          deployment={requestModalDeployment}
          onSuccess={() => setRequestModalDeployment(null)}
        />
      )}
    </div>
  );
};

export { OnpremPage };
