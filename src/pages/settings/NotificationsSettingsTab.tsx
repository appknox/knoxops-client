import { useEffect, useState } from 'react';
import { Button, Input, Select, Card, CardBody } from '@/components/ui';
import { useAppSettingsStore } from '@/stores/appSettingsStore';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { SETTING_KEYS } from '@/constants/settingKeys';

const NotificationsSettingsTab = () => {
  const { settings, isLoading, isSaving, error, fetchSettings, updateSettings, clearError } = useAppSettingsStore();
  const [patchDaysAhead, setPatchDaysAhead] = useState('10');
  const [patchOverdueDays, setPatchOverdueDays] = useState('30');
  const [notificationHourUtc, setNotificationHourUtc] = useState('23');
  const [patchRemindersEnabled, setPatchRemindersEnabled] = useState(true);
  const [deviceCheckinEnabled, setDeviceCheckinEnabled] = useState(true);
  const [deviceCheckoutEnabled, setDeviceCheckoutEnabled] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setPatchDaysAhead(settings[SETTING_KEYS.PATCH_REMINDER_DAYS_AHEAD] || '10');
    setPatchOverdueDays(settings[SETTING_KEYS.PATCH_REMINDER_OVERDUE_DAYS] || '30');
    setNotificationHourUtc(settings[SETTING_KEYS.NOTIFICATION_SCHEDULE_HOUR_UTC] || '23');
    setPatchRemindersEnabled(settings[SETTING_KEYS.PATCH_REMINDERS_ENABLED] !== 'false');
    setDeviceCheckinEnabled(settings[SETTING_KEYS.DEVICE_CHECKIN_DIGEST_ENABLED] !== 'false');
    setDeviceCheckoutEnabled(settings[SETTING_KEYS.DEVICE_CHECKOUT_DIGEST_ENABLED] !== 'false');
  }, [settings]);

  const handleSave = async () => {
    clearError();
    setNotification(null);
    try {
      await updateSettings({
        [SETTING_KEYS.PATCH_REMINDER_DAYS_AHEAD]: patchDaysAhead,
        [SETTING_KEYS.PATCH_REMINDER_OVERDUE_DAYS]: patchOverdueDays,
        [SETTING_KEYS.NOTIFICATION_SCHEDULE_HOUR_UTC]: notificationHourUtc,
        [SETTING_KEYS.PATCH_REMINDERS_ENABLED]: String(patchRemindersEnabled),
        [SETTING_KEYS.DEVICE_CHECKIN_DIGEST_ENABLED]: String(deviceCheckinEnabled),
        [SETTING_KEYS.DEVICE_CHECKOUT_DIGEST_ENABLED]: String(deviceCheckoutEnabled),
      });
      setNotification({ type: 'success', message: 'Notification settings updated successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: error || 'Failed to update settings' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading settings...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: `${String(i).padStart(2, '0')}:00 UTC`,
  }));

  const daysOptions = [
    { value: '7', label: '7 days' },
    { value: '10', label: '10 days' },
    { value: '14', label: '14 days' },
    { value: '21', label: '21 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
  ];

  return (
    <Card>
      <CardBody>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Notifications</h2>

        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex gap-3 ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{notification.message}</p>
          </div>
        )}

        {/* Schedule Section */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Schedule</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daily Run Time</label>
            <Select
              label=""
              options={hourOptions}
              value={notificationHourUtc}
              onChange={(e) => setNotificationHourUtc(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">All scheduled jobs run at this time UTC</p>
          </div>
        </div>

        {/* Patch Reminders Section */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Patch Reminders</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="patch-reminders-enabled"
                checked={patchRemindersEnabled}
                onChange={(e) => setPatchRemindersEnabled(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label htmlFor="patch-reminders-enabled" className="text-sm font-medium text-gray-700">
                Enable automated patch reminders
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start reminding X days before patch date</label>
              <Select
                label=""
                options={daysOptions}
                value={patchDaysAhead}
                onChange={(e) => setPatchDaysAhead(e.target.value)}
                disabled={!patchRemindersEnabled}
              />
              <p className="text-xs text-gray-500 mt-1">Notifications will start this many days before the scheduled patch</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stop reminding X days after overdue</label>
              <Select
                label=""
                options={[...daysOptions, { value: '90', label: '90 days' }]}
                value={patchOverdueDays}
                onChange={(e) => setPatchOverdueDays(e.target.value)}
                disabled={!patchRemindersEnabled}
              />
              <p className="text-xs text-gray-500 mt-1">Continue sending overdue alerts for up to this many days past the patch date</p>
            </div>
          </div>
        </div>

        {/* Device Digests Section */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Device Digests</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="device-checkin-enabled"
                checked={deviceCheckinEnabled}
                onChange={(e) => setDeviceCheckinEnabled(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label htmlFor="device-checkin-enabled" className="text-sm font-medium text-gray-700">
                Enable daily device check-in digest
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="device-checkout-enabled"
                checked={deviceCheckoutEnabled}
                onChange={(e) => setDeviceCheckoutEnabled(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label htmlFor="device-checkout-enabled" className="text-sm font-medium text-gray-700">
                Enable daily device check-out digest
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPatchDaysAhead(settings[SETTING_KEYS.PATCH_REMINDER_DAYS_AHEAD] || '10');
              setPatchOverdueDays(settings[SETTING_KEYS.PATCH_REMINDER_OVERDUE_DAYS] || '30');
              setNotificationHourUtc(settings[SETTING_KEYS.NOTIFICATION_SCHEDULE_HOUR_UTC] || '23');
              setPatchRemindersEnabled(settings[SETTING_KEYS.PATCH_REMINDERS_ENABLED] !== 'false');
              setDeviceCheckinEnabled(settings[SETTING_KEYS.DEVICE_CHECKIN_DIGEST_ENABLED] !== 'false');
              setDeviceCheckoutEnabled(settings[SETTING_KEYS.DEVICE_CHECKOUT_DIGEST_ENABLED] !== 'false');
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export { NotificationsSettingsTab };
