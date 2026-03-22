import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { notificationsApi } from '@/api';
import type { UpcomingPatch } from '@/api/notifications';

const NotificationsTab = () => {
  const [daysAhead, setDaysAhead] = useState(10);
  const [patches, setPatches] = useState<UpcomingPatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchPatches = async () => {
      setIsLoading(true);
      setSelectedIds(new Set());
      try {
        const data = await notificationsApi.previewPatchReminders(daysAhead);
        setPatches(data.upcomingPatches);
      } catch (error) {
        console.error('Failed to load patches:', error);
        setNotification({ type: 'error', message: 'Failed to load upcoming patches' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatches();
  }, [daysAhead]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const allSelected = patches.length > 0 && selectedIds.size === patches.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(patches.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendNow = () => {
    if (selectedIds.size === 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setIsSending(true);
    try {
      await notificationsApi.triggerPatchReminders(Array.from(selectedIds));
      setNotification({
        type: 'success',
        message: `Notification sent for ${selectedIds.size} client${selectedIds.size > 1 ? 's' : ''}`,
      });
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to send notification:', error);
      setNotification({ type: 'error', message: 'Failed to send notification' });
    } finally {
      setIsSending(false);
    }
  };

  const getUrgency = (days: number) => {
    if (days <= 3) return { emoji: '🔴', label: 'Critical', className: 'bg-red-100 text-red-700' };
    if (days <= 7) return { emoji: '🟡', label: 'Soon', className: 'bg-yellow-100 text-yellow-700' };
    return { emoji: '🟢', label: 'Upcoming', className: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Slack Notifications</h2>
        <p className="text-sm text-gray-600">
          Patch reminders sent daily at 9:00 AM to the configured Slack channel. Showing patches due within{' '}
          <select
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
            className="inline-block px-2 py-1 rounded border border-gray-300 text-sm"
          >
            <option value={7}>7</option>
            <option value={10}>10</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
          </select>{' '}
          days.
        </p>
      </div>

      {notification && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <AlertCircle
            className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              notification.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          />
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {notification.message}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
          </div>
        </div>
      ) : patches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No upcoming patches in the next {daysAhead} days.</p>
        </div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Environment</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Version</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patches.map((patch) => {
                const urgency = getUrgency(patch.daysUntilPatch);
                const formattedDate = new Date(patch.nextScheduledPatchDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const checked = selectedIds.has(patch.id);

                return (
                  <tr
                    key={patch.id}
                    className={`hover:bg-gray-50 cursor-pointer ${checked ? 'bg-primary-50' : ''}`}
                    onClick={() => toggleOne(patch.id)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(patch.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{patch.clientName}</td>
                    <td className="px-4 py-3 text-gray-600">{patch.environmentType}</td>
                    <td className="px-4 py-3 text-gray-600">{patch.currentVersion || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{formattedDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${urgency.className}`}>
                        {urgency.emoji} {urgency.label} ({patch.daysUntilPatch}d)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {selectedIds.size > 0
            ? `${selectedIds.size} of ${patches.length} client${patches.length > 1 ? 's' : ''} selected`
            : patches.length > 0
            ? 'Select clients to send notifications'
            : ''}
        </p>
        <Button
          onClick={handleSendNow}
          disabled={isLoading || isSending || selectedIds.size === 0}
          isLoading={isSending}
        >
          Send Now
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="Send Slack Notification"
        message={`Send patch reminders for ${selectedIds.size} selected client${selectedIds.size > 1 ? 's' : ''}?`}
        confirmLabel="Send"
        variant="warning"
        isLoading={isSending}
      />
    </div>
  );
};

export { NotificationsTab };
