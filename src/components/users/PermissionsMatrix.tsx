import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

type PermissionLevel = 'none' | 'read' | 'read_write';

// Map roles to permission levels
const roleToPermissions = (
  role: Role
): { devices: PermissionLevel; onprem: PermissionLevel } => {
  switch (role) {
    case 'admin':
      return { devices: 'read_write', onprem: 'read_write' };
    case 'devices_admin':
      return { devices: 'read_write', onprem: 'none' };
    case 'devices_viewer':
      return { devices: 'read', onprem: 'none' };
    case 'onprem_admin':
      return { devices: 'none', onprem: 'read_write' };
    case 'onprem_viewer':
      return { devices: 'none', onprem: 'read' };
    case 'full_viewer':
      return { devices: 'read', onprem: 'read' };
    case 'full_editor':
      return { devices: 'read_write', onprem: 'read_write' };
    case 'devices_admin_onprem_viewer':
      return { devices: 'read_write', onprem: 'read' };
    case 'onprem_admin_devices_viewer':
      return { devices: 'read', onprem: 'read_write' };
  }
};

// Derive role from permissions - only maps exact valid combinations
const permissionsToRole = (
  devices: PermissionLevel,
  onprem: PermissionLevel
): Role => {
  // Map only valid role combinations - these have inverses via roleToPermissions
  if (devices === 'read_write' && onprem === 'read_write') return 'full_editor';
  if (devices === 'read_write' && onprem === 'none') return 'devices_admin';
  if (devices === 'read_write' && onprem === 'read') return 'devices_admin_onprem_viewer';
  if (devices === 'read' && onprem === 'none') return 'devices_viewer';
  if (devices === 'read' && onprem === 'read_write') return 'onprem_admin_devices_viewer';
  if (devices === 'none' && onprem === 'read_write') return 'onprem_admin';
  if (devices === 'none' && onprem === 'read') return 'onprem_viewer';
  if (devices === 'read' && onprem === 'read') return 'full_viewer';
  if (devices === 'none' && onprem === 'none') return 'full_viewer';

  return 'full_viewer';
};

const options: { value: PermissionLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'read', label: 'Read' },
  { value: 'read_write', label: 'Read/Write' },
];

interface SegmentedControlProps {
  value: PermissionLevel;
  onChange: (value: PermissionLevel) => void;
  disabled?: boolean;
}

const SegmentedControl = ({ value, onChange, disabled }: SegmentedControlProps) => {
  const handleClick = (optionValue: PermissionLevel) => {
    if (!disabled) {
      onChange(optionValue);
    }
  };

  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleClick(option.value)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            value === option.value
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
            !disabled && 'cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

interface PermissionsMatrixProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  disabled?: boolean;
  isAdmin?: boolean;
}

const PermissionsMatrix = ({
  role,
  onRoleChange,
  disabled,
  isAdmin,
}: PermissionsMatrixProps) => {
  // Track local permissions state independently from role
  const [localPermissions, setLocalPermissions] = useState(() => roleToPermissions(role));
  const isLocked = isAdmin || role === 'admin';

  // Sync local permissions when role changes from outside
  useEffect(() => {
    setLocalPermissions(roleToPermissions(role));
  }, [role]);

  const handleChange = (module: 'devices' | 'onprem', level: PermissionLevel) => {
    // Update local permissions immediately
    const newPermissions = { ...localPermissions, [module]: level };
    setLocalPermissions(newPermissions);

    // If both permissions are 'none', keep them without changing role
    if (newPermissions.devices === 'none' && newPermissions.onprem === 'none') {
      return;
    }

    // Convert to role and notify parent
    const newRole = permissionsToRole(newPermissions.devices, newPermissions.onprem);
    onRoleChange(newRole);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Devices</p>
            <p className="text-sm text-gray-500">Device management access</p>
          </div>
        </div>
        <SegmentedControl
          value={localPermissions.devices}
          onChange={(level) => handleChange('devices', level)}
          disabled={disabled || isLocked}
        />
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">On-Prem Services</p>
            <p className="text-sm text-gray-500">On-premise infrastructure access</p>
          </div>
        </div>
        <SegmentedControl
          value={localPermissions.onprem}
          onChange={(level) => handleChange('onprem', level)}
          disabled={disabled || isLocked}
        />
      </div>

      {isLocked && (
        <p className="text-xs text-gray-500 italic mt-2">
          Admin users have full access to all modules.
        </p>
      )}
    </div>
  );
};

export { PermissionsMatrix };
