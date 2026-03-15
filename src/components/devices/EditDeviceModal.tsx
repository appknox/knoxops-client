import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useDeviceStore } from '@/stores';
import type { Device, DeviceType, DeviceStatus } from '@/types';

const updateDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(255),
  serialNumber: z.string().max(100).optional(),
  type: z.enum(['server', 'workstation', 'mobile', 'iot', 'network', 'other']),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  macAddress: z.string().max(17).optional(),
  ipAddress: z.string().max(45).optional(),
  cpuArch: z.string().optional(),
  rom: z.string().optional(),
  platform: z.string().optional(),
  colour: z.string().optional(),
  imei: z.string().optional(),
  simNumber: z.string().optional(),
  purpose: z.string().optional(),
  assignedTo: z.string().optional(),
});

type UpdateDeviceFormData = z.infer<typeof updateDeviceSchema>;

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

const typeOptions = [
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

// Find matching option value (case-insensitive)
const normalizeValue = (value: string, options: { value: string; label: string }[]): string => {
  if (!value) return '';
  const match = options.find(
    (opt) => opt.value.toLowerCase() === value.toLowerCase() || opt.label.toLowerCase() === value.toLowerCase()
  );
  return match?.value || value;
};

const EditDeviceModal = ({ isOpen, onClose, device }: EditDeviceModalProps) => {
  const { updateDevice, isLoading } = useDeviceStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateDeviceFormData>({
    resolver: zodResolver(updateDeviceSchema),
    values: device
      ? {
          name: device.name,
          serialNumber: device.serialNumber || '',
          type: device.type,
          status: device.status,
          manufacturer: device.manufacturer || '',
          model: device.model || '',
          // Network fields from metadata
          macAddress: (device.metadata?.macAddress as string) || '',
          ipAddress: (device.metadata?.ipAddress as string) || '',
          // Technical specs from metadata
          cpuArch: normalizeValue((device.metadata?.cpuArch as string) || '', cpuArchOptions),
          rom: (device.metadata?.rom as string) || '',
          platform: normalizeValue((device.metadata?.platform as string) || '', platformOptions),
          colour: (device.metadata?.colour as string) || '',
          imei: (device.metadata?.imei as string) || '',
          simNumber: (device.metadata?.simNumber as string) || '',
          // Operational fields from direct columns
          purpose: normalizeValue(device.purpose || '', purposeOptions),
          assignedTo: device.assignedTo || '',
        }
      : undefined,
  });

  const onSubmit = async (data: UpdateDeviceFormData) => {
    if (!device) return;

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
      if (data.ipAddress?.trim()) metadata.ipAddress = data.ipAddress.trim();
      if (data.macAddress?.trim()) metadata.macAddress = data.macAddress.trim();

      await updateDevice(device.id, {
        name: data.name.trim(),
        serialNumber: data.serialNumber?.trim() || undefined,
        type: data.type as DeviceType,
        status: data.status as DeviceStatus,
        manufacturer: data.manufacturer?.trim() || undefined,
        model: data.model?.trim() || undefined,
        // Operational fields as direct columns
        purpose: data.purpose?.trim() || undefined,
        assignedTo: data.assignedTo?.trim() || undefined,
        // Technical specs + network in metadata
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      });
      reset();
      onClose();
    } catch {
      // Error handled in store
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Device" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Device ID"
              {...register('name')}
              error={errors.name?.message}
              disabled
            />
            <Select
              label="CPU-Arch"
              options={cpuArchOptions}
              {...register('cpuArch')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Model" {...register('model')} error={errors.model?.message} />
            <Input label="Serial Number" {...register('serialNumber')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={typeOptions} {...register('type')} />
            <Select label="Purpose / Status" options={purposeOptions} {...register('purpose')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Inventory Status" options={statusOptions} {...register('status')} />
            <Select label="Platform" options={platformOptions} {...register('platform')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Colour" {...register('colour')} placeholder="e.g. Space Gray" />
            <Input label="ROM / Storage" {...register('rom')} placeholder="e.g. 512GB" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="MAC Address" {...register('macAddress')} placeholder="XX:XX:XX:XX:XX:XX" />
            <Input label="IP Address" {...register('ipAddress')} placeholder="192.168.1.1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="IMEI" {...register('imei')} placeholder="IMEI number" />
            <Input label="SIM Number" {...register('simNumber')} placeholder="SIM ICCID" />
          </div>

          <div>
            <Input
              label="Assigned To"
              {...register('assignedTo')}
              placeholder="Search user..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { EditDeviceModal };
