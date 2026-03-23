import { NavLink, Outlet, Navigate, useLocation, useMatch, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';

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
  const detailMatch = useMatch('/onprem/:id');
  const knownSlugs = new Set(['clients', 'licence-requests', 'releases', 'notifications']);
  const isDetailPage = detailMatch && !knownSlugs.has(detailMatch.params.id ?? '');

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
        {canManageOnprem && (
          <Link to="/onprem/register" className="pb-3">
            <Button size="sm" className="shadow-md shadow-primary-500/20">
              <Plus className="h-4 w-4 mr-1.5" />
              Register New Client
            </Button>
          </Link>
        )}
      </div>
      <Outlet />
    </div>
  );
};

export { OnpremPage };
