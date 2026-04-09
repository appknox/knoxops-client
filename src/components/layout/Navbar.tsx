import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar } from '@/components/ui';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { canViewDevices, canViewOnprem } = usePermissions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    // Only show Devices link for users with device access
    ...(canViewDevices ? [{ path: '/devices', label: 'Devices' }] : []),
    // Only show On-Prem link for users with on-prem access
    ...(canViewOnprem ? [{ path: '/onprem', label: 'On-Prem' }] : []),
    // Only show Settings link for admin users
    ...(user?.role === 'admin' ? [{ path: '/settings', label: 'Settings' }] : []),
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <img
                src="/appknox-logo.png"
                alt="Appknox"
                className="h-8"
              />
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search and User Menu */}
          <div className="flex items-center gap-4">

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export { Navbar };
