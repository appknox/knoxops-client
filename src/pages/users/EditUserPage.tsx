import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, Mail, Calendar, Shield } from 'lucide-react';
import { Button, Input, Select, Avatar } from '@/components/ui';
import { PermissionsMatrix, UserRoleBadge, UserStatusBadge } from '@/components/users';
import { useUserStore, useAuthStore } from '@/stores';
import { formatDateTime } from '@/utils/formatters';
import type { Role } from '@/types';

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// Simplified role options - Admin or Member
// Module-level permissions are configured via the PermissionsMatrix
const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'full_viewer', label: 'Member' },
];

const EditUserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { selectedUser, fetchUserById, updateUser, isLoading, error } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<Role>('full_viewer');
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (id) {
      fetchUserById(id);
    }
  }, [id, fetchUserById]);

  useEffect(() => {
    if (selectedUser) {
      reset({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
      });
      setSelectedRole(selectedUser.role);
    }
  }, [selectedUser, reset]);

  useEffect(() => {
    setHasChanges(isDirty || selectedRole !== selectedUser?.role);
  }, [isDirty, selectedRole, selectedUser?.role]);

  const isSelfEdit = currentUser?.id === id;

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!id) return;

    try {
      await updateUser(id, {
        ...data,
        role: selectedRole,
      });
      navigate('/users');
    } catch {
      // Error handled in store
    }
  };

  const handleDiscard = () => {
    if (selectedUser) {
      reset({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
      });
      setSelectedRole(selectedUser.role);
    }
  };

  if (isLoading && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link to="/users" className="text-primary-600 hover:underline mt-2 block">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit User Permissions</h1>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-6">
          <Avatar
            name={`${selectedUser.firstName} ${selectedUser.lastName}`}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {selectedUser.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member since {formatDateTime(selectedUser.createdAt).split(' ')[0]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <UserRoleBadge role={selectedUser.role} />
              <UserStatusBadge isActive={selectedUser.isActive} />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Role</h3>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Global Access
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Select
                label="System-wide Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                options={roleOptions}
                disabled={isSelfEdit}
              />
              {isSelfEdit && (
                <p className="text-xs text-amber-600 mt-2">
                  You cannot change your own role.
                </p>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Role Description
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedRole === 'admin'
                      ? 'Full access to all system features including user management.'
                      : 'Access based on module permissions configured below.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Permissions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Permissions</h3>
          <PermissionsMatrix
            role={selectedRole}
            onRoleChange={setSelectedRole}
            disabled={isSelfEdit}
            isAdmin={selectedRole === 'admin'}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {hasChanges
              ? 'Unsaved changes will be lost if you leave this page.'
              : 'No changes made.'}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={!hasChanges || isLoading}
            >
              Discard
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={!hasChanges || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Update Permissions'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { EditUserPage };
