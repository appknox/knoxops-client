import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/onprem/clients', label: 'Clients' },
  { path: '/onprem/releases', label: 'Releases' },
  { path: '/onprem/notifications', label: 'Notifications' },
];

const OnpremPage = () => {
  const { pathname } = useLocation();

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
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
};

export { OnpremPage };
