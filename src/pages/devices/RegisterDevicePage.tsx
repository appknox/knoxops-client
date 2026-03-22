import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { ChevronRight, Usb, Loader2 } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, CardBody } from '@/components/ui';
import { FetchDeviceWizard } from '@/components/devices';
import { useDeviceStore } from '@/stores';
import { devicesApi } from '@/api/devices';
import type { DeviceType, DeviceStatus } from '@/types';

const deviceTypes = ['server', 'workstation', 'mobile', 'tablet', 'iot', 'network', 'charging_hub', 'other'] as const;
const deviceStatuses = ['active', 'inactive', 'maintenance', 'decommissioned'] as const;

const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device ID is required').max(255).optional(), // Auto-generated
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  udid: z.string().optional(),
  modelNumber: z.string().optional(),
  type: z.enum(deviceTypes),
  osVersion: z.string().optional(),
  cpuArch: z.string().optional(),
  platform: z.string().optional(),
  colour: z.string().optional(),
  imei: z.string().optional(),
  imei2: z.string().optional(),
  macAddress: z.string().max(17).optional(),
  simNumber: z.string().optional(),
  purpose: z.string().optional(),
  status: z.enum(deviceStatuses),
  assignedTo: z.string().optional(),
  comments: z.string().optional(),
});

type CreateDeviceFormData = z.infer<typeof createDeviceSchema>;

const typeOptions = [
  { value: '', label: 'Select Type' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'charging_hub', label: 'Charging Hub' },
  { value: 'server', label: 'Server' },
  { value: 'workstation', label: 'Workstation' },
  { value: 'iot', label: 'IoT' },
  { value: 'network', label: 'Network' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'active', label: 'In Inventory' },
  { value: 'inactive', label: 'Checked out of inventory' },
  { value: 'maintenance', label: 'Out for repair' },
  { value: 'decommissioned', label: 'To be sold' },
];

const platformOptions = [
  { value: '', label: 'Select Platform' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'macOS', label: 'macOS' },
  { value: 'Windows', label: 'Windows' },
  { value: 'Linux', label: 'Linux' },
  { value: 'Cambrionix', label: 'Cambrionix' },
];

const cpuArchOptions = [
  { value: '', label: 'Select Arch' },
  { value: 'ARM64', label: 'ARM64 (Apple Silicon)' },
  { value: 'x86_64', label: 'x86_64 (Intel/AMD)' },
  { value: 'ARM', label: 'ARM (32-bit)' },
];

