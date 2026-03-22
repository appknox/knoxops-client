import { NavLink, Outlet, Navigate, useLocation, useMatch } from 'react-router-dom';

const tabs = [
  { path: '/onprem/clients', label: 'Clients' },
  { path: '/onprem/licence-requests', label: 'Licence Requests' },
  { path: '/onprem/releases', label: 'Releases' },
  { path: '/onprem/notifications', label: 'Notifications' },
];

const activeClass = 'border-primary-600 text-primary-600';
const inactiveClass = 'border-transparent text-gray-500 hover:text-gray-700';

const OnpremPage = () => {
  const { pathname } = useLocation();
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
      <div className="border-b border-gray-200 mb-6">
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
      </div>
      <Outlet />
    </div>
  );
};

export { OnpremPage };
