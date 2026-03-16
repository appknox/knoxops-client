import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button, Input, Select, Textarea, Card, CardHeader, CardBody, UserSearchCombobox } from '@/components/ui';
import { useOnpremStore } from '@/stores';
import { onpremApi } from '@/api';
import type {
  CreateOnpremInput,
  OnpremDeployment,
  ClientStatus,
  EnvironmentType,
  MaintenancePlan,
  HypervisorType,
  LanSpeed,
  WifiStandard,
} from '@/types';

// Options for select fields
const clientStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const environmentOptions = [
  { value: 'poc', label: 'POC' },
  { value: 'production', label: 'Production' },
];

const maintenanceOptions = [
  { value: '', label: 'Select Maintenance Plan' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const hypervisorOptions = [
  { value: '', label: 'Select Hypervisor' },
  { value: 'vmware', label: 'VMware ESXi' },
  { value: 'proxmox', label: 'Proxmox VE' },
  { value: 'hyperv', label: 'Microsoft Hyper-V' },
  { value: 'virtualbox', label: 'Oracle VirtualBox' },
  { value: 'kvm', label: 'KVM' },
  { value: 'xen', label: 'Xen' },
  { value: 'other', label: 'Other (Custom)' },
];

// Version options for each hypervisor type
const hypervisorVersions: Record<string, { value: string; label: string }[]> = {
  vmware: [
    { value: '', label: 'Select Version' },
    { value: '6.7', label: 'ESXi 6.7' },
    { value: '7.0', label: 'ESXi 7.0' },
    { value: '7.0 U1', label: 'ESXi 7.0 Update 1' },
    { value: '7.0 U2', label: 'ESXi 7.0 Update 2' },
    { value: '7.0 U3', label: 'ESXi 7.0 Update 3' },
    { value: '8.0', label: 'ESXi 8.0' },
  ],
  proxmox: [
    { value: '', label: 'Select Version' },
    { value: '7.0', label: 'Proxmox VE 7.0' },
    { value: '7.1', label: 'Proxmox VE 7.1' },
    { value: '7.2', label: 'Proxmox VE 7.2' },
    { value: '7.3', label: 'Proxmox VE 7.3' },
    { value: '7.4', label: 'Proxmox VE 7.4' },
    { value: '8.0', label: 'Proxmox VE 8.0' },
    { value: '8.1', label: 'Proxmox VE 8.1' },
    { value: '8.2', label: 'Proxmox VE 8.2' },
  ],
  hyperv: [
    { value: '', label: 'Select Version' },
    { value: '2016', label: 'Hyper-V Server 2016' },
    { value: '2019', label: 'Hyper-V Server 2019' },
    { value: '2022', label: 'Hyper-V Server 2022' },
    { value: '2025', label: 'Hyper-V Server 2025' },
  ],
  virtualbox: [
    { value: '', label: 'Select Version' },
    { value: '6.0', label: 'VirtualBox 6.0' },
    { value: '6.1', label: 'VirtualBox 6.1' },
    { value: '7.0', label: 'VirtualBox 7.0' },
    { value: '7.1', label: 'VirtualBox 7.1' },
  ],
};


const ramOptions = [
  { value: '', label: 'Select RAM' },
  { value: '8', label: '8 GB RAM' },
  { value: '16', label: '16 GB RAM' },
  { value: '32', label: '32 GB RAM' },
  { value: '64', label: '64 GB RAM' },
  { value: '128', label: '128 GB RAM' },
  { value: '256', label: '256 GB RAM' },
  { value: 'custom', label: 'Custom' },
];

const storageOptions = [
  { value: '', label: 'Select Storage' },
  { value: '200', label: '200 GB SSD' },
  { value: '300', label: '300 GB SSD' },
  { value: '500', label: '500 GB SSD' },
  { value: '1000', label: '1 TB SSD' },
  { value: '2000', label: '2 TB SSD' },
  { value: 'custom', label: 'Custom' },
];

const cpuCoresOptions = [
  { value: '', label: 'Select CPU Cores' },
  { value: '8', label: '8 Cores' },
  { value: '16', label: '16 Cores' },
  { value: '32', label: '32 Cores' },
  { value: 'custom', label: 'Custom' },
];

const lanSpeedOptions = [
  { value: '', label: 'Select LAN Speed' },
  { value: '100mbps', label: '100 Mbps' },
  { value: '1gbps', label: '1 Gbps' },
  { value: '10gbps', label: '10 Gbps' },
];

const wifiOptions = [
  { value: '', label: 'Select WiFi Standard' },
  { value: 'wifi5', label: 'WiFi 5 (802.11ac)' },
  { value: 'wifi6', label: 'WiFi 6 (802.11ax)' },
  { value: 'wifi6e', label: 'WiFi 6E' },
];

const pricingPlanOptions = [
  { value: '', label: 'Select Pricing Plan' },
  { value: 'per app', label: 'Per App' },
  { value: 'per scan', label: 'Per Scan' },
];

// Note: These options are now part of infrastructure metadata

interface FormData {
  // Section 1: Client & Ownership
  clientName: string;
  clientStatus: ClientStatus;
  environmentType: EnvironmentType;
  associatedCsmId: string;
  contactEmail: string;
  contactPhone: string;
  // Section 2: Deployment & Versioning
  firstDeploymentDate: string;
  currentVersion: string;
  maintenancePlan: MaintenancePlan | '';
  nextScheduledPatchDate: string;
  // Section 3: Prerequisites
  domainName: string;
  // Section 4: Infrastructure (consolidated - includes hypervisor, network, server)
  hypervisorType: string;
  hypervisorVersion: string;
  hypervisorCustomType: string; // For "other" option
  staticIP: string;
  gateway: string;
  netmask: string;
  dnsServers: string;
  ntpServer: string;
  smtpServer: string;
  lanSpeed: string;
  wifiStandard: string;
  cpuCores: string;
  ramGB: string;
  storageGB: string;
  fingerprint: string;
  // Section 5: License
  licenseUserFullName: string;
  licenseEmail: string;
  licenseUsername: string;
  licenseStartDate: string;
  licenseEndDate: string;
  licensePricingPlan: 'per app' | 'per scan' | '';
  licenseNumberOfApps: string;
  useSameEmailForLicense: boolean;
  // Notes
  notes: string;
}

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const isValidDomainOrIP = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is valid (optional field)

  // Remove protocol if present (http:// or https://)
  let normalizedValue = value.trim().replace(/^https?:\/\//i, '');

  // Remove trailing slash
  normalizedValue = normalizedValue.replace(/\/$/, '');

  // Check if it's a valid domain or IP
  return DOMAIN_REGEX.test(normalizedValue) || IP_REGEX.test(normalizedValue);
};

const isValidIP = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is valid (optional field)
  return IP_REGEX.test(value.trim());
};

const isValidDnsServers = (value: string): boolean => {
  if (!value.trim()) return true; // Empty is valid (optional field)
  return value.split(',').every((ip) => IP_REGEX.test(ip.trim()));
};

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const validateForm = (data: FormData): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.clientName.trim()) {
    errors.clientName = 'Client Name is required';
  }

  if (!data.contactEmail.trim()) {
    errors.contactEmail = 'Contact Email is required';
  } else if (!EMAIL_REGEX.test(data.contactEmail)) {
    errors.contactEmail = 'Invalid email format';
  }

  if (!data.contactPhone.trim()) {
    errors.contactPhone = 'Contact Phone is required';
  }

  if (!data.associatedCsmId.trim()) {
    errors.associatedCsmId = 'Associated CSM is required';
  }

  if (data.domainName && !isValidDomainOrIP(data.domainName)) {
    errors.domainName = 'Please enter a valid domain name or IP address';
  }

  // Date validation - Next Scheduled Patch Date must be after First Deployment Date
  if (data.firstDeploymentDate && data.nextScheduledPatchDate) {
    if (new Date(data.nextScheduledPatchDate) <= new Date(data.firstDeploymentDate)) {
      errors.nextScheduledPatchDate = 'Next Scheduled Patch Date must be after First Deployment Date';
    }
  }

  // License validation - dates are mandatory if any license field is filled
  const hasLicenseData = data.licenseUserFullName || data.licenseEmail || data.licenseUsername ||
                          data.licenseStartDate || data.licenseEndDate || data.licensePricingPlan ||
                          data.licenseNumberOfApps;

  if (hasLicenseData) {
    if (!data.licenseStartDate) {
      errors.licenseStartDate = 'License start date is required';
    }
    if (!data.licenseEndDate) {
      errors.licenseEndDate = 'License end date is required';
    }
    if (data.licenseStartDate && data.licenseEndDate) {
      if (new Date(data.licenseEndDate) <= new Date(data.licenseStartDate)) {
        errors.licenseEndDate = 'License end date must be after start date';
      }
    }
  }

  if (data.licenseEmail && !EMAIL_REGEX.test(data.licenseEmail)) {
    errors.licenseEmail = 'Invalid email format';
  }

  if (data.licenseNumberOfApps && isNaN(parseInt(data.licenseNumberOfApps))) {
    errors.licenseNumberOfApps = 'Must be a valid number';
  }

  // Network Configuration validations
  if (data.staticIP && !isValidIP(data.staticIP)) {
    errors.staticIP = 'Please enter a valid IPv4 address (e.g. 192.168.1.100)';
  }
  if (data.gateway && !isValidIP(data.gateway)) {
    errors.gateway = 'Please enter a valid IPv4 address (e.g. 192.168.1.1)';
  }
  if (data.netmask && !isValidIP(data.netmask)) {
    errors.netmask = 'Please enter a valid IPv4 address (e.g. 255.255.255.0)';
  }
  if (data.dnsServers && !isValidDnsServers(data.dnsServers)) {
    errors.dnsServers = 'Each DNS server must be a valid IPv4 address';
  }
  if (data.ntpServer && !isValidDomainOrIP(data.ntpServer)) {
    errors.ntpServer = 'Please enter a valid IP address or hostname (e.g. pool.ntp.org)';
  }
  if (data.smtpServer && !isValidDomainOrIP(data.smtpServer)) {
    errors.smtpServer = 'Please enter a valid IP address or hostname (e.g. smtp.example.com)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  errors?: Array<{ path: string; message: string }>;
}

