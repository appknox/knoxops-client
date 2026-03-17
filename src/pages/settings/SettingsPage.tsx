import { NavLink, Outlet, Navigate } from 'react-router-dom';

const tabs = [
  { path: '/settings/users', label: 'Users' },
  { path: '/settings/invites', label: 'Pending Invites' },
];

const SettingsPage = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
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

export { SettingsPage };
