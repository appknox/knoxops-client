import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { notificationsApi } from '@/api';
import type { OnpremDeployment } from '@/types';

interface PatchAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: OnpremDeployment | null;
  onSent: (clientName: string) => void;
}

const PatchAlertModal = ({ isOpen, onClose, deployment, onSent }: PatchAlertModalProps) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!deployment?.nextScheduledPatchDate) return null;

  const patchDate = new Date(deployment.nextScheduledPatchDate);
  const days = Math.ceil(
    (patchDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const dateLabel = patchDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const isOverdue = days < 0;
  const modalTitle = isOverdue ? '⚠️ Patch Overdue' : days === 0 ? '🚨 Due Today' : '🔔 Upcoming Patch';
  const titleColor = isOverdue ? 'text-red-600' : days === 0 ? 'text-red-500' : 'text-orange-500';
  const buttonLabel = isOverdue ? '🔴 Send Overdue Alert' : days === 0 ? '🚨 Send Urgent Alert' : '🔔 Send Patch Reminder';

  const handleSendAlert = async () => {
    setIsSending(true);
    setError(null);
    try {
      await notificationsApi.triggerDeploymentNotification(deployment.id);
      onClose();
      onSent(deployment.clientName);
    } catch (err) {
      console.error('Failed to send Slack alert:', err);
      setError('Failed to send Slack alert. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl">{isOverdue ? '⚠️' : days === 0 ? '🚨' : '🔔'}</div>
          <div>
            <h2 className={`text-lg font-semibold ${titleColor}`}>{modalTitle}</h2>
            <p className="text-sm text-gray-600">{deployment.clientName}</p>
          </div>
        </div>

        {/* Overdue notice */}
        {isOverdue && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              This patch was due {Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} ago and has not been recorded yet.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-xs text-gray-500 uppercase">Scheduled</p>
              <p className="text-sm font-medium text-gray-900">{dateLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg">⏰</span>
            <div>
              <p className="text-xs text-gray-500 uppercase">Due in</p>
              <p className="text-sm font-medium text-gray-900">
                {days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {deployment.currentVersion && (
            <div className="flex items-start gap-3">
              <span className="text-lg">🔖</span>
              <div>
                <p className="text-xs text-gray-500 uppercase">Version</p>
                <p className="text-sm font-medium text-gray-900">v{deployment.currentVersion}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="text-lg">🖥</span>
            <div>
              <p className="text-xs text-gray-500 uppercase">Environment</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{deployment.environmentType}</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendAlert}
            isLoading={isSending}
            variant={isOverdue ? 'danger' : 'primary'}
            className="flex-1"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { PatchAlertModal };
