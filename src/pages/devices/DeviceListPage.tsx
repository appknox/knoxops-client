import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { RequestDeviceModal } from '@/components/devices';
import { usePermissions } from '@/hooks/usePermissions';

const DeviceListPage = () => {
  const { canManageDevices } = usePermissions();
  const [showRequestModal, setShowRequestModal] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage hardware assets across all organizational units.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowRequestModal(true)}
            className="shadow-md shadow-primary-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request a Device
          </Button>
          {canManageDevices && (
            <Link to="/devices/register">
              <Button className="shadow-md shadow-primary-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Register New Device
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <NavLink
            to="/devices/inventory"
            className={({ isActive }) =>
              `py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`
            }
          >
            Inventory
          </NavLink>
          <NavLink
            to="/devices/requests"
            className={({ isActive }) =>
              `py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`
            }
          >
            {canManageDevices ? 'Requests' : 'My Requests'}
          </NavLink>
        </div>
      </div>

      {/* Tab Content via Outlet */}
      <Outlet />

      {/* Request Device Modal */}
      <RequestDeviceModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </div>
  );
};

export { DeviceListPage };
