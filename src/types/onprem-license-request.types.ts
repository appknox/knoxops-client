export type LicenseRequestStatus = 'pending' | 'completed' | 'cancelled';
export type LicenseRequestType = 'license_renewal' | 'patch_update';

export interface OnpremLicenseRequest {
  id: string;
  requestNo: number;
  deploymentId: string;
  requestedBy: string;
  requestType: LicenseRequestType;
  targetVersion?: string | null;
  clientName?: string | null;
  requestedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  status: LicenseRequestStatus;
  licenseStartDate: string;
  licenseEndDate: string;
  numberOfProjects: number;
  notes?: string | null;
  fingerprint?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
  uploadedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  uploadedAt?: string | null;
  cancelledBy?: string | null;
  cancelledByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseRequestInput {
  requestType: LicenseRequestType;
  targetVersion?: string;
  licenseStartDate: string;
  licenseEndDate: string;
  numberOfProjects: number;
  fingerprint: string;
  notes?: string;
}

export interface ListOnpremLicenseRequestsResponse {
  data: OnpremLicenseRequest[];
  pagination: {
    total: number;
  };
}
