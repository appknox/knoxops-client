import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UserPlus, Mail, User } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { PermissionsMatrix } from '@/components/users';
import { useUserStore } from '@/stores';
import type { Role } from '@/types';

const inviteUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

// Simplified role options - Admin or Member
// Module-level permissions are configured via the PermissionsMatrix
const roleOptions = [
  { value: 'admin', label: 'Admin - Full system access including user management' },
  { value: 'full_viewer', label: 'Member - Customize permissions below' },
];

const AddUserPage = () => {
  const navigate = useNavigate();
  const { createInvite, isLoading, error } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<Role>('full_viewer');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
  });

  const onSubmit = async (data: InviteUserFormData) => {
    try {
      await createInvite({
        ...data,
        role: selectedRole,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/settings/users');
      }, 2000);
    } catch {
      // Error handled in store
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Sent!</h2>
          <p className="text-gray-500">
            An invitation email has been sent to the user. They will be able to set their
            password and access the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/settings/users"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
        <p className="text-gray-500 mt-1">
          Invite a new team member to the platform.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
              placeholder="John"
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
              placeholder="Doe"
            />
          </div>

          <div className="mt-4">
            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="john@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Role & Permissions</h2>

          <div className="mb-6">
            <Select
              label="Select Role"
              value={selectedRole === 'admin' ? 'admin' : 'full_viewer'}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              options={roleOptions}
            />
            <p className="text-xs text-gray-500 mt-2">
              The role determines the user's default permissions across the platform.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Module Permissions</h3>
            <PermissionsMatrix
              role={selectedRole}
              onRoleChange={setSelectedRole}
              isAdmin={selectedRole === 'admin'}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/settings/users">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            <UserPlus className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending Invite...' : 'Send Invitation'}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        An invitation link will be sent to the user's email address.
      </p>
    </div>
  );
};

export { AddUserPage };
