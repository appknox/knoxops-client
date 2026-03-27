import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { useDeviceRequestStore } from '@/stores/deviceRequestStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { devicesApi } from '@/api';
import { PURPOSE_OPTIONS, PLATFORM_OPTIONS_BY_TYPE } from '@/constants/deviceOptions';

const requestSchema = z.object({
  deviceType: z.enum(['mobile', 'tablet', 'charging_hub']),
  platform: z.string().min(1, 'Platform is required'),
  osVersion: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  requestingFor: z.string().min(1, 'Requesting for is required'),
  additionalDetails: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface RequestDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDeviceModal({ isOpen, onClose }: RequestDeviceModalProps) {
  const { createRequest } = useDeviceRequestStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [osVersions, setOsVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showManualOsVersion, setShowManualOsVersion] = useState(false);
  const [showManualPurpose, setShowManualPurpose] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestingFor: user ? `${user.firstName} ${user.lastName}` : '',
    },
  });

  const selectedDeviceType = watch('deviceType');
  const selectedPlatform = watch('platform');
  const selectedPurpose = watch('purpose');

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
    setShowManualPurpose(false);
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
        {/* Device Type */}
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

        {/* Platform */}
        {selectedDeviceType && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Platform *</label>
            <select
              {...register('platform')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select platform</option>
              {PLATFORM_OPTIONS_BY_TYPE[selectedDeviceType as keyof typeof PLATFORM_OPTIONS_BY_TYPE]?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.platform && <p className="mt-1 text-sm text-red-600">{errors.platform.message}</p>}
          </div>
        )}

        {/* OS Version */}
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

        {/* Purpose - Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Purpose *</label>
          {!showManualPurpose ? (
            <>
              <select
                {...register('purpose')}
                onChange={(e) => {
                  if (e.target.value === '__other__') {
                    setShowManualPurpose(true);
                    setValue('purpose', '');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select purpose</option>
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div>
              <Textarea
                {...register('purpose')}
                placeholder="Describe the purpose of this device request..."
                rows={4}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowManualPurpose(false);
                  setValue('purpose', '');
                }}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                ← Back to list
              </button>
            </div>
          )}
          {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>}
        </div>

        {/* Requesting For */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Requesting For *</label>
          <Input
            {...register('requestingFor')}
            placeholder="Full name of the person this device is for"
          />
          <p className="mt-1 text-xs text-gray-500">
            Pre-filled with your name. Change if requesting on behalf of someone else.
          </p>
          {errors.requestingFor && <p className="mt-1 text-sm text-red-600">{errors.requestingFor.message}</p>}
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Additional Details</label>
          <Textarea
            {...register('additionalDetails')}
            placeholder="Any specific requirements, preferences, or notes..."
            rows={3}
          />
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