const purposeOptions = [
  { value: '', label: 'Select Purpose' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Production', label: 'Production' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'onPrem', label: 'On-Prem' },
  { value: 'toBeRepaired', label: 'To Be Repaired' },
];

const colourOptions = [
  { value: '', label: 'Select Colour' },
  { value: 'Black', label: 'Black' },
  { value: 'White', label: 'White' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Space Gray', label: 'Space Gray' },
  { value: 'Space Black', label: 'Space Black' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Rose Gold', label: 'Rose Gold' },
  { value: 'Midnight', label: 'Midnight' },
  { value: 'Starlight', label: 'Starlight' },
  { value: 'Blue', label: 'Blue' },
  { value: 'Green', label: 'Green' },
  { value: 'Yellow', label: 'Yellow' },
  { value: 'Pink', label: 'Pink' },
  { value: 'Purple', label: 'Purple' },
  { value: 'Red', label: 'Red' },
  { value: 'Natural Titanium', label: 'Natural Titanium' },
  { value: 'Black Titanium', label: 'Black Titanium' },
  { value: 'White Titanium', label: 'White Titanium' },
  { value: 'Blue Titanium', label: 'Blue Titanium' },
];

const RegisterDevicePage = () => {
  const navigate = useNavigate();
  const { createDevice, isLoading } = useDeviceStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);
  const [serialChecking, setSerialChecking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateDeviceFormData>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      status: 'active',
      type: 'mobile',
    },
  });

  // Watch type for conditional rendering and platform auto-default
  const selectedType = watch('type');
  const isChargingHub = selectedType === 'charging_hub';
  const showTechSpecs = selectedType === 'mobile' || selectedType === 'workstation' || selectedType === 'tablet';
  const showNetworkSection = showTechSpecs; // Network section is only for mobile/tablet/workstation

  // Auto-default platform to Cambrionix when charging_hub is selected, but allow user to change it
  useEffect(() => {
    if (isChargingHub) {
      setValue('platform', 'Cambrionix');
    }
  }, [isChargingHub, setValue]);

  // Auto-select purpose as "To Be Repaired" when status changes to "Out for repair"
  const selectedStatus = watch('status');
  useEffect(() => {
    if (selectedStatus === 'maintenance') {
      setValue('purpose', 'toBeRepaired');
    }
  }, [selectedStatus, setValue]);

  const handleSerialBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (!value) {
      setSerialError(null);
      return;
    }
    setSerialChecking(true);
    try {
      const result = await devicesApi.checkSerial(value);
      setSerialError(result.exists
        ? `Already registered as ${result.deviceId}${result.deviceName ? ` (${result.deviceName})` : ''}`
        : null
      );
    } finally {
      setSerialChecking(false);
    }
  };

  const onSubmit = async (data: CreateDeviceFormData) => {
    try {
      // Build metadata object for technical specs + network fields
      const metadata: Record<string, string> = {};
      if (data.osVersion?.trim()) metadata.osVersion = data.osVersion.trim();
      if (data.cpuArch?.trim()) metadata.cpuArch = data.cpuArch.trim();
      if (data.platform?.trim()) metadata.platform = data.platform.trim();
      if (data.colour?.trim()) metadata.colour = data.colour.trim();
      if (data.udid?.trim()) metadata.udid = data.udid.trim();
      if (data.modelNumber?.trim()) metadata.modelNumber = data.modelNumber.trim();
      if (data.imei?.trim()) metadata.imei = data.imei.trim();
      if (data.imei2?.trim()) metadata.imei2 = data.imei2.trim();
      if (data.simNumber?.trim()) metadata.simNumber = data.simNumber.trim();
      // Network fields in metadata
      if (data.macAddress?.trim()) metadata.macAddress = data.macAddress.trim();

      await createDevice({
        // name is auto-generated on the backend, don't send it
        serialNumber: data.serialNumber?.trim() || undefined,
        type: data.type as DeviceType,
        status: data.status as DeviceStatus,
        model: data.model?.trim() || undefined,
        // Operational fields as direct columns
        purpose: data.purpose?.trim() || undefined,
        assignedTo: data.assignedTo?.trim() || undefined,
        // Technical specs + network in metadata
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      });
      navigate('/devices');
    } catch {
      // Error handled in store
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/devices" className="hover:text-gray-700">
          Inventory
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">Register Device</span>
      </nav>

      <Card>
        <CardBody>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Register New Device</h1>
              <p className="text-gray-500 mt-1">
                Add a new hardware asset to the internal directory. Please ensure all mandatory fields
                are filled correctly.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Usb className="h-4 w-4" />
              Fetch Device Info
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
            {/* IDENTIFICATION */}
            <section>
              <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                Identification
              </h2>
              <p className="text-xs text-gray-500 mb-4">Device ID is auto-generated based on device type</p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  options={typeOptions}
                  {...register('type')}
                  error={errors.type?.message}
                />
                <Input
                  label="Model"
                  {...register('model')}
                  placeholder="e.g. iPhone 15 Pro"
                />
                <Input
                  label="Serial Number"
                  {...register('serialNumber')}
                  onBlur={handleSerialBlur}
                  error={serialError ?? undefined}
                  placeholder="e.g. SN123456789"
                  rightIcon={serialChecking ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : undefined}
                />
                <Input
                  label="Model Number"
                  {...register('modelNumber')}
                  placeholder="e.g. NNCK2 / A1779"
                />
              </div>
            </section>

            {/* TECHNICAL SPECS — only for mobile/workstation/tablet */}
            {showTechSpecs && (
              <section>
                <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                  Technical Specs
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="CPU-Arch" options={cpuArchOptions} {...register('cpuArch')} />
                  <Select label="Platform" options={platformOptions} {...register('platform')} />
                  <Select label="Colour" options={colourOptions} {...register('colour')} />
                  <Input label="OS Version" {...register('osVersion')} placeholder="e.g. 17.2 / 13" />
                  <Input label="UDID" {...register('udid')} placeholder="Auto-filled from USB" />
                </div>
              </section>
            )}

            {/* Platform & Colour for non-tech-spec types */}
            {!showTechSpecs && (
              <section>
                <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                  Technical Specs
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Platform" options={platformOptions} {...register('platform')} />
                  <Select label="Colour" options={colourOptions} {...register('colour')} />
                </div>
              </section>
            )}

            {/* NETWORK — only for mobile/tablet/workstation */}
            {showNetworkSection && (
              <section>
                <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                  Network
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="IMEI 1" {...register('imei')} placeholder="IMEI 1" />
                  <Input label="IMEI 2" {...register('imei2')} placeholder="IMEI 2 (dual SIM)" />
                  <Input label="MAC" {...register('macAddress')} placeholder="MAC Address" />
                  <Input label="SIM number" {...register('simNumber')} placeholder="SIM ICCID" />
                </div>
              </section>
            )}

            {/* STATUS & PURPOSE */}
            <section>
              <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                Status & Purpose
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Purpose / Status" options={purposeOptions} {...register('purpose')} />
                <Select
                  label="Inventory Status"
                  options={statusOptions}
                  {...register('status')}
                />
              </div>
            </section>

            {/* VERIFICATION & ASSIGNMENT */}
            <section>
              <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                Assignment
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Assigned To"
                  {...register('assignedTo')}
                  placeholder="Search user..."
                />
                <Textarea
                  label="Comments"
                  {...register('comments')}
                  placeholder="Additional details or notes..."
                  rows={3}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => navigate('/devices')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={!!serialError}>
                Register Device
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Fetch Device Wizard */}
      <FetchDeviceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onFetched={(info) => {
          if (info.model) setValue('model', info.model);
          if (info.serialNumber) setValue('serialNumber', info.serialNumber);
          if (info.udid) setValue('udid', info.udid);
          if (info.modelNumber) setValue('modelNumber', info.modelNumber);
          if (info.platform) setValue('platform', info.platform);
          setValue('type', 'mobile');
          if (info.osVersion) setValue('osVersion', info.osVersion);
          if (info.cpuArch) setValue('cpuArch', info.cpuArch);
          if (info.colour) setValue('colour', info.colour);
          if (info.imei) setValue('imei', info.imei);
          if (info.imei2) setValue('imei2', info.imei2);
          if (info.macAddress) setValue('macAddress', info.macAddress);
          if (info.simNumber) setValue('simNumber', info.simNumber);
        }}
      />

      <p className="text-center text-xs text-gray-400 mt-6">
        SECURE INTERNAL MANAGEMENT SYSTEM
      </p>
    </div>
  );
};

export { RegisterDevicePage };
