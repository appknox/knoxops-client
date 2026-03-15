import { Badge } from '@/components/ui';
import type { ClientStatus, DeploymentStatus, EnvironmentType } from '@/types';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

const ClientStatusBadge = ({ status }: ClientStatusBadgeProps) => {
  const variants: Record<ClientStatus, 'success' | 'danger'> = {
    active: 'success',
    inactive: 'danger',
  };

  const labels: Record<ClientStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

interface DeploymentStatusBadgeProps {
  status: DeploymentStatus;
}

const DeploymentStatusBadge = ({ status }: DeploymentStatusBadgeProps) => {
  const variants: Record<DeploymentStatus, 'success' | 'warning' | 'danger' | 'default'> = {
    healthy: 'success',
    degraded: 'warning',
    offline: 'danger',
    maintenance: 'warning',
    provisioning: 'default',
    decommissioned: 'danger',
  };

  const labels: Record<DeploymentStatus, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    offline: 'Offline',
    maintenance: 'Maintenance',
    provisioning: 'Provisioning',
    decommissioned: 'Decommissioned',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

interface EnvironmentTypeBadgeProps {
  type: EnvironmentType;
}

const EnvironmentTypeBadge = ({ type }: EnvironmentTypeBadgeProps) => {
  const variants: Record<EnvironmentType, 'default' | 'success'> = {
    poc: 'default',
    production: 'success',
  };

  const labels: Record<EnvironmentType, string> = {
    poc: 'POC',
    production: 'Production',
  };

  return <Badge variant={variants[type]}>{labels[type]}</Badge>;
};

export { ClientStatusBadge, DeploymentStatusBadge, EnvironmentTypeBadge };
