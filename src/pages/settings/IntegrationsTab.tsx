import { useEffect, useState } from 'react';
import { Button, Input, Card, CardBody } from '@/components/ui';
import { useAppSettingsStore } from '@/stores/appSettingsStore';
import { Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { SETTING_KEYS } from '@/constants/settingKeys';

const IntegrationsTab = () => {
  const { settings, isLoading, isSaving, error, fetchSettings, updateSettings, testSlackWebhook, clearError } = useAppSettingsStore();
  const [slackOnpremUrl, setSlackOnpremUrl] = useState('');
  const [slackDeviceUrl, setSlackDeviceUrl] = useState('');
  const [showOnpremUrl, setShowOnpremUrl] = useState(false);
  const [showDeviceUrl, setShowDeviceUrl] = useState(false);
  const [testingChannel, setTestingChannel] = useState<'onprem' | 'device' | null>(null);
  const [testSuccess, setTestSuccess] = useState<'onprem' | 'device' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setSlackOnpremUrl(settings[SETTING_KEYS.SLACK_ONPREM_WEBHOOK_URL] || '');
    setSlackDeviceUrl(settings[SETTING_KEYS.SLACK_DEVICE_WEBHOOK_URL] || '');
  }, [settings]);

  const handleSave = async () => {
    clearError();
    setNotification(null);
    try {
      await updateSettings({
        [SETTING_KEYS.SLACK_ONPREM_WEBHOOK_URL]: slackOnpremUrl,
        [SETTING_KEYS.SLACK_DEVICE_WEBHOOK_URL]: slackDeviceUrl,
      });
      setNotification({ type: 'success', message: 'Webhook URLs updated successfully' });
      setTestSuccess(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: error || 'Failed to update settings' });
    }
  };

  const handleTestWebhook = async (channel: 'onprem' | 'device') => {
    clearError();
    setNotification(null);
    setTestingChannel(channel);
    try {
      await testSlackWebhook(channel);
      setTestSuccess(channel);
      setNotification({ type: 'success', message: `Test notification sent to ${channel} channel` });
      setTimeout(() => setTestSuccess(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: error || 'Failed to send test notification' });
    } finally {
      setTestingChannel(null);
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

  return (
    <Card>
      <CardBody>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Integrations</h2>

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

        {/* Slack Webhooks Section */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Slack Webhooks</h3>

          <div className="space-y-4">
            {/* OnPrem Webhook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                On-Prem Webhook URL
              </label>
              <div className="relative">
                <Input
                  type={showOnpremUrl ? 'text' : 'password'}
                  value={slackOnpremUrl}
                  onChange={(e) => setSlackOnpremUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/YOUR/ONPREM/WEBHOOK"
                />
                <button
                  type="button"
                  onClick={() => setShowOnpremUrl((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showOnpremUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for patch reminders and licence request notifications</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => handleTestWebhook('onprem')}
                disabled={testingChannel === 'onprem' || !slackOnpremUrl}
                isLoading={testingChannel === 'onprem'}
              >
                Test Webhook
              </Button>
            </div>

            {/* Device Webhook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Webhook URL
              </label>
              <div className="relative">
                <Input
                  type={showDeviceUrl ? 'text' : 'password'}
                  value={slackDeviceUrl}
                  onChange={(e) => setSlackDeviceUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/YOUR/DEVICE/WEBHOOK"
                />
                <button
                  type="button"
                  onClick={() => setShowDeviceUrl((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showDeviceUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for device check-in/out digests and device request notifications</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => handleTestWebhook('device')}
                disabled={testingChannel === 'device' || !slackDeviceUrl}
                isLoading={testingChannel === 'device'}
              >
                Test Webhook
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => { setSlackOnpremUrl(settings[SETTING_KEYS.SLACK_ONPREM_WEBHOOK_URL] || ''); setSlackDeviceUrl(settings[SETTING_KEYS.SLACK_DEVICE_WEBHOOK_URL] || ''); }}>
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

export { IntegrationsTab };