const parseApiError = (error: unknown): { formError: string; fieldErrors: Record<string, string> } => {
  const fieldErrors: Record<string, string> = {};
  let formError = 'Failed to save deployment. Please try again.';

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: ApiErrorResponse; status?: number } };
    const data = axiosError.response?.data;

    if (data?.message) {
      formError = data.message;

      // Parse contact email validation errors
      if (data.message.includes('Contact email') && data.message.includes('already used')) {
        fieldErrors.contactEmail = data.message;
        formError = 'Please fix the validation errors below.';
      }
      // Parse contact phone validation errors
      else if (data.message.includes('Contact phone') && data.message.includes('already used')) {
        fieldErrors.contactPhone = data.message;
        formError = 'Please fix the validation errors below.';
      }
      // Parse field-specific errors from message like "body/associatedCsmId must match format uuid"
      else {
        const fieldMatch = data.message.match(/body\/(\w+)\s+(.+)/);
        if (fieldMatch) {
          const [, fieldName, errorMsg] = fieldMatch;
          fieldErrors[fieldName] = errorMsg;
          formError = `Validation error: ${fieldName} ${errorMsg}`;
        }
      }
    }

    // Handle structured validation errors from Zod
    if (data?.errors && Array.isArray(data.errors)) {
      data.errors.forEach(({ path, message }) => {
        fieldErrors[path] = message;
      });
      if (data.errors.length > 0) {
        formError = 'Please fix the validation errors below.';
      }
    }
  }

  return { formError, fieldErrors };
};

const initialFormData: FormData = {
  clientName: '',
  clientStatus: 'active',
  environmentType: 'poc',
  associatedCsmId: '',
  contactEmail: '',
  contactPhone: '',
  firstDeploymentDate: '',
  currentVersion: '',
  maintenancePlan: '',
  nextScheduledPatchDate: '',
  domainName: '',
  hypervisorType: '',
  hypervisorVersion: '',
  hypervisorCustomType: '',
  staticIP: '',
  gateway: '',
  netmask: '',
  dnsServers: '',
  ntpServer: '',
  smtpServer: '',
  lanSpeed: '',
  wifiStandard: '',
  cpuCores: '',
  ramGB: '',
  storageGB: '',
  fingerprint: '',
  licenseUserFullName: '',
  licenseEmail: '',
  licenseUsername: '',
  licenseStartDate: '',
  licenseEndDate: '',
  licensePricingPlan: '',
  licenseNumberOfApps: '',
  useSameEmailForLicense: false,
  notes: '',
};

const RegisterOnpremPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { createDeployment, updateDeployment, isLoading } = useOnpremStore();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [existingDeployment, setExistingDeployment] = useState<OnpremDeployment | null>(null);
  const [prerequisiteFile, setPrerequisiteFile] = useState<File | null>(null);
  const [sslCertificateFile, setSslCertificateFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Load existing deployment for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      onpremApi.getById(id).then((deployment) => {
        setExistingDeployment(deployment);
        const infra = deployment.infrastructure as any;
        const license = deployment.license as any;

        // Determine if hypervisor type is custom (not in predefined list)
        const predefinedTypes = ['vmware', 'proxmox', 'hyperv', 'virtualbox', 'kvm', 'xen'];
        const hypervisorType = infra?.hypervisor?.type || '';
        const isCustomType = hypervisorType && !predefinedTypes.includes(hypervisorType);

        // Check if license email matches contact email
        const useSameEmail = license?.email && deployment.contactEmail &&
                             license.email === deployment.contactEmail;

        setFormData({
          clientName: deployment.clientName,
          clientStatus: deployment.clientStatus,
          environmentType: deployment.environmentType,
          associatedCsmId: deployment.associatedCsmId || '',
          contactEmail: deployment.contactEmail || '',
          contactPhone: deployment.contactPhone || '',
          firstDeploymentDate: deployment.firstDeploymentDate?.split('T')[0] || '',
          currentVersion: deployment.currentVersion || '',
          maintenancePlan: deployment.maintenancePlan || '',
          nextScheduledPatchDate: deployment.nextScheduledPatchDate?.split('T')[0] || '',
          domainName: deployment.domainName || '',
          hypervisorType: isCustomType ? 'other' : hypervisorType,
          hypervisorVersion: infra?.hypervisor?.version || '',
          hypervisorCustomType: isCustomType ? (infra?.hypervisor?.customType || hypervisorType) : '',
          staticIP: infra?.network?.staticIP || '',
          gateway: infra?.network?.gateway || '',
          netmask: infra?.network?.netmask || '',
          dnsServers: infra?.network?.dnsServers?.join(', ') || '',
          ntpServer: infra?.network?.ntpServer || '',
          smtpServer: infra?.network?.smtpServer || '',
          lanSpeed: infra?.network?.lanSpeed || '',
          wifiStandard: infra?.network?.wifiStandard || '',
          cpuCores: infra?.server?.cpuCores?.toString() || '',
          ramGB: infra?.server?.ramGB?.toString() || '',
          storageGB: infra?.server?.storageGB?.toString() || '',
          fingerprint: infra?.fingerprint || '',
          licenseUserFullName: license?.userFullName || '',
          licenseEmail: license?.email || '',
          licenseUsername: license?.username || '',
          licenseStartDate: license?.startDate?.split('T')[0] || '',
          licenseEndDate: license?.endDate?.split('T')[0] || '',
          licensePricingPlan: license?.pricingPlan || '',
          licenseNumberOfApps: license?.numberOfApps?.toString() || '',
          useSameEmailForLicense: useSameEmail,
          notes: deployment.notes || '',
        });
      });
    }
  }, [isEditMode, id]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user edits
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    // Clear form error on any change
    if (formError) {
      setFormError(null);
    }
  };

  const handleEmailBlur = async () => {
    if (!formData.contactEmail || !formData.contactEmail.trim()) return;

    setCheckingEmail(true);
    try {
      const result = await onpremApi.checkEmailExists(formData.contactEmail, id);
      if (result.exists && result.deployment) {
        setFieldErrors((prev) => ({
          ...prev,
          contactEmail: `This email is already used by "${result.deployment!.clientName}"`,
        }));
      }
    } catch (error) {
      console.error('Failed to check email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handlePhoneBlur = async () => {
    if (!formData.contactPhone || !formData.contactPhone.trim()) return;

    setCheckingPhone(true);
    try {
      const result = await onpremApi.checkPhoneExists(formData.contactPhone, id);
      if (result.exists && result.deployment) {
        setFieldErrors((prev) => ({
          ...prev,
          contactPhone: `This phone is already used by "${result.deployment!.clientName}"`,
        }));
      }
    } catch (error) {
      console.error('Failed to check phone:', error);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleDateBlur = () => {
    // Clear any existing date error first
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.nextScheduledPatchDate;
      return newErrors;
    });

    // Validate if both dates are present
    if (formData.firstDeploymentDate && formData.nextScheduledPatchDate) {
      if (new Date(formData.nextScheduledPatchDate) <= new Date(formData.firstDeploymentDate)) {
        setFieldErrors((prev) => ({
          ...prev,
          nextScheduledPatchDate: 'Next Scheduled Patch Date must be after First Deployment Date',
        }));
      }
    }
  };

  const handleNetworkFieldBlur = (field: keyof FormData) => {
    const value = (formData[field] as string) || '';

    // Clear existing error first
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });

    if (!value.trim()) return; // Empty = valid (optional fields)

    let error: string | null = null;

    if (field === 'staticIP' || field === 'gateway' || field === 'netmask') {
      if (!isValidIP(value)) {
        error = 'Please enter a valid IPv4 address';
      }
    } else if (field === 'dnsServers') {
      if (!isValidDnsServers(value)) {
        error = 'Each DNS server must be a valid IPv4 address';
      }
    } else if (field === 'ntpServer' || field === 'smtpServer') {
      if (!isValidDomainOrIP(value)) {
        error = 'Please enter a valid IP address or hostname';
      }
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error! }));
    }
  };

  const handleLicenseEmailCheckboxChange = (checked: boolean) => {
    handleChange('useSameEmailForLicense', checked);
    if (checked) {
      handleChange('licenseEmail', formData.contactEmail);
    }
  };

  const handleParsedData = (parsedData: any) => {
    console.log('🔄 Prepopulating form with parsed data:', parsedData);
    const updates: Partial<FormData> = {};

    // Smart detection: If currentVersion contains hypervisor keywords, reclassify it
    if (parsedData.currentVersion && !parsedData.hypervisorType) {
      const versionValue = String(parsedData.currentVersion).toLowerCase();
      if (versionValue.includes('vmware') || versionValue.includes('esxi') || versionValue.includes('vsphere')) {
        parsedData.hypervisorType = 'vmware';
        const versionMatch = parsedData.currentVersion.match(/(\d+\.\d+(?:\s*(?:u|update)\s*\d+)?)/i);
        if (versionMatch) {
          parsedData.hypervisorVersion = versionMatch[1].trim();
        }
        delete parsedData.currentVersion;
        console.log('🔍 Detected hypervisor in currentVersion, reclassified as hypervisor');
      } else if (versionValue.includes('proxmox')) {
        parsedData.hypervisorType = 'proxmox';
        const versionMatch = parsedData.currentVersion.match(/(\d+\.\d+)/);
        if (versionMatch) {
          parsedData.hypervisorVersion = versionMatch[1];
        }
        delete parsedData.currentVersion;
        console.log('🔍 Detected hypervisor in currentVersion, reclassified as hypervisor');
      }
    }

    // Map all parsed fields to form state (only real values, placeholders filtered out)
    if (parsedData.clientName) updates.clientName = parsedData.clientName;
    if (parsedData.contactEmail) updates.contactEmail = parsedData.contactEmail;
    if (parsedData.contactPhone) updates.contactPhone = parsedData.contactPhone;
    if (parsedData.domainName) updates.domainName = parsedData.domainName;
    if (parsedData.currentVersion) updates.currentVersion = parsedData.currentVersion;

    // Infrastructure
    if (parsedData.hypervisorType) updates.hypervisorType = parsedData.hypervisorType;
    if (parsedData.hypervisorVersion) updates.hypervisorVersion = parsedData.hypervisorVersion;
    if (parsedData.staticIP) updates.staticIP = parsedData.staticIP;
    if (parsedData.gateway) updates.gateway = parsedData.gateway;
    if (parsedData.netmask) updates.netmask = parsedData.netmask;
    if (parsedData.dnsServers) updates.dnsServers = parsedData.dnsServers.join(', ');
    if (parsedData.ntpServer) updates.ntpServer = parsedData.ntpServer;
    if (parsedData.smtpServer) updates.smtpServer = parsedData.smtpServer;
    if (parsedData.fingerprint) updates.fingerprint = parsedData.fingerprint;
    if (parsedData.cpuCores) updates.cpuCores = parsedData.cpuCores.toString();
    if (parsedData.ramGB) updates.ramGB = parsedData.ramGB.toString();
    if (parsedData.storageGB) updates.storageGB = parsedData.storageGB.toString();

    // License
    if (parsedData.licenseUserFullName) updates.licenseUserFullName = parsedData.licenseUserFullName;
    if (parsedData.licenseEmail) updates.licenseEmail = parsedData.licenseEmail;
    if (parsedData.licenseUsername) updates.licenseUsername = parsedData.licenseUsername;
    if (parsedData.licenseStartDate) updates.licenseStartDate = parsedData.licenseStartDate;
    if (parsedData.licenseEndDate) updates.licenseEndDate = parsedData.licenseEndDate;
    if (parsedData.licensePricingPlan) updates.licensePricingPlan = parsedData.licensePricingPlan;
    if (parsedData.licenseNumberOfApps) updates.licenseNumberOfApps = parsedData.licenseNumberOfApps.toString();

    console.log('✨ Applying updates to form:', updates);
    console.log('📊 Total fields to update:', Object.keys(updates).length);

    setFormData((prev) => ({ ...prev, ...updates }));
    alert(`✅ Form fields have been pre-filled with data from the Excel file!\n\n${Object.keys(updates).length} fields updated.`);
  };

  const handleFileSelect = async (file: File | null) => {
    setPrerequisiteFile(file);

    if (!file) return;

    console.log('📄 Starting Excel file parsing:', file.name);

    try {
      // Read file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Use first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        console.error('❌ Excel file contains no sheets');
        alert('Excel file is empty or invalid');
        return;
      }

      console.log('📊 Sheet name:', sheetName);

      const worksheet = workbook.Sheets[sheetName];

      // Read as form with raw: false to get text representation
      // This helps prevent exponential notation for large numbers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];

      // Also keep raw data for fields that need original text (like fingerprint)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true }) as any[][];

      console.log('📋 Total rows:', jsonData.length);
      console.log('📋 First 10 rows:', jsonData.slice(0, 10));

      if (jsonData.length < 2) {
        console.error('❌ Excel file is too short');
        alert('Excel file must have data rows');
        return;
      }

      // Parse as form: Look for label-value pairs
      // Typically: Column A = Label, Column B = Value
      const parsedData: any = {};

      // Field mappings for form-style layout
      const fieldMappings: Record<string, string[]> = {
        clientName: ['client name', 'company name', 'organization', 'customer name'],
        contactEmail: ['email', 'contact email', 'client email', 'email address'],
        contactPhone: ['phone', 'contact phone', 'telephone', 'mobile', 'phone number'],
        domainName: ['domain', 'domain name', 'url', 'website'],
        currentVersion: ['version', 'current version', 'app version', 'appknox version'],
        hypervisorType: ['hypervisor type', 'virtualization', 'platform', 'vm platform'],
        hypervisorVersion: ['vmware vsphere', 'esxi version', 'vsphere', 'hypervisor version', 'proxmox version', 'hyperv version', 'vmware version', 'vm version'],
        staticIP: ['static ip', 'ip address', 'ip', 'server ip'],
        gateway: ['gateway', 'default gateway', 'network gateway', 'gateway ip'],
        netmask: ['netmask', 'subnet mask', 'subnet'],
        dnsServers: ['dns', 'dns servers', 'dns server', 'primary dns', 'secondary dns'],
        ntpServer: ['ntp', 'ntp server', 'time server'],
        smtpServer: ['smtp', 'smtp server', 'mail server', 'email server', 'smtp server url'],
        fingerprint: ['fingerprint', 'device fingerprint', 'unique identifier', 'license fingerprint'],
        cpuCores: ['cpu', 'cpu cores', 'cores', 'processor', 'vcpu', 'cpu core', 'core', 'number of cores', 'no of cores', 'procured server'],
        ramGB: ['ram', 'memory', 'ram gb', 'memory gb', 'ram (gb)', 'memory (gb)'],
        storageGB: ['storage', 'disk', 'storage gb', 'disk space', 'hard disk', 'storage (gb)', 'disk (gb)'],
        licenseUserFullName: ['license user', 'license name', 'licensee', 'licensee name', 'license user full name'],
        licenseEmail: ['license email', 'licensee email', 'license user email'],
        licenseUsername: ['license username', 'license user account username', 'user account username', 'username', 'user account', 'account username'],
        licenseStartDate: ['license start', 'start date', 'valid from', 'license start date', 'validity start'],
        licenseEndDate: ['license end', 'end date', 'valid until', 'expiry', 'license end date', 'validity end', 'expiry date'],
        licensePricingPlan: ['pricing plan', 'plan', 'license plan', 'subscription plan', 'billing plan', 'appknox pricing plan'],
        licenseNumberOfApps: ['number of apps', 'apps', 'scans', 'app count', 'number of scans', 'scan limit', 'number of apps/scans'],
      };

      // Common placeholder values to ignore in Excel
      const placeholderValues = [
        'tbd', 'to be determined', 'to be decided',
        'n/a', 'na', 'not applicable',
        'pending', 'awaiting', 'awaiting approval',
        'enter here', 'fill here', 'insert here',
        'xxx', 'xxxx', 'xxxxxx',
        'sample', 'example', 'dummy',
        'placeholder', 'temp', 'temporary',
        'none', 'nil', 'null',
        '---', '--', '-',
      ];

      // Check if a value is a placeholder/dummy value
      const isPlaceholder = (value: any): boolean => {
        if (!value || value === '') return true;
        const strValue = String(value).toLowerCase().trim();
        if (strValue === '') return true;
        return placeholderValues.some(placeholder => strValue === placeholder || strValue.includes(placeholder));
      };

      // Scan all rows looking for label-value pairs
      // Excel format can be:
      // - 2 columns: Column 0 = Label, Column 1 = Value
      // - 3 columns: Column 0 = Label, Column 1 = Explanation, Column 2 = Response/Value
      jsonData.forEach((row, rowIndex) => {
        if (!row || row.length < 2) return;

        const label = row[0]; // Column A

        // Prefer column 2 (Response) if it has a value, otherwise use column 1
        let value = row[2]; // Try Column C first (Response column)
        let rawValue = rawData[rowIndex]?.[2];

        // If column 2 is empty/placeholder, fallback to column 1
        if (!value || value === '' || String(value).trim() === '' || isPlaceholder(value)) {
          value = row[1]; // Fallback to Column B
          rawValue = rawData[rowIndex]?.[1];
        }

        // Skip if label is empty or value is empty or is a placeholder
        if (!label || !value || value === '' || String(value).trim() === '') return;
        if (isPlaceholder(value)) {
          console.log(`⏭️  Row ${rowIndex}: "${label}" → Skipped (placeholder: "${value}")`);
          return;
        }

        // Clean label: lowercase, remove colons, asterisks, newlines, and extra spaces
        const labelStr = String(label)
          .toLowerCase()
          .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
          .replace(/[:\*]/g, '') // Remove colons and asterisks
          .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
          .trim();

        // Try to match label to field
        let matchFound = false;
        for (const [fieldName, patterns] of Object.entries(fieldMappings)) {
          if (patterns.some(pattern => labelStr.includes(pattern) || pattern.includes(labelStr))) {
            matchFound = true;
            let parsedValue = value;

            // Handle different field types
            if (fieldName.includes('Date')) {
              if (typeof parsedValue === 'number') {
                const date = XLSX.SSF.parse_date_code(parsedValue);
                parsedValue = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
              } else if (parsedValue instanceof Date) {
                parsedValue = parsedValue.toISOString().split('T')[0];
              } else {
                // Try to parse string date
                const dateMatch = String(parsedValue).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
                if (dateMatch) {
                  const [, month, day, year] = dateMatch;
                  const fullYear = year.length === 2 ? `20${year}` : year;
                  parsedValue = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
              }
            } else if (fieldName === 'dnsServers') {
              parsedValue = String(parsedValue).split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
            } else if (fieldName === 'licensePricingPlan') {
              const normalized = String(parsedValue).toLowerCase();
              parsedValue = normalized.includes('app') ? 'per app' : 'per scan';
            } else if (fieldName === 'hypervisorType') {
              // Parse hypervisor type and try to extract version too
              const originalValue = String(parsedValue); // Keep original before modification
              const valueStr = originalValue.toLowerCase();

              if (valueStr.includes('vmware') || valueStr.includes('esxi') || valueStr.includes('vsphere')) {
                parsedValue = 'vmware';
                // Extract version from ORIGINAL value
                const versionMatch = originalValue.match(/(\d+\.\d+(?:\s*(?:u|update)\s*\d+)?)/i);
                if (versionMatch) {
                  parsedData['hypervisorVersion'] = versionMatch[1].trim();
                  console.log(`  ↳ Extracted version: ${versionMatch[1].trim()}`);
                }
              } else if (valueStr.includes('proxmox')) {
                parsedValue = 'proxmox';
                // Extract version from ORIGINAL value
                const versionMatch = originalValue.match(/(\d+\.\d+)/);
                if (versionMatch) {
                  parsedData['hypervisorVersion'] = versionMatch[1];
                  console.log(`  ↳ Extracted version: ${versionMatch[1]}`);
                }
              } else if (valueStr.includes('hyper-v') || valueStr.includes('hyperv')) {
                parsedValue = 'hyperv';
                // Extract year version (e.g., 2016, 2019, 2022)
                const versionMatch = originalValue.match(/(\d{4})/);
                if (versionMatch) {
                  parsedData['hypervisorVersion'] = versionMatch[1];
                  console.log(`  ↳ Extracted version: ${versionMatch[1]}`);
                }
              } else if (valueStr.includes('virtualbox') || valueStr.includes('vbox')) {
                parsedValue = 'virtualbox';
                // Extract version from ORIGINAL value
                const versionMatch = originalValue.match(/(\d+\.\d+)/);
                if (versionMatch) {
                  parsedData['hypervisorVersion'] = versionMatch[1];
                  console.log(`  ↳ Extracted version: ${versionMatch[1]}`);
                }
              } else if (valueStr.includes('kvm')) {
                parsedValue = 'kvm';
                // KVM might have version too
                const versionMatch = originalValue.match(/(\d+\.\d+)/);
                if (versionMatch) {
                  parsedData['hypervisorVersion'] = versionMatch[1];
                  console.log(`  ↳ Extracted version: ${versionMatch[1]}`);
                }
              } else if (valueStr.includes('xen')) {
                parsedValue = 'xen';
                // Xen might have version too
                const versionMatch = originalValue.match(/(\d+\.\d+)/);
                if (versionMatch) {
                  parsedData['hypervisorVersion'] = versionMatch[1];
                  console.log(`  ↳ Extracted version: ${versionMatch[1]}`);
                }
              }
            } else if (fieldName === 'hypervisorVersion') {
              // Check if value also contains hypervisor type info (like "VSphere 1.6")
              const originalValue = String(parsedValue);
              const valueStr = originalValue.toLowerCase();

              // Detect hypervisor type from version field
              if (!parsedData.hypervisorType) {
                if (valueStr.includes('vmware') || valueStr.includes('esxi') || valueStr.includes('vsphere')) {
                  parsedData.hypervisorType = 'vmware';
                  console.log('  ↳ Detected hypervisor type: vmware');
                } else if (valueStr.includes('proxmox')) {
                  parsedData.hypervisorType = 'proxmox';
                  console.log('  ↳ Detected hypervisor type: proxmox');
                } else if (valueStr.includes('hyper-v') || valueStr.includes('hyperv')) {
                  parsedData.hypervisorType = 'hyperv';
                  console.log('  ↳ Detected hypervisor type: hyperv');
                }
              }

              // Extract just the version number
              const versionMatch = originalValue.match(/(\d+\.\d+(?:\s*(?:u|update)\s*\d+)?)/i);
              if (versionMatch) {
                parsedValue = versionMatch[1].trim();
              }
            } else if (fieldName === 'fingerprint') {
              // For fingerprint, handle scientific notation properly
              let fingerprintValue = parsedValue;

              // Check if it's a number (including scientific notation)
              if (typeof rawValue === 'number') {
                // Use raw number and convert to full string
                fingerprintValue = rawValue.toLocaleString('en-US', {
                  useGrouping: false,
                  maximumFractionDigits: 0
                });
                console.log(`🔢 Fingerprint (from number): ${fingerprintValue}`);
              } else {
                const valueStr = String(fingerprintValue);
                // Check if it contains scientific notation
                if (valueStr.includes('E+') || valueStr.includes('e+') || valueStr.includes('E-') || valueStr.includes('e-')) {
                  try {
                    const num = parseFloat(valueStr);
                    if (!isNaN(num)) {
                      // Convert from scientific notation to full number string
                      fingerprintValue = num.toLocaleString('en-US', {
                        useGrouping: false,
                        maximumFractionDigits: 0
                      });
                      console.log(`🔢 Fingerprint (from scientific): ${fingerprintValue}`);
                    }
                  } catch (e) {
                    console.error('Failed to convert fingerprint:', e);
                  }
                }
              }

              parsedValue = fingerprintValue;
            } else if (fieldName === 'cpuCores') {
              // Extract number from strings like "6 cores", "intel 6 core", "6", "intel"
              const valueStr = String(parsedValue);
              const numMatch = valueStr.match(/(\d+)/);
              if (numMatch) {
                parsedValue = parseInt(numMatch[1]);
              } else {
                // If no number found (e.g., just "intel"), skip this field
                parsedValue = undefined;
              }
            } else if (['ramGB', 'storageGB'].includes(fieldName)) {
              // Extract number from strings like "64GB", "500 GB", "64"
              const valueStr = String(parsedValue).toUpperCase();
              const numStr = valueStr.replace(/GB|G|[^0-9]/gi, '').trim();
              parsedValue = parseInt(numStr) || undefined;
            } else if (fieldName === 'licenseNumberOfApps') {
              const numStr = String(parsedValue).replace(/[^0-9]/g, '');
              parsedValue = parseInt(numStr) || undefined;
            }

            if (parsedValue !== undefined && parsedValue !== null && parsedValue !== '') {
              parsedData[fieldName] = parsedValue;
              console.log(`✅ Row ${rowIndex}: "${label}" → ${fieldName} = ${parsedValue}`);
            }
            break;
          }
        }

        // Log unmatched labels for debugging
        if (!matchFound && label && value) {
          console.log(`⚠️  Unmatched row ${rowIndex}: Label="${labelStr}" Value="${value}"`);
        }
      });

      console.log('📦 Final parsed data:', parsedData);
      console.log('📝 Total fields extracted:', Object.keys(parsedData).length);

      if (Object.keys(parsedData).length === 0) {
        alert('No matching fields found in Excel file. Please check the column headers.');
        return;
      }

      // Prepopulate form
      handleParsedData(parsedData);
    } catch (error) {
      console.error('❌ Failed to parse Excel file:', error);
      alert('Failed to parse Excel file. Please check the file format.\n\nError: ' + (error as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear form error but preserve field errors (they may have onBlur validation errors)
    setFormError(null);

    // Client-side validation
    const validation = validateForm(formData);

    // Merge validation errors with existing field errors (from onBlur)
    const mergedErrors = { ...fieldErrors, ...validation.errors };

    if (!validation.isValid || Object.keys(fieldErrors).length > 0) {
      setFieldErrors(mergedErrors);
      setFormError('Please fix the validation errors below.');

      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const data: CreateOnpremInput = {
      clientName: formData.clientName,
      clientStatus: formData.clientStatus,
      environmentType: formData.environmentType,
      associatedCsmId: formData.associatedCsmId || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      firstDeploymentDate: formData.firstDeploymentDate || undefined,
      currentVersion: formData.currentVersion || undefined,
      maintenancePlan: formData.maintenancePlan || undefined,
      nextScheduledPatchDate: formData.nextScheduledPatchDate || undefined,
      domainName: formData.domainName || undefined,
      infrastructure: {
        hypervisor: {
          type: formData.hypervisorType === 'other'
            ? (formData.hypervisorCustomType || 'other')
            : (formData.hypervisorType || undefined),
          version: formData.hypervisorVersion || undefined,
          customType: formData.hypervisorType === 'other'
            ? (formData.hypervisorCustomType || undefined)
            : undefined,
        },
        network: {
          staticIP: formData.staticIP || undefined,
          gateway: formData.gateway || undefined,
          netmask: formData.netmask || undefined,
          dnsServers: formData.dnsServers ? formData.dnsServers.split(',').map((s) => s.trim()) : undefined,
          ntpServer: formData.ntpServer || undefined,
          smtpServer: formData.smtpServer || undefined,
          lanSpeed: formData.lanSpeed || undefined,
          wifiStandard: formData.wifiStandard || undefined,
        },
        server: {
          cpuCores:
            formData.cpuCores && formData.cpuCores !== 'custom' ? parseInt(formData.cpuCores) : undefined,
          ramGB:
            formData.ramGB && formData.ramGB !== 'custom' ? parseInt(formData.ramGB) : undefined,
          storageGB:
            formData.storageGB && formData.storageGB !== 'custom' ? parseInt(formData.storageGB) : undefined,
        },
        fingerprint: formData.fingerprint || undefined,
      },
      license: {
        userFullName: formData.licenseUserFullName || undefined,
        email: formData.licenseEmail || undefined,
        username: formData.licenseUsername || undefined,
        startDate: formData.licenseStartDate || undefined,
        endDate: formData.licenseEndDate || undefined,
        pricingPlan: formData.licensePricingPlan || undefined,
        numberOfApps: formData.licenseNumberOfApps ? parseInt(formData.licenseNumberOfApps) : undefined,
      },
      notes: formData.notes || undefined,
    };

    try {
      let deploymentId: string;
      if (isEditMode && id) {
        await updateDeployment(id, data);
        deploymentId = id;
      } else {
        const created = await createDeployment(data);
        deploymentId = created.id;
      }

      // Upload prerequisite file if selected (file was already parsed when selected)
      if (prerequisiteFile) {
        setUploadingFile(true);
        try {
          await onpremApi.uploadPrerequisite(deploymentId, prerequisiteFile);
        } catch (error) {
          console.error('Failed to upload prerequisite file:', error);
        }
        setUploadingFile(false);
      }

      // Upload SSL certificate file if selected
      if (sslCertificateFile) {
        setUploadingFile(true);
        try {
          await onpremApi.uploadSslCertificate(deploymentId, sslCertificateFile);
        } catch (error) {
          console.error('Failed to upload SSL certificate:', error);
        }
        setUploadingFile(false);
      }

      // Refresh deployment data after file uploads to show download buttons
      if (isEditMode && (prerequisiteFile || sslCertificateFile)) {
        const updatedDeployment = await onpremApi.getById(deploymentId);
        setExistingDeployment(updatedDeployment);
      }

      // Only navigate away if we're creating a new deployment
      if (!isEditMode) {
        navigate('/onprem');
      }
    } catch (error) {
      console.error('Failed to save deployment:', error);
      const { formError: parsedFormError, fieldErrors: parsedFieldErrors } = parseApiError(error);
      setFormError(parsedFormError);
      setFieldErrors(parsedFieldErrors);

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Log field errors for debugging
      if (Object.keys(parsedFieldErrors).length > 0) {
        console.error('Field errors:', parsedFieldErrors);
      }
    }
  };

  const handleDownloadPrerequisite = async () => {
    if (!existingDeployment?.prerequisiteFileUrl) return;
    try {
      const blob = await onpremApi.downloadPrerequisite(existingDeployment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = existingDeployment.prerequisiteFileName || 'prerequisite.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleDownloadSslCertificate = async () => {
    if (!existingDeployment?.sslCertificateFileUrl) return;
    try {
      const blob = await onpremApi.downloadSslCertificate(existingDeployment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use the filename from the URL, or fallback to a default
      const filename = existingDeployment.sslCertificateFileUrl.split('/').pop() || `${existingDeployment.id}-ssl-certs.zip`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download SSL certificate:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/onprem')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit On-Prem Client' : 'Register New On-Prem Client'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode
              ? 'Update the client deployment information'
              : 'Fill in the details to register a new on-premise deployment'}
          </p>
        </div>
      </div>

      {(formError || Object.keys(fieldErrors).length > 0) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error saving deployment</p>
            {formError && <p className="text-sm text-red-700 mt-1">{formError}</p>}
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="mt-2 space-y-1">
                {Object.entries(fieldErrors).map(([field, error]) => (
                  <li key={field} className="text-sm text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Client & Ownership */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">1. Client & Ownership</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name *"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Enter client name"
                error={fieldErrors.clientName}
                tooltip="The official name of the client organization"
              />
              <Select
                label="Client Status"
                options={clientStatusOptions}
                value={formData.clientStatus}
                onChange={(e) => handleChange('clientStatus', e.target.value)}
                tooltip="Current operational status of the client deployment"
              />
              <Select
                label="Environment Type"
                options={environmentOptions}
                value={formData.environmentType}
                onChange={(e) => handleChange('environmentType', e.target.value)}
                tooltip="Type of environment - POC for proof of concept, Production for live deployments"
              />
              <UserSearchCombobox
                label="Associated CSM *"
                value={formData.associatedCsmId}
                onChange={(userId) => handleChange('associatedCsmId', userId)}
                placeholder="Search for CSM user..."
                error={fieldErrors.associatedCsmId}
                selectedUser={existingDeployment?.associatedCsm}
                tooltip="Customer Success Manager responsible for this client"
              />
              <Input
                label="Contact Email *"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="client@example.com"
                error={fieldErrors.contactEmail}
                disabled={checkingEmail}
                tooltip="Primary email address for client communications"
              />
              <Input
                label="Contact Phone *"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="+1 (555) 123-4567"
                error={fieldErrors.contactPhone}
                disabled={checkingPhone}
                tooltip="Primary phone number for client contact, include country code"
              />
              <Input
                label="Domain Name"
                value={formData.domainName}
                onChange={(e) => handleChange('domainName', e.target.value)}
                placeholder="client.appknox.com"
                error={fieldErrors.domainName}
                tooltip="Domain name or IP address where the Appknox instance is hosted"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisite File (XLS/XLSX)
                </label>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {existingDeployment?.prerequisiteFileName && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm text-gray-700">
                      Current file: {existingDeployment.prerequisiteFileName}
                    </p>
                    {existingDeployment?.prerequisiteFileUrl && (
                      <Button type="button" variant="outline" size="sm" onClick={handleDownloadPrerequisite}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Section 2: License Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">2. License Information</h2>
            <p className="text-sm text-gray-500 mt-1">License and subscription details</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="License User Full Name"
                value={formData.licenseUserFullName}
                onChange={(e) => handleChange('licenseUserFullName', e.target.value)}
                placeholder="John Doe"
                tooltip="Full name of the user who holds the Appknox license"
              />

              <div>
                <Input
                  label="License Email"
                  type="email"
                  value={formData.licenseEmail}
                  onChange={(e) => handleChange('licenseEmail', e.target.value)}
                  placeholder="license@example.com"
                  disabled={formData.useSameEmailForLicense}
                  error={fieldErrors.licenseEmail}
                  tooltip="Email address associated with the Appknox license"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.useSameEmailForLicense}
                    onChange={(e) => handleLicenseEmailCheckboxChange(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">Use contact email</span>
                </div>
              </div>

              <Input
                label="License User Account Username"
                value={formData.licenseUsername}
                onChange={(e) => handleChange('licenseUsername', e.target.value)}
                placeholder="johndoe"
                tooltip="Username for the Appknox license account"
              />

              <Input
                label="License Start Date"
                type="date"
                value={formData.licenseStartDate}
                onChange={(e) => handleChange('licenseStartDate', e.target.value)}
                error={fieldErrors.licenseStartDate}
                tooltip="Date when the license becomes active"
              />

              <Input
                label="License End Date"
                type="date"
                value={formData.licenseEndDate}
                onChange={(e) => handleChange('licenseEndDate', e.target.value)}
                error={fieldErrors.licenseEndDate}
                tooltip="Date when the license expires"
              />

              <Select
                label="Appknox Pricing Plan"
                options={pricingPlanOptions}
                value={formData.licensePricingPlan}
                onChange={(e) => handleChange('licensePricingPlan', e.target.value)}
                tooltip="Selected pricing tier for the Appknox subscription"
              />

              <Input
                label="Number of Apps/Scans"
                type="number"
                value={formData.licenseNumberOfApps}
                onChange={(e) => handleChange('licenseNumberOfApps', e.target.value)}
                placeholder="10"
                min={1}
                step={1}
                error={fieldErrors.licenseNumberOfApps}
                tooltip="Maximum number of applications or scans included in the license"
              />
            </div>
          </CardBody>
        </Card>

        {/* Section 3: Deployment & Versioning */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">3. Deployment & Versioning</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Deployment Date"
                type="date"
                value={formData.firstDeploymentDate}
                onChange={(e) => handleChange('firstDeploymentDate', e.target.value)}
                onBlur={handleDateBlur}
                tooltip="Date when Appknox was first deployed for this client"
              />
              <Input
                label="Current Appknox Version"
                value={formData.currentVersion}
                onChange={(e) => handleChange('currentVersion', e.target.value)}
                placeholder="e.g., 1.2.3"
                tooltip="Current version of Appknox installed (e.g., 1.2.3)"
              />
              <Select
                label="Maintenance Plan"
                options={maintenanceOptions}
                value={formData.maintenancePlan}
                onChange={(e) => handleChange('maintenancePlan', e.target.value)}
                tooltip="Frequency of scheduled maintenance and updates"
              />
              <Input
                label="Next Scheduled Patch Date"
                type="date"
                value={formData.nextScheduledPatchDate}
                onChange={(e) => handleChange('nextScheduledPatchDate', e.target.value)}
                onBlur={handleDateBlur}
                error={fieldErrors.nextScheduledPatchDate}
                tooltip="Next planned date for applying patches or updates"
              />
            </div>
          </CardBody>
        </Card>

        {/* Section 4: Infrastructure & Technical Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">4. Infrastructure & Technical Details</h2>
            <p className="text-sm text-gray-500 mt-1">Server, network, and hypervisor configuration</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Hypervisor */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Hypervisor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Type"
                    options={hypervisorOptions}
                    value={formData.hypervisorType}
                    onChange={(e) => {
                      handleChange('hypervisorType', e.target.value);
                      // Clear version when type changes
                      handleChange('hypervisorVersion', '');
                      // Clear custom type when switching away from "other"
                      if (e.target.value !== 'other') {
                        handleChange('hypervisorCustomType', '');
                      }
                    }}
                    tooltip="Virtualization platform hosting the Appknox instance"
                  />

                  {/* Show custom type input when "other" is selected */}
                  {formData.hypervisorType === 'other' && (
                    <Input
                      label="Custom Hypervisor Name"
                      value={formData.hypervisorCustomType}
                      onChange={(e) => handleChange('hypervisorCustomType', e.target.value)}
                      placeholder="Enter hypervisor name"
                      tooltip="Name of the hypervisor if not listed above"
                    />
                  )}

                  {/* Show version dropdown for predefined types */}
                  {formData.hypervisorType &&
                    formData.hypervisorType !== 'other' &&
                    hypervisorVersions[formData.hypervisorType] && (
                      <div>
                        <Select
                          label="Version"
                          options={hypervisorVersions[formData.hypervisorType]}
                          value={
                            hypervisorVersions[formData.hypervisorType].some(
                              (opt) => opt.value === formData.hypervisorVersion
                            )
                              ? formData.hypervisorVersion
                              : ''
                          }
                          onChange={(e) => handleChange('hypervisorVersion', e.target.value)}
                          tooltip="Version of the hypervisor software"
                        />
                        {/* Show custom version input if current value is not in dropdown */}
                        {formData.hypervisorVersion &&
                          !hypervisorVersions[formData.hypervisorType].some(
                            (opt) => opt.value === formData.hypervisorVersion
                          ) && (
                            <Input
                              label="Custom Version (from Excel)"
                              value={formData.hypervisorVersion}
                              onChange={(e) => handleChange('hypervisorVersion', e.target.value)}
                              placeholder="Custom version"
                              className="mt-2"
                            />
                          )}
                      </div>
                    )}

                  {/* Show version text input for KVM, Xen, or Other */}
                  {formData.hypervisorType &&
                    (formData.hypervisorType === 'other' ||
                      formData.hypervisorType === 'kvm' ||
                      formData.hypervisorType === 'xen') && (
                      <Input
                        label="Version"
                        value={formData.hypervisorVersion}
                        onChange={(e) => handleChange('hypervisorVersion', e.target.value)}
                        placeholder="Enter version"
                        tooltip="Version of the hypervisor software"
                      />
                    )}
                </div>
              </div>

              {/* Server Capacity */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Server Capacity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CPU Cores Dropdown */}
                  <div>
                    <Select
                      label="CPU Cores"
                      options={cpuCoresOptions}
                      value={
                        formData.cpuCores === 'custom' ||
                        (formData.cpuCores && !['8', '16', '32'].includes(formData.cpuCores))
                          ? 'custom'
                          : formData.cpuCores
                      }
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          handleChange('cpuCores', 'custom');
                        } else {
                          handleChange('cpuCores', e.target.value);
                        }
                      }}
                      tooltip="Number of CPU cores allocated to the virtual machine"
                    />
                    {(formData.cpuCores === 'custom' ||
                      (formData.cpuCores && !['8', '16', '32', ''].includes(formData.cpuCores))) && (
                      <Input
                        label="Custom CPU Cores"
                        type="number"
                        value={formData.cpuCores === 'custom' ? '' : formData.cpuCores}
                        onChange={(e) => handleChange('cpuCores', e.target.value)}
                        placeholder="Enter number of cores"
                        min={1}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* RAM Dropdown */}
                  <div>
                    <Select
                      label="RAM"
                      options={ramOptions}
                      value={
                        formData.ramGB === 'custom' ||
                        (formData.ramGB && !['8', '16', '32', '64', '128', '256'].includes(formData.ramGB))
                          ? 'custom'
                          : formData.ramGB
                      }
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          handleChange('ramGB', 'custom');
                        } else {
                          handleChange('ramGB', e.target.value);
                        }
                      }}
                      tooltip="Amount of RAM (memory) allocated to the virtual machine in GB"
                    />
                    {(formData.ramGB === 'custom' ||
                      (formData.ramGB && !['8', '16', '32', '64', '128', '256', ''].includes(formData.ramGB))) && (
                      <Input
                        label="Custom RAM (GB)"
                        type="number"
                        value={formData.ramGB === 'custom' ? '' : formData.ramGB}
                        onChange={(e) => handleChange('ramGB', e.target.value)}
                        placeholder="Enter RAM in GB"
                        min={1}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Storage Dropdown */}
                  <div>
                    <Select
                      label="Storage"
                      options={storageOptions}
                      value={
                        formData.storageGB === 'custom' ||
                        (formData.storageGB && !['200', '300', '500', '1000', '2000'].includes(formData.storageGB))
                          ? 'custom'
                          : formData.storageGB
                      }
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          handleChange('storageGB', 'custom');
                        } else {
                          handleChange('storageGB', e.target.value);
                        }
                      }}
                      tooltip="Disk storage capacity allocated to the virtual machine in GB"
                    />
                    {(formData.storageGB === 'custom' ||
                      (formData.storageGB && !['200', '300', '500', '1000', '2000', ''].includes(formData.storageGB))) && (
                      <Input
                        label="Custom Storage (GB)"
                        type="number"
                        value={formData.storageGB === 'custom' ? '' : formData.storageGB}
                        onChange={(e) => handleChange('storageGB', e.target.value)}
                        placeholder="Enter storage in GB"
                        min={1}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Network Configuration */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Network Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Static IP"
                    value={formData.staticIP}
                    onChange={(e) => handleChange('staticIP', e.target.value)}
                    onBlur={() => handleNetworkFieldBlur('staticIP')}
                    error={fieldErrors.staticIP}
                    placeholder="192.168.1.100"
                    tooltip="Static IP address assigned to the Appknox server"
                  />
                  <Input
                    label="Gateway"
                    value={formData.gateway}
                    onChange={(e) => handleChange('gateway', e.target.value)}
                    onBlur={() => handleNetworkFieldBlur('gateway')}
                    error={fieldErrors.gateway}
                    placeholder="192.168.1.1"
                    tooltip="Default gateway IP address for network routing"
                  />
                  <Input
                    label="Netmask"
                    value={formData.netmask}
                    onChange={(e) => handleChange('netmask', e.target.value)}
                    onBlur={() => handleNetworkFieldBlur('netmask')}
                    error={fieldErrors.netmask}
                    placeholder="255.255.255.0"
                    tooltip="Network mask defining the subnet (e.g., 255.255.255.0)"
                  />
                  <Input
                    label="DNS Servers (comma-separated)"
                    value={formData.dnsServers}
                    onChange={(e) => handleChange('dnsServers', e.target.value)}
                    onBlur={() => handleNetworkFieldBlur('dnsServers')}
                    error={fieldErrors.dnsServers}
                    placeholder="8.8.8.8, 8.8.4.4"
                    tooltip="DNS server addresses separated by commas for domain name resolution"
                  />
                  <Input
                    label="NTP Server"
                    value={formData.ntpServer}
                    onChange={(e) => handleChange('ntpServer', e.target.value)}
                    onBlur={() => handleNetworkFieldBlur('ntpServer')}
                    error={fieldErrors.ntpServer}
                    placeholder="pool.ntp.org"
                    tooltip="Network Time Protocol server for time synchronization"
                  />
                  <Input
                    label="SMTP Server"
                    value={formData.smtpServer}
                    onChange={(e) => handleChange('smtpServer', e.target.value)}
                    onBlur={() => handleNetworkFieldBlur('smtpServer')}
                    error={fieldErrors.smtpServer}
                    placeholder="smtp.example.com"
                    tooltip="SMTP server address for sending email notifications"
                  />
                  <Select
                    label="LAN Speed"
                    options={lanSpeedOptions}
                    value={formData.lanSpeed}
                    onChange={(e) => handleChange('lanSpeed', e.target.value)}
                    tooltip="Local Area Network connection speed (e.g., 1 Gbps, 10 Gbps)"
                  />
                  <Select
                    label="WiFi Standard"
                    options={wifiOptions}
                    value={formData.wifiStandard}
                    onChange={(e) => handleChange('wifiStandard', e.target.value)}
                    tooltip="WiFi standard supported by the network (e.g., WiFi 5, WiFi 6)"
                  />
                  <Input
                    label="Fingerprint"
                    value={formData.fingerprint}
                    onChange={(e) => handleChange('fingerprint', e.target.value)}
                    placeholder="Device fingerprint or unique identifier"
                    tooltip="Unique identifier or fingerprint for the device/deployment"
                  />
                </div>
              </div>

              {/* SSL Certificate */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">SSL Certificate</h3>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SSL Certificate File (ZIP, GZ, TAR.GZ - Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".zip,.gz,.tar.gz,.tgz"
                      onChange={(e) => setSslCertificateFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {existingDeployment?.sslCertificateFileUrl && (
                      <Button type="button" variant="outline" size="sm" onClick={handleDownloadSslCertificate}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                  {existingDeployment?.sslCertificateFileUrl && (
                    <p className="mt-1 text-sm text-gray-500">
                      Current file: {existingDeployment.sslCertificateFileUrl.split('/').pop()}
                    </p>
                  )}
                  {sslCertificateFile && (
                    <p className="mt-1 text-sm text-green-600">
                      Selected: {sslCertificateFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
          </CardHeader>
          <CardBody>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information about this deployment..."
              rows={4}
            />
          </CardBody>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/onprem')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || uploadingFile}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading || uploadingFile
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Register Client'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { RegisterOnpremPage };
