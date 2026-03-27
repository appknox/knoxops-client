export type DeviceType = 'server' | 'workstation' | 'mobile' | 'tablet' | 'iot' | 'network' | 'charging_hub' | 'other';
export type DeviceStatus = 'in_inventory' | 'checked_out' | 'maintenance' | 'decommissioned' | 'for_sale' | 'sold' | 'not_verified';

export interface DeviceMetadata {
  // Technical specs
  cpuArch?: string;
  rom?: string;
  platform?: string;
  colour?: string;
  osVersion?: string;
  imei?: string;
  imei2?: string;
  simNumber?: string;
  // iOS identifiers
  udid?: string;
  modelNumber?: string;
  // Network specs
  macAddress?: string;
}

// Optimized list item (only fields needed for table display)
export interface DeviceListItem {
  id: string;
  name: string;
  status: DeviceStatus;
  type: DeviceType;
  model: string | null;
  platform: string | null;
  osVersion: string | null;
  purpose: string | null;
  assignedTo: string | null;
}

// Full device details (for edit form and details view)
export interface Device {
  id: string;
  name: string;
  serialNumber: string | null;
  type: DeviceType;
  status: DeviceStatus;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
  description: string | null;
  // Operational fields (direct columns)
  purpose: string | null;
  assignedTo: string | null;
  // Device sale fields
  condition?: string | null;
  conditionNotes?: string | null;
  askingPrice?: number | null;
  // Technical specs in metadata
  metadata: DeviceMetadata | null;
  registeredBy: string | null;
  lastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceInput {
  name: string;
  serialNumber?: string;
  type: DeviceType;
  status?: DeviceStatus;
  manufacturer?: string;
  model?: string;
  location?: string;
  description?: string;
  // Operational fields (direct columns)
  purpose?: string;
  assignedTo?: string;
  // Device sale fields
  condition?: string;
  conditionNotes?: string;
  askingPrice?: number;
  // Technical specs in metadata
  metadata?: DeviceMetadata;
}

export interface UpdateDeviceInput extends Partial<CreateDeviceInput> {}

export interface ListDevicesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: DeviceType;
  status?: DeviceStatus;
  platform?: string;
  osVersion?: string;
  purpose?: string;
  assignedTo?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface DeviceListResponse {
  data: DeviceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeviceStats {
  inInventory: number;
  outForRepair: number;
  toBeSold: number;
  inactive: number;
}

export interface DeviceComment {
  id: string;
  deviceId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  text: string;
  createdAt: string;
}
