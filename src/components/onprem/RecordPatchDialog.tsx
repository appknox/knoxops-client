import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { onpremApi } from '@/api';
import type { OnpremDeployment } from '@/types';

interface RecordPatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: OnpremDeployment | null;
  onSuccess: () => void;
}

const RecordPatchDialog = ({ isOpen, onClose, deployment, onSuccess }: RecordPatchDialogProps) => {
  const [patchDate, setPatchDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newVersion, setNewVersion] = useState('');
  const [nextScheduledPatchDate, setNextScheduledPatchDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!deployment) return;
    if (!patchDate) {
      setError('Patch date is required');
      return;
    }
    if (!nextScheduledPatchDate) {
      setError('Next scheduled patch date is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onpremApi.recordPatch(deployment.id, {
        patchDate,
        newVersion: newVersion || undefined,
        nextScheduledPatchDate,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to record patch:', err);
      setError('Failed to record patch deployment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPatchDate(new Date().toISOString().split('T')[0]);
    setNewVersion('');
    setNextScheduledPatchDate('');
    setError('');
    onClose();
  };

  if (!deployment) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Patch Deployment</h2>
        <p className="text-sm text-gray-600 mb-6">
          Record patch deployment for <span className="font-medium">{deployment.clientName}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patch Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={patchDate}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Version <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 2.5.0"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Scheduled Patch Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={nextScheduledPatchDate}
              onChange={(e) => setNextScheduledPatchDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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
