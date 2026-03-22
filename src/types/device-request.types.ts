export type DeviceRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface DeviceRequest {
  id: string;
  requestedBy: string;
  requestedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  deviceType: string;
  platform: string;
  osVersion?: string | null;
  purpose: string;
  status: DeviceRequestStatus;
  rejectionReason?: string | null;
  linkedDeviceId?: string | null;
  approvedBy?: string | null;
  approvedByUser?: any | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedByUser?: any | null;
  rejectedAt?: string | null;
  completedBy?: string | null;
  completedByUser?: any | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceRequestInput {
  deviceType: string;
  platform: string;
  osVersion?: string;
  purpose: string;
}

export interface ListDeviceRequestsResponse {
  data: DeviceRequest[];
  pagination: {
    total: number;
  };
}
