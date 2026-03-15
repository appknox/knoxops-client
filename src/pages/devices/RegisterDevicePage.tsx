import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, CardBody } from '@/components/ui';
import { useDeviceStore } from '@/stores';
import type { DeviceType, DeviceStatus } from '@/types';

const deviceTypes = ['server', 'workstation', 'mobile', 'iot', 'network', 'other'] as const;
const deviceStatuses = ['active', 'inactive', 'maintenance', 'decommissioned'] as const;

const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device ID is required').max(255),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  type: z.enum(deviceTypes),
  cpuArch: z.string().optional(),
  rom: z.string().optional(),
  platform: z.string().optional(),
  colour: z.string().optional(),
  imei: z.string().optional(),
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
  { value: 'server', label: 'Server' },
  { value: 'workstation', label: 'Workstation' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'iot', label: 'IoT' },
  { value: 'network', label: 'Network' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'active', label: 'Active / In Inventory' },
  { value: 'inactive', label: 'Inactive / Not Verified' },
  { value: 'maintenance', label: 'Out for Repair' },
  { value: 'decommissioned', label: 'To Be Sold' },
];

const platformOptions = [
  { value: '', label: 'Select Platform' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'macOS', label: 'macOS' },
  { value: 'Windows', label: 'Windows' },
  { value: 'Linux', label: 'Linux' },
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
];

const RegisterDevicePage = () => {
  const navigate = useNavigate();
  const { createDevice, isLoading } = useDeviceStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDeviceFormData>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      status: 'active',
      type: 'mobile',
    },
  });

  const onSubmit = async (data: CreateDeviceFormData) => {
    try {
      // Build metadata object for technical specs + network fields
      const metadata: Record<string, string> = {};
      if (data.cpuArch?.trim()) metadata.cpuArch = data.cpuArch.trim();
      if (data.rom?.trim()) metadata.rom = data.rom.trim();
      if (data.platform?.trim()) metadata.platform = data.platform.trim();
      if (data.colour?.trim()) metadata.colour = data.colour.trim();
      if (data.imei?.trim()) metadata.imei = data.imei.trim();
      if (data.simNumber?.trim()) metadata.simNumber = data.simNumber.trim();
      // Network fields in metadata
      if (data.macAddress?.trim()) metadata.macAddress = data.macAddress.trim();

      await createDevice({
        name: data.name.trim(),
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
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Register New Device</h1>
            <p className="text-gray-500 mt-1">
              Add a new hardware asset to the internal directory. Please ensure all mandatory fields
              are filled correctly.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
            {/* IDENTIFICATION */}
            <section>
              <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                Identification
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Device ID"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="e.g. AK-DEV-001"
                />
                <Input
                  label="Model"
                  {...register('model')}
                  placeholder="e.g. iPhone 15 Pro"
                />
                <Input
                  label="Serial Number"
                  {...register('serialNumber')}
                  placeholder="e.g. SN123456789"
                />
                <Select
                  label="Type"
                  options={typeOptions}
                  {...register('type')}
                  error={errors.type?.message}
                />
              </div>
            </section>

            {/* TECHNICAL SPECS */}
            <section>
              <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                Technical Specs
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Select label="CPU-Arch" options={cpuArchOptions} {...register('cpuArch')} />
                <Input label="ROM" {...register('rom')} placeholder="e.g. 128GB" />
                <Select label="Platform" options={platformOptions} {...register('platform')} />
                <Input label="Colour" {...register('colour')} placeholder="e.g. Space Gray" />
              </div>
            </section>

            {/* NETWORK */}
            <section>
              <h2 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-4">
                Network
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <Input label="IMEI" {...register('imei')} placeholder="IMEI number" />
                <Input label="MAC" {...register('macAddress')} placeholder="MAC Address" />
                <Input label="SIM number" {...register('simNumber')} placeholder="SIM ICCID" />
              </div>
            </section>

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
              <Button type="submit" isLoading={isLoading}>
                Register Device
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="text-center text-xs text-gray-400 mt-6">
        SECURE INTERNAL MANAGEMENT SYSTEM
      </p>
    </div>
  );
};

export { RegisterDevicePage };
