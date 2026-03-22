import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Select, Input, Textarea } from '@/components/ui';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';
import { devicesApi } from '@/api';

const platformOptions: Record<string, Array<{ value: string; label: string }>> = {
  mobile: [
    { value: 'iOS', label: 'iOS' },
    { value: 'Android', label: 'Android' },
  ],
  tablet: [
    { value: 'iOS', label: 'iOS' },
    { value: 'Android', label: 'Android' },
  ],
  charging_hub: [{ value: 'Cambrionix', label: 'Cambrionix' }],
};

const requestSchema = z.object({
  deviceType: z.enum(['mobile', 'tablet', 'charging_hub']),
  platform: z.string().min(1, 'Platform is required'),
  osVersion: z.string().optional(),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDeviceModal({ isOpen, onClose }: RequestDeviceModalProps) {
  const { createRequest } = useDeviceRequestStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [osVersions, setOsVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showManualOsVersion, setShowManualOsVersion] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const selectedDeviceType = watch('deviceType');
  const selectedPlatform = watch('platform');

  // Fetch OS versions when platform changes
  useEffect(() => {
    if (!selectedPlatform || selectedDeviceType === 'charging_hub') {
      setOsVersions([]);
      setShowManualOsVersion(false);
      setValue('osVersion', '');
      return;
    }

    const fetchVersions = async () => {
      try {
        setLoadingVersions(true);
        if (selectedPlatform === 'iOS' || selectedPlatform === 'Android') {
          const versions = await devicesApi.getDistinctOsVersions(selectedPlatform);
          setOsVersions(versions);
          setShowManualOsVersion(false);
          setValue('osVersion', '');
        }
      } catch (error) {
        console.error('Failed to fetch OS versions:', error);
        setOsVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [selectedPlatform, selectedDeviceType, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      await createRequest(data);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request a Device" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Device Type *</label>
          <select
            {...register('deviceType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select device type</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
            <option value="charging_hub">Charging Hub</option>
          </select>
          {errors.deviceType && <p className="mt-1 text-sm text-red-600">{errors.deviceType.message}</p>}
        </div>

        {selectedDeviceType && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Platform *</label>
            <select
              {...register('platform')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select platform</option>
              {platformOptions[selectedDeviceType]?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.platform && <p className="mt-1 text-sm text-red-600">{errors.platform.message}</p>}
          </div>
        )}

        {selectedDeviceType && selectedDeviceType !== 'charging_hub' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">OS Version</label>
            {loadingVersions ? (
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading versions...
              </div>
            ) : osVersions.length > 0 ? (
              <>
                <select
                  {...register('osVersion')}
                  onChange={(e) => {
                    if (e.target.value === '__other__') {
                      setShowManualOsVersion(true);
                      setValue('osVersion', '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select from existing versions</option>
                  {osVersions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                  <option value="__other__">Other (enter manually)</option>
                </select>
                {showManualOsVersion && (
                  <div className="mt-3">
                    <Input
                      {...register('osVersion')}
                      placeholder="Enter custom OS version (e.g., iOS 17.2 or Android 13)"
                      autoFocus
                    />
                  </div>
                )}
              </>
            ) : (
              <Input
                {...register('osVersion')}
                placeholder="e.g., iOS 17.2 or Android 13"
              />
            )}
            {errors.osVersion && <p className="mt-1 text-sm text-red-600">{errors.osVersion.message}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Purpose *</label>
          <Textarea
            {...register('purpose')}
            placeholder="Describe the purpose of this device request..."
            rows={4}
          />
          {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
