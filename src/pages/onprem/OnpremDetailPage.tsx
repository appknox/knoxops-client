import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { ClientStatusBadge, EnvironmentTypeBadge } from '@/components/onprem/OnpremStatusBadge';
import { LicenseRequestsTab } from '@/components/onprem/LicenseRequestsTab';
import { RequestLicenseModal } from '@/components/onprem/RequestLicenseModal';
import { onpremApi } from '@/api';
import { usePermissions } from '@/hooks/usePermissions';
import { useOnpremLicenseRequestStore } from '@/stores/onpremLicenseRequestStore';
import type { OnpremDeployment } from '@/types';

const formatDate = (date?: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex gap-2 text-sm py-1">
    <span className="w-48 shrink-0 font-medium text-gray-500">{label}</span>
    <span className="text-gray-900">{value || '—'}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</p>
    {children}
  </div>
);

type Tab = 'details' | 'requests';

export function OnpremDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageOnprem } = usePermissions();

  const [deployment, setDeployment] = useState<OnpremDeployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'details'
  );
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  const { requests, fetchRequests } = useOnpremLicenseRequestStore();
  const hasPendingRequest = requests.some((r) => r.status === 'pending');

  useEffect(() => {
    if (id && activeTab === 'requests') {
      fetchRequests(id);
    }
  }, [id, activeTab, fetchRequests]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    onpremApi
      .getById(id)
      .then((data) => setDeployment(data))
      .catch(() => setError('Failed to load deployment'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'details' ? {} : { tab });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error || 'Deployment not found'}</div>
      </div>
    );
  }

  const infra = deployment.infrastructure;
  const license = deployment.license;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/onprem/clients')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deployment.clientName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ClientStatusBadge status={deployment.clientStatus} />
              <EnvironmentTypeBadge type={deployment.environmentType} />
              {deployment.currentVersion && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  v{deployment.currentVersion}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'requests' && (
            <span
              title={hasPendingRequest ? 'A pending request already exists. Cancel it before submitting a new one.' : undefined}
            >
              <Button
                onClick={() => setLicenseModalOpen(true)}
                disabled={hasPendingRequest}
              >
                <Plus className="h-4 w-4 mr-2" />
                Request License
              </Button>
            </span>
          )}
          {canManageOnprem && (
            <Button variant="outline" onClick={() => navigate(`/onprem/${deployment.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['details', 'requests'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          <Section title="Client & Ownership">
            <Row label="Client Name" value={deployment.clientName} />
            <Row label="Contact Email" value={deployment.contactEmail} />
            <Row label="Contact Phone" value={deployment.contactPhone} />
            <Row label="Domain Name" value={deployment.domainName} />
          </Section>

          <Section title="Deployment & Versioning">
            <Row label="Current Version" value={deployment.currentVersion} />
            <Row label="First Deployment" value={formatDate(deployment.firstDeploymentDate)} />
            <Row label="Last Patch Date" value={formatDate(deployment.lastPatchDate)} />
            <Row label="Next Scheduled Patch" value={formatDate(deployment.nextScheduledPatchDate)} />
            <Row label="Maintenance Plan" value={deployment.maintenancePlan} />
          </Section>

          {license && (license.startDate || license.endDate || license.numberOfApps) && (
            <Section title="License Information">
              <Row label="License User" value={license.userFullName} />
              <Row label="Email" value={license.email} />
              <Row label="Start Date" value={formatDate(license.startDate)} />
              <Row label="End Date" value={formatDate(license.endDate)} />
              <Row label="Number of Apps" value={license.numberOfApps?.toString()} />
              <Row label="Pricing Plan" value={license.pricingPlan} />
            </Section>
          )}

          {infra?.network && (
            <Section title="Network Configuration">
              <Row label="Static IP" value={infra.network.staticIP} />
              <Row label="Gateway" value={infra.network.gateway} />
              <Row label="Netmask" value={infra.network.netmask} />
              <Row label="DNS Servers" value={infra.network.dnsServers?.join(', ')} />
              <Row label="NTP Server" value={infra.network.ntpServer} />
              <Row label="SMTP Server" value={infra.network.smtpServer} />
            </Section>
          )}

          {infra?.server && (
            <Section title="Server / Infrastructure">
              <Row label="CPU Cores" value={infra.server.cpuCores?.toString()} />
              <Row label="RAM" value={infra.server.ramGB ? `${infra.server.ramGB} GB` : undefined} />
              <Row label="Storage" value={infra.server.storageGB ? `${infra.server.storageGB} GB` : undefined} />
              <Row label="Hypervisor" value={infra.hypervisor?.type} />
            </Section>
          )}

          {deployment.notes && (
            <Section title="Notes">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{deployment.notes}</p>
            </Section>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <LicenseRequestsTab
          deploymentId={deployment.id}
          clientName={deployment.clientName}
          onOpenRequestModal={() => setLicenseModalOpen(true)}
        />
      )}

      {/* Request License Modal */}
      <RequestLicenseModal
        isOpen={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        deploymentId={deployment.id}
        clientName={deployment.clientName}
        deployment={deployment}
        onSuccess={() => {
          setLicenseModalOpen(false);
          handleTabChange('requests');
        }}
      />
    </div>
  );
}
