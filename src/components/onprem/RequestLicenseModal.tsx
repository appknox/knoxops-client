import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { useOnpremLicenseRequestStore } from '@/stores/onpremLicenseRequestStore';
import type { OnpremDeployment } from '@/types';
import type { LicenseRequestType } from '@/types/onprem-license-request.types';

interface RequestLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentId: string;
  clientName: string;
  deployment?: OnpremDeployment | null;
  onSuccess?: () => void;
}

const dateInput = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const errorClass = 'mt-1 text-xs text-red-600';

function toDateInputValue(date?: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function threeMonthsLater(dateStr: string): boolean {
  if (!dateStr) return true;
  return true; // validated on submit
}

export function RequestLicenseModal({
  isOpen,
  onClose,
  deploymentId,
  clientName,
  deployment,
  onSuccess,
}: RequestLicenseModalProps) {
  const { createRequest } = useOnpremLicenseRequestStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [requestType, setRequestType] = useState<LicenseRequestType>('license_renewal');
  const [targetVersion, setTargetVersion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numberOfProjects, setNumberOfProjects] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill all fields from deployment on open
  useEffect(() => {
    if (isOpen && deployment) {
      setTargetVersion(deployment.currentVersion || '');
      setStartDate(toDateInputValue(deployment.license?.startDate));
      setEndDate(toDateInputValue(deployment.license?.endDate));
      setNumberOfProjects(String(deployment.license?.numberOfApps || ''));
      setFingerprint((deployment.infrastructure as any)?.fingerprint || '');
    }
  }, [isOpen, deployment]);

  const handleClose = () => {
    setRequestType('license_renewal');
    setTargetVersion('');
    setStartDate('');
    setEndDate('');
    setNumberOfProjects('');
    setFingerprint('');
    setNotes('');
    setErrors({});
    setServerError(null);
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!targetVersion.trim()) errs.targetVersion = 'Version is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (!numberOfProjects || Number(numberOfProjects) < 1) {
      errs.numberOfProjects = 'Number of projects must be at least 1';
    }
    if (!fingerprint.trim()) errs.fingerprint = 'Fingerprint is required';

    if (startDate && endDate) {
      const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      if (diffMonths < 3) {
        errs.endDate = 'End date must be at least 3 months after start date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);
    try {
      await createRequest(deploymentId, {
        requestType,
        targetVersion: targetVersion.trim(),
        licenseStartDate: new Date(startDate).toISOString(),
        licenseEndDate: new Date(endDate).toISOString(),
        numberOfProjects: Number(numberOfProjects),
        fingerprint: fingerprint.trim(),
        notes: notes.trim() || undefined,
      });
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      setServerError(
        error.response?.data?.error || error.message || 'Failed to submit request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Licence Key" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 p-6">

        {/* Client */}
        <div>
          <label className={labelClass}>Client</label>
          <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-900">
            {clientName}
          </div>
        </div>

        {/* Request Type */}
        <div>
          <label className={labelClass}>Request Type *</label>
          <div className="flex gap-4">
            {(['license_renewal', 'patch_update'] as LicenseRequestType[]).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  value={type}
                  checked={requestType === type}
                  onChange={() => setRequestType(type)}
                  className="accent-primary-600"
                />
                <span className="text-sm text-gray-700">
                  {type === 'license_renewal' ? 'License Renewal' : 'Patch Update'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Version */}
        <div>
          <label className={labelClass}>Version *</label>
          <input
            type="text"
            value={targetVersion}
            onChange={(e) => setTargetVersion(e.target.value)}
            placeholder="e.g. 2.1.4"
            className={dateInput}
          />
          {errors.targetVersion && <p className={errorClass}>{errors.targetVersion}</p>}
        </div>

        {/* License Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>License Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={dateInput}
            />
            {errors.startDate && <p className={errorClass}>{errors.startDate}</p>}
          </div>
          <div>
            <label className={labelClass}>License End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={dateInput}
            />
            {errors.endDate && <p className={errorClass}>{errors.endDate}</p>}
          </div>
        </div>

        {/* Number of Projects */}
        <div>
          <label className={labelClass}>Number of Projects *</label>
          <input
            type="number"
            min="1"
            value={numberOfProjects}
            onChange={(e) => setNumberOfProjects(e.target.value)}
            placeholder="e.g. 5"
            className={dateInput}
          />
          {errors.numberOfProjects && <p className={errorClass}>{errors.numberOfProjects}</p>}
        </div>

        {/* Fingerprint */}
        <div>
          <label className={labelClass}>Fingerprint *</label>
          <input
            type="text"
            value={fingerprint}
            onChange={(e) => setFingerprint(e.target.value)}
            placeholder="Deployment fingerprint"
            className={dateInput}
          />
          {errors.fingerprint && <p className={errorClass}>{errors.fingerprint}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this request..."
            rows={3}
            className={dateInput}
          />
        </div>

        {/* Server error */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
