import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Loader2, Usb } from 'lucide-react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { useDeviceStore } from '@/stores';
import { devicesApi } from '@/api/devices';
import { PURPOSE_OPTIONS } from '@/constants/deviceOptions';
import { FetchDeviceWizard } from './FetchDeviceWizard';
import type { Device, DeviceType, DeviceStatus } from '@/types';

const updateDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(255),
  serialNumber: z.string().max(100).optional(),
  udid: z.string().optional(),
  modelNumber: z.string().optional(),
  type: z.enum(['server', 'workstation', 'mobile', 'tablet', 'iot', 'network', 'charging_hub', 'other']),
  status: z.enum(['in_inventory', 'checked_out', 'maintenance', 'decommissioned', 'for_sale', 'sold', 'not_verified']),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  macAddress: z.string().max(17).optional(),
  osVersion: z.string().optional(),
  cpuArch: z.string().optional(),
  rom: z.string().optional(),
  platform: z.string().optional(),
  colour: z.string().optional(),
  imei: z.string().optional(),
  imei2: z.string().optional(),
  simNumber: z.string().optional(),
  adapterSerial: z.string().max(100).optional(),
  powerCordSerial: z.string().max(100).optional(),
  purpose: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
});

type UpdateDeviceFormData = z.infer<typeof updateDeviceSchema>;

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  readOnly?: boolean;
}

const typeOptions = [
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
  { value: 'in_inventory', label: 'In Inventory' },
  { value: 'checked_out', label: 'Checked out of inventory' },
  { value: 'maintenance', label: 'Out for repair' },
  { value: 'decommissioned', label: 'Removed from inventory' },
  { value: 'for_sale', label: 'For Sale' },
  { value: 'sold', label: 'Sold' },
  { value: 'not_verified', label: 'Not Verified' },
];

const platformOptions = [
  { value: '', label: 'Select Platform' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'macOS', label: 'macOS' },
  { value: 'Windows', label: 'Windows' },
  { value: 'Linux', label: 'Linux' },
  { value: 'Cambrionix', label: 'Cambrionix' },
  { value: 'Anker', label: 'Anker' },
];

const cpuArchOptions = [
  { value: '', label: 'Select Arch' },
  { value: 'ARM', label: 'ARM (32-bit)' },
  { value: 'ARM64', label: 'ARM64 (64-bit)' },
  { value: 'x86', label: 'x86 (32-bit)' },
  { value: 'x86_64', label: 'x86_64 (64-bit)' },
];

