import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { onpremApi } from '@/api';
import type { OnpremDeployment } from '@/types';

interface RecordPatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: OnpremDeployment | null;
  onSuccess: () => void;
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm';
const inputErrorClass = 'w-full px-3 py-2 border border-red-400 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const errorClass = 'mt-1 text-xs text-red-600';

function toDateInputValue(date?: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

const RecordPatchDialog = ({ isOpen, onClose, deployment, onSuccess }: RecordPatchDialogProps) => {
  const [patchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newVersion, setNewVersion] = useState('');
  const [nextScheduledPatchDate, setNextScheduledPatchDate] = useState('');
  const [licenseStartDate, setLicenseStartDate] = useState('');
  const [licenseEndDate, setLicenseEndDate] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isOpen && deployment) {
      setNewVersion(deployment.currentVersion || '');
      setLicenseStartDate(toDateInputValue(deployment.license?.startDate));
      setLicenseEndDate(toDateInputValue(deployment.license?.endDate));
      setFingerprint((deployment.infrastructure as any)?.fingerprint || '');
    }
  }, [isOpen, deployment]);

  const isValidDate = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minNextPatch = new Date(today);
    minNextPatch.setDate(minNextPatch.getDate() + 30);

    if (!nextScheduledPatchDate) {
      errs.nextScheduledPatchDate = 'Next scheduled patch date is required';
    } else if (!isValidDate(nextScheduledPatchDate)) {
      errs.nextScheduledPatchDate = 'Enter a valid date';
    } else if (new Date(nextScheduledPatchDate) < minNextPatch) {
      errs.nextScheduledPatchDate = 'Next patch date must be at least 30 days from today';
    }

    if (!licenseStartDate) {
      errs.licenseStartDate = 'License start date is required';
    } else if (!isValidDate(licenseStartDate)) {
      errs.licenseStartDate = 'Enter a valid date';
    }

    if (!licenseEndDate) {
      errs.licenseEndDate = 'License end date is required';
    } else if (!isValidDate(licenseEndDate)) {
      errs.licenseEndDate = 'Enter a valid date';
    } else if (licenseStartDate && isValidDate(licenseStartDate)) {
      const diffMs = new Date(licenseEndDate).getTime() - new Date(licenseStartDate).getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      if (diffMonths < 3) {
        errs.licenseEndDate = 'License end date must be at least 3 months after start date';
      }
    }

    if (!fingerprint.trim()) errs.fingerprint = 'Fingerprint is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!deployment) return;
    if (!validate()) return;

    setIsLoading(true);
    setServerError('');
    try {
      await Promise.all([
        onpremApi.recordPatch(deployment.id, {
          patchDate,
          newVersion: newVersion || undefined,
          nextScheduledPatchDate,
        }),
        onpremApi.update(deployment.id, {
          license: {
            ...deployment.license,
            startDate: licenseStartDate || undefined,
            endDate: licenseEndDate || undefined,
          },
          infrastructure: {
            ...deployment.infrastructure,
            fingerprint: fingerprint || undefined,
          },
        }),
      ]);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to record patch:', err);
      setServerError('Failed to record patch deployment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewVersion('');
    setNextScheduledPatchDate('');
    setLicenseStartDate('');
    setLicenseEndDate('');
    setFingerprint('');
    setErrors({});
    setServerError('');
    onClose();
  };

  if (!deployment) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Record Patch Deployment</h2>
        <p className="text-sm text-gray-600 mb-6">
          Record patch deployment for <span className="font-medium">{deployment.clientName}</span>
        </p>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="space-y-4">
          {/* Patch details */}
          <div>
            <label className={labelClass}>
              Patch Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={patchDate}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
            />
          </div>

          <div>
            <label className={labelClass}>
              New Version <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 2.5.0"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Next Scheduled Patch Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={nextScheduledPatchDate}
              onChange={(e) => { setNextScheduledPatchDate(e.target.value); setErrors((p) => ({ ...p, nextScheduledPatchDate: '' })); }}
              className={errors.nextScheduledPatchDate ? inputErrorClass : inputClass}
            />
            {errors.nextScheduledPatchDate && <p className={errorClass}>{errors.nextScheduledPatchDate}</p>}
          </div>

          {/* License & Infrastructure */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              License &amp; Infrastructure
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    License Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={licenseStartDate}
                    onChange={(e) => { setLicenseStartDate(e.target.value); setErrors((p) => ({ ...p, licenseStartDate: '', licenseEndDate: '' })); }}
                    className={errors.licenseStartDate ? inputErrorClass : inputClass}
                  />
                  {errors.licenseStartDate && <p className={errorClass}>{errors.licenseStartDate}</p>}
                </div>
                <div>
                  <label className={labelClass}>
                    License End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={licenseEndDate}
                    onChange={(e) => { setLicenseEndDate(e.target.value); setErrors((p) => ({ ...p, licenseEndDate: '' })); }}
                    className={errors.licenseEndDate ? inputErrorClass : inputClass}
                  />
                  {errors.licenseEndDate && <p className={errorClass}>{errors.licenseEndDate}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Fingerprint <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Deployment fingerprint"
                  value={fingerprint}
                  onChange={(e) => { setFingerprint(e.target.value); setErrors((p) => ({ ...p, fingerprint: '' })); }}
                  className={errors.fingerprint ? inputErrorClass : inputClass}
                />
                {errors.fingerprint && <p className={errorClass}>{errors.fingerprint}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Record Patch
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { RecordPatchDialog };
