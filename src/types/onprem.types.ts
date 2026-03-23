// Enums
export type DeploymentStatus = 'healthy' | 'degraded' | 'offline' | 'maintenance' | 'provisioning' | 'decommissioned';
export type ClientStatus = 'active' | 'inactive';
export type EnvironmentType = 'poc' | 'production';
export type MaintenancePlan = 'quarterly' | 'annually';
export type HypervisorType = 'vmware' | 'proxmox';
export type DeploymentSize = 'small' | 'medium' | 'large' | 'enterprise';
export type LanSpeed = '100mbps' | '1gbps' | '10gbps';
export type WifiStandard = 'wifi5' | 'wifi6' | 'wifi6e';
export type ConnectionType = 'usb' | 'network' | 'wifi' | 'ethernet';
export type VersionActionType = 'deployment' | 'patch' | 'upgrade';
export type PricingPlan = 'per app' | 'per scan';

// JSONB field interfaces - Consolidated infrastructure metadata
export interface InfrastructureConfig {
  hypervisor?: {
    type?: string;
    version?: string;
    customType?: string; // For "other" hypervisor option
  };
  network?: {
    staticIP?: string;
    gateway?: string;
    netmask?: string;
    dnsServers?: string[];
    ntpServer?: string;
    smtpServer?: string;
    lanSpeed?: string;
    wifiStandard?: string;
  };
  server?: {
    cpuCores?: number;
    ramGB?: number;
    storageGB?: number;
    size?: string;
  };
  fingerprint?: string;
}

// License information interface
export interface LicenseConfig {
  userFullName?: string;
  email?: string;
  username?: string;
  startDate?: string;
  endDate?: string;
  pricingPlan?: PricingPlan;
  numberOfApps?: number;
}

// Main deployment interface
export interface OnpremDeployment {
  id: string;
  // Section 1: Client & Ownership
  clientName: string;
  clientStatus: ClientStatus;
  environmentType: EnvironmentType;
  associatedCsmId: string | null;
  associatedCsm?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  contactEmail: string | null;
  contactPhone: string | null;
  // Section 2: Deployment & Versioning
  firstDeploymentDate: string | null;
  currentVersion: string | null;
  lastPatchDate: string | null;
  maintenancePlan: MaintenancePlan | null;
  nextScheduledPatchDate: string | null;
  // Section 3: Prerequisites
  prerequisiteFileUrl: string | null;
  prerequisiteFileName: string | null;
  domainName: string | null;
  sslCertificateFileUrl: string | null;
  // Section 4: Infrastructure & Technical Details (consolidated)
  infrastructure: InfrastructureConfig | null;
  // Section 5: License Information
  license: LicenseConfig | null;
  // Legacy fields
  name: string | null;
  customerId: string | null;
  customerName: string | null;
  status: DeploymentStatus;
  version: string | null;
  hostname: string | null;
  region: string | null;
  environment: string | null;
  nodeCount: number | null;
  lastHealthCheck: string | null;
  healthCheckDetails: Record<string, unknown> | null;
  configuration: Record<string, unknown> | null;
  notes: string | null;
  // Audit
  registeredBy: string | null;
  lastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Documents
  documents?: OnpremDocument[];
}

// List item (optimized for table display)
export interface OnpremDeploymentListItem {
  id: string;
  clientName: string;
  clientStatus: ClientStatus;
  environmentType: EnvironmentType;
  currentVersion: string | null;
  lastPatchDate: string | null;
  status: DeploymentStatus;
  createdAt: string;
}

// Create input
export interface CreateOnpremInput {
  // Section 1: Client & Ownership
  clientName: string;
  clientStatus?: ClientStatus;
  environmentType?: EnvironmentType;
  associatedCsmId?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Section 2: Deployment & Versioning
  firstDeploymentDate?: string;
  currentVersion?: string;
  maintenancePlan?: MaintenancePlan;
  nextScheduledPatchDate?: string;
  // Section 3: Prerequisites
  domainName?: string;
  sslCertificateFileUrl?: string;
  // Section 4: Infrastructure & Technical Details (consolidated)
  infrastructure?: InfrastructureConfig;
  // Section 5: License Information
  license?: LicenseConfig;
  // Legacy
  name?: string;
  customerId?: string;
  customerName?: string;
  status?: DeploymentStatus;
  version?: string;
  hostname?: string;
  region?: string;
  environment?: string;
  nodeCount?: number;
  configuration?: Record<string, unknown>;
  notes?: string;
}

// Update input
export interface UpdateOnpremInput extends Partial<CreateOnpremInput> {}

// List params
export interface ListOnpremParams {
  page?: number;
  limit?: number;
  search?: string;
  clientStatus?: ClientStatus;
  status?: DeploymentStatus;
  environmentType?: EnvironmentType;
  maintenancePlan?: MaintenancePlan;
  currentVersion?: string;
  currentVersions?: string[];
  csmIds?: string[];
  environment?: string;
  region?: string;
  sortBy?: 'clientName' | 'name' | 'createdAt' | 'updatedAt' | 'lastPatchDate' | 'firstDeploymentDate' | 'clientStatus' | 'status' | 'customerName';
  sortOrder?: 'asc' | 'desc';
}

// List response
export interface OnpremListResponse {
  data: OnpremDeployment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Device association
export interface OnpremDeviceAssociation {
  id: string;
  deploymentId: string;
  deviceId: string;
  deviceIP: string | null;
  connectionType: ConnectionType | null;
  connectionStatus: string | null;
  lastSeen: string | null;
  associatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  device?: {
    id: string;
    name: string;
    serialNumber: string | null;
    type: string;
    status: string;
    manufacturer: string | null;
    model: string | null;
    metadata: Record<string, unknown> | null;
  };
}

export interface AddDeviceInput {
  deviceId: string;
  deviceIP?: string;
  connectionType?: ConnectionType;
}

export interface UpdateDeviceAssociationInput {
  deviceIP?: string;
  connectionType?: ConnectionType;
  connectionStatus?: string;
}

export interface OnpremDevicesListResponse {
  data: OnpremDeviceAssociation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Version history
export interface OnpremVersionHistory {
  id: string;
  deploymentId: string;
  version: string;
  actionType: VersionActionType;
  patchNotes: string | null;
  appliedBy: string | null;
  appliedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  appliedAt: string;
  createdAt: string;
}

export interface AddVersionInput {
  version: string;
  actionType: VersionActionType;
  patchNotes?: string;
  appliedAt?: string;
}

export interface VersionHistoryListResponse {
  data: OnpremVersionHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Status history
export interface OnpremStatusHistory {
  id: string;
  deploymentId: string;
  previousStatus: DeploymentStatus | null;
  newStatus: DeploymentStatus;
  changedBy: string | null;
  changedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  reason: string | null;
  createdAt: string;
}

// Comments
export interface OnpremComment {
  id: string;
  deploymentId: string;
  comment: string;
  createdBy: string | null;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  updatedBy: string | null;
  updatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateCommentInput {
  comment: string;
}

export interface UpdateCommentInput {
  comment: string;
}

export interface CommentListResponse {
  data: OnpremComment[];
}

// Combined history (audit logs + comments + status changes)
export type CombinedHistoryEntryType = 'comment' | 'audit' | 'status_change';

export interface CombinedHistoryEntry {
  id: string;
  type: CombinedHistoryEntryType;
  timestamp: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  data: any;
}

export interface CombinedHistoryResponse {
  data: CombinedHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Document types
export type DocumentCategory = 'rfp' | 'other';

export interface OnpremDocument {
  id: string;
  deploymentId: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}