const purposeOptions = [
  { value: '', label: 'Select Purpose' },
  ...PURPOSE_OPTIONS.filter((opt) => opt.value !== '__other__'),
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

// Find matching option value (case-insensitive)
const normalizeValue = (value: string, options: { value: string; label: string }[]): string => {
  if (!value) return '';
  const match = options.find(
    (opt) => opt.value.toLowerCase() === value.toLowerCase() || opt.label.toLowerCase() === value.toLowerCase()
  );
  return match?.value || value;
};

const EditDeviceModal = ({ isOpen, onClose, device, readOnly = false }: EditDeviceModalProps) => {
  const { updateDevice, isLoading } = useDeviceStore();
  const [serialError, setSerialError] = useState<string | null>(null);
  const [serialChecking, setSerialChecking] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UpdateDeviceFormData>({
    resolver: zodResolver(updateDeviceSchema),
    values: device
      ? {
          name: device.name,
          serialNumber: device.serialNumber || '',
          udid: (device.metadata?.udid as string) || '',
          modelNumber: (device.metadata?.modelNumber as string) || '',
          type: device.type,
          status: device.status,
          manufacturer: device.manufacturer || '',
          model: device.model || '',
          // Network fields from metadata
          macAddress: (device.metadata?.macAddress as string) || '',
          // Technical specs from metadata
          osVersion: (device.metadata?.osVersion as string) || '',
          cpuArch: normalizeValue((device.metadata?.cpuArch as string) || '', cpuArchOptions),
          rom: (device.metadata?.rom as string) || '',
          platform: normalizeValue((device.metadata?.platform as string) || '', platformOptions),
          colour: normalizeValue((device.metadata?.colour as string) || '', colourOptions),
          imei: (device.metadata?.imei as string) || '',
          imei2: (device.metadata?.imei2 as string) || '',
          simNumber: (device.metadata?.simNumber as string) || '',
          adapterSerial: (device.metadata?.adapterSerial as string) || '',
          powerCordSerial: (device.metadata?.powerCordSerial as string) || '',
          // Operational fields from direct columns
          purpose: normalizeValue(device.purpose || '', purposeOptions),
          assignedTo: device.assignedTo || '',
          description: device.description || '',
        }
      : undefined,
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
    if (!value || !device) {
      setSerialError(null);
      return;
    }
    setSerialChecking(true);
    try {
      const result = await devicesApi.checkSerial(value, device.id);
      setSerialError(result.exists
        ? `Already registered as ${result.deviceId}${result.deviceName ? ` (${result.deviceName})` : ''}`
        : null
      );
    } finally {
      setSerialChecking(false);
    }
  };

  const onSubmit = async (data: UpdateDeviceFormData) => {
    if (!device) return;

    try {
      // Build metadata object for technical specs + network fields
      const metadata: Record<string, string> = {};
      if (data.osVersion?.trim()) metadata.osVersion = data.osVersion.trim();
      if (data.cpuArch?.trim()) metadata.cpuArch = data.cpuArch.trim();
      if (data.rom?.trim()) metadata.rom = data.rom.trim();
      if (data.platform?.trim()) metadata.platform = data.platform.trim();
      if (data.colour?.trim()) metadata.colour = data.colour.trim();
      if (data.udid?.trim()) metadata.udid = data.udid.trim();
      if (data.modelNumber?.trim()) metadata.modelNumber = data.modelNumber.trim();
      if (data.imei?.trim()) metadata.imei = data.imei.trim();
      if (data.imei2?.trim()) metadata.imei2 = data.imei2.trim();
      if (data.simNumber?.trim()) metadata.simNumber = data.simNumber.trim();
      // Network fields in metadata
      if (data.macAddress?.trim()) metadata.macAddress = data.macAddress.trim();
      // Cambrionix component serials
      if (data.adapterSerial?.trim()) metadata.adapterSerial = data.adapterSerial.trim();
      if (data.powerCordSerial?.trim()) metadata.powerCordSerial = data.powerCordSerial.trim();

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
        description: data.description?.trim() || undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} title={readOnly ? 'Device Details' : 'Edit Device'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Device ID"
              {...register('name')}
              error={errors.name?.message}
              disabled
            />
            <Select label="Type" options={typeOptions} {...register('type')} disabled={readOnly} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Model" {...register('model')} error={errors.model?.message} disabled={readOnly} />
            <Input
              label="Serial Number"
              {...register('serialNumber')}
              onBlur={readOnly ? undefined : handleSerialBlur}
              error={serialError ?? undefined}
              disabled={readOnly}
              rightIcon={serialChecking ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : undefined}
            />
          </div>

          {/* Model Number & UDID — mobile/tablet only; charging_hub gets Model Number only */}
          {(selectedType === 'mobile' || selectedType === 'tablet') && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Model Number" {...register('modelNumber')} placeholder="e.g. NNCK2 / A1779" disabled={readOnly} />
              <Input label="UDID" {...register('udid')} placeholder="Auto-filled from USB" disabled={readOnly} />
            </div>
          )}

          {/* TECHNICAL SPECS */}
          {!isChargingHub && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Technical Specs</h3>
              {showTechSpecs ? (
                <div className="space-y-4">
                  {/* Row 1: Platform | OS Version */}
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Platform" options={platformOptions} {...register('platform')} disabled={readOnly} />
                    <Input label="OS Version" {...register('osVersion')} placeholder="e.g. 17.2 / 13" disabled={readOnly} />
                  </div>
                  {/* Row 2: CPU Arch | ROM */}
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="CPU Arch" options={cpuArchOptions} {...register('cpuArch')} disabled={readOnly} />
                    <Input label="ROM" {...register('rom')} placeholder="Auto-filled from USB" disabled={readOnly} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Platform" options={platformOptions} {...register('platform')} disabled={readOnly} />
                  <Select label="CPU Arch" options={cpuArchOptions} {...register('cpuArch')} disabled={readOnly} />
                </div>
              )}
            </div>
          )}

          {/* Platform (charging_hub) + Colour — or Colour + MAC (mobile/tablet/other) */}
          {isChargingHub ? (
            <div className="grid grid-cols-3 gap-4">
              <Select label="Platform" options={platformOptions} {...register('platform')} disabled={readOnly} />
              <Input label="Model Number" {...register('modelNumber')} placeholder="e.g. CAM-15S" disabled={readOnly} />
              <Select label="Colour" options={colourOptions} {...register('colour')} disabled={readOnly} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Select label="Colour" options={colourOptions} {...register('colour')} disabled={readOnly} />
              {showNetworkSection && (
                <Input label="MAC Address" {...register('macAddress')} placeholder="XX:XX:XX:XX:XX:XX" disabled={readOnly} />
              )}
            </div>
          )}

          {/* CAMBRIONIX COMPONENTS — if platform is Cambrionix */}
          {watch('platform') === 'Cambrionix' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Adapter Serial Number"
                {...register('adapterSerial')}
                placeholder="e.g. CAM-ADAPTER-12345"
                disabled={readOnly}
              />
              <Input
                label="Power Cord Serial Number"
                {...register('powerCordSerial')}
                placeholder="e.g. CAM-POWER-67890"
                disabled={readOnly}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select label="Purpose / Status" options={purposeOptions} {...register('purpose')} disabled={readOnly} />
            <Select label="Inventory Status" options={statusOptions} {...register('status')} disabled={readOnly} />
          </div>

          {/* NETWORK — only for mobile/tablet/workstation */}
          {showNetworkSection && (
            <>

              <div className="grid grid-cols-3 gap-4">
                <Input label="IMEI 1" {...register('imei')} placeholder="IMEI 1" disabled={readOnly} />
                <Input label="IMEI 2" {...register('imei2')} placeholder="IMEI 2 (dual SIM)" disabled={readOnly} />
                <Input label="SIM Number" {...register('simNumber')} placeholder="SIM ICCID" disabled={readOnly} />
              </div>
            </>
          )}

          <div>
            <Input
              label="Assigned To"
              {...register('assignedTo')}
              placeholder="Search user..."
              disabled={readOnly}
            />
          </div>

          <div>
            <Textarea
              label="Additional Details"
              {...register('description')}
              placeholder="Add any additional notes or details about this device..."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          {!readOnly && (selectedType === 'mobile' || selectedType === 'tablet') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2"
            >
              <Usb className="h-4 w-4" />
              Refetch Device Info
            </Button>
          )}
          <div />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" isLoading={isLoading} disabled={!!serialError}>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Fetch Device Wizard */}
      <FetchDeviceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        currentDeviceId={device?.id}
        currentSerialNumber={device?.serialNumber}
        expectedPlatform={(device?.metadata?.platform as string) || undefined}
        onFetched={(info) => {
          if (info.serialNumber) setValue('serialNumber', info.serialNumber);
          if (info.udid) setValue('udid', info.udid);
          if (info.modelNumber) setValue('modelNumber', info.modelNumber);
          if (info.model) setValue('model', info.model);
          if (info.osVersion) setValue('osVersion', info.osVersion);
          if (info.cpuArch) setValue('cpuArch', info.cpuArch);
          if (info.rom) setValue('rom', info.rom);
          if (info.imei) setValue('imei', info.imei);
          if (info.imei2) setValue('imei2', info.imei2);
          if (info.macAddress) setValue('macAddress', info.macAddress);
          if (info.simNumber) setValue('simNumber', info.simNumber);
          if (info.colour) setValue('colour', info.colour);
          if (info.platform) setValue('platform', info.platform);
          setWizardOpen(false);
        }}
      />
    </Modal>
  );
};

export { EditDeviceModal };
