import { useEffect, useState } from 'react';
import { AlertCircle, Smartphone, Loader2, Check, X, Usb } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { UsbDetectResult, UsbDeviceInfo } from '@/api/deviceUsb';
import { devicesApi } from '@/api/devices';
import { detectAndroidViaWebUsb, isWebUsbSupported } from '@/lib/webusb-adb';
import { iosAgent, isAgentRunning } from '@/lib/ios-agent';

interface FetchDeviceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onFetched: (info: UsbDeviceInfo) => void;
  currentDeviceId?: string;
  currentSerialNumber?: string;
  expectedPlatform?: string;
}

type Step = 1 | 2 | 3;

export const FetchDeviceWizard = ({
  isOpen,
  onClose,
  onFetched,
  currentDeviceId: _currentDeviceId,
  currentSerialNumber,
  expectedPlatform,
}: FetchDeviceWizardProps) => {
  const [step, setStep] = useState<Step>(1);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [detectedDevice, setDetectedDevice] = useState<UsbDetectResult | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<UsbDeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialConflict, setSerialConflict] = useState<{
    deviceId: string;
    deviceName: string | null;
  } | null>(null);

  const webUsbSupported = isWebUsbSupported();
  const [agentAvailable, setAgentAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      isAgentRunning().then(setAgentAvailable);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPlatform(null);
      setDetectedDevice(null);
      setDeviceInfo(null);
      setIsLoading(false);
      setError(null);
      setSerialConflict(null);
    }
  }, [isOpen]);

  // ── Android via WebUSB ────────────────────────────────────────────────────

  const handleDetectAndroid = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (expectedPlatform && expectedPlatform.toLowerCase() !== 'android') {
        setError(`Platform mismatch: this device is registered as ${expectedPlatform} but you selected Android.`);
        return;
      }

      const info = await detectAndroidViaWebUsb();

      const deviceInfoNorm: UsbDeviceInfo = { ...info };
      setDeviceInfo(deviceInfoNorm);

      if (info.serialNumber) {
        const isSameSerial = info.serialNumber === currentSerialNumber;
        if (!isSameSerial) {
          const check = await devicesApi.checkSerial(info.serialNumber);
          if (check.exists) {
            setSerialConflict({ deviceId: check.deviceId!, deviceName: check.deviceName });
          }
        }
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to detect Android device via WebUSB.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── iOS via local agent ───────────────────────────────────────────────────

  const handleDetectIos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (expectedPlatform && expectedPlatform.toLowerCase() !== 'ios') {
        setError(`Platform mismatch: this device is registered as ${expectedPlatform} but you selected iPhone.`);
        return;
      }

      const running = await isAgentRunning();
      setAgentAvailable(running);
      if (!running) {
        setError(
          'KnoxOps Agent is not running on this machine.\n\nStart it with:\n  cd agent && npm install && npm start'
        );
        return;
      }

      const { device } = await iosAgent.detect();
      if (device) {
        setDetectedDevice(device as UsbDetectResult);
        setPlatform('ios');
        setStep(2);
      } else {
        setError('No iOS device detected. Keep screen unlocked and use an original Apple cable.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect device.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePairIos = async () => {
    if (!detectedDevice) return;
    setIsLoading(true);
    setError(null);
    try {
      await iosAgent.pair(detectedDevice.id);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to authorize device.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchIosInfo = async () => {
    if (!detectedDevice) return;
    setIsLoading(true);
    setError(null);
    try {
      const info = await iosAgent.fetch(detectedDevice.id);
      setDeviceInfo(info as UsbDeviceInfo);

      if (info.serialNumber) {
        const isSameSerial = info.serialNumber === currentSerialNumber;
        if (!isSameSerial) {
          const check = await devicesApi.checkSerial(info.serialNumber);
          if (check.exists) {
            setSerialConflict({ deviceId: check.deviceId!, deviceName: check.deviceName });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch device information.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3 && platform === 'ios' && !deviceInfo && !isLoading) {
      handleFetchIosInfo();
    }
  }, [step]);

  const handleUseInfo = () => {
    if (deviceInfo) {
      onFetched(deviceInfo);
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setError(null);
      setStep((s) => (s - 1) as Step);
    }
  };

  const stepLabel = step === 1 ? 'Select Platform' : step === 2 ? 'Authorize Device' : 'Device Info';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Step {step} of 3 · {stepLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step 1: Platform selection ── */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Connect your device via USB cable and select the platform below.
            </p>

            {/* Android — WebUSB */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🤖</span>
                <span className="font-medium text-gray-900">Android</span>
                {webUsbSupported && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    WebUSB
                  </span>
                )}
              </div>
              {webUsbSupported ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Enable <strong>USB Debugging</strong> in Developer Options</li>
                    <li>• Connect cable and tap <strong>Allow</strong> when prompted</li>
                    <li>• Chrome/Edge will show a device picker</li>
                  </ul>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    WebUSB requires Chrome or Edge browser over HTTPS or localhost.
                  </p>
                </div>
              )}
              <Button
                type="button"
                onClick={handleDetectAndroid}
                isLoading={isLoading}
                disabled={!webUsbSupported}
                className="w-full flex items-center justify-center gap-2"
              >
                <Usb className="h-4 w-4" />
                Connect Android via WebUSB
              </Button>
            </div>

            {/* iOS — local agent */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🍎</span>
                <span className="font-medium text-gray-900">iPhone (iOS)</span>
                {agentAvailable === true && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Agent running</span>
                )}
                {agentAvailable === false && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Agent offline</span>
                )}
              </div>
              {agentAvailable === false ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-700">KnoxOps Agent required</p>
                  <p className="text-xs text-amber-800">Run on this machine:</p>
                  <code className="block text-xs bg-amber-100 rounded px-2 py-1 font-mono">
                    brew install libimobiledevice
                  </code>
                  <code className="block text-xs bg-amber-100 rounded px-2 py-1 font-mono">
                    cd agent && npm install && npm start
                  </code>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Keep screen on and unlocked</li>
                    <li>• Use an original Apple cable</li>
                  </ul>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleDetectIos}
                isLoading={isLoading}
                className="w-full"
              >
                Connect iPhone
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 space-y-1">
                  {error.split('\n').map((line, i) =>
                    line.startsWith('  ') ? (
                      <code key={i} className="block bg-red-100 rounded px-2 py-0.5 font-mono text-xs">
                        {line.trim()}
                      </code>
                    ) : (
                      <p key={i}>{line}</p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: iOS authorize ── */}
        {step === 2 && platform === 'ios' && (
          <div className="space-y-4">
            <div className="py-6 text-center">
              <div className="text-2xl mb-4">🔒</div>
              <p className="font-medium text-gray-900 mb-2">
                iPhone detected {detectedDevice?.name ? `(${detectedDevice.name})` : ''}
              </p>
              <p className="text-sm text-gray-600 mt-4 mb-4">
                A "Trust This Computer?" prompt will appear on your iPhone.
              </p>
              <ol className="text-sm text-gray-600 space-y-2 text-left max-w-xs mx-auto">
                <li>1. Unlock your iPhone</li>
                <li>2. Tap "Trust" when prompted</li>
                <li>3. Enter your passcode if asked</li>
              </ol>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                ← Back
              </Button>
              <Button type="button" onClick={handlePairIos} isLoading={isLoading}>
                I've Tapped Trust →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Device info ── */}
        {step === 3 && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-700">Fetching device information...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    ← Back
                  </Button>
                  {platform === 'ios' && (
                    <Button type="button" onClick={handleFetchIosInfo}>
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ) : deviceInfo ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Device information retrieved successfully
                  </p>
                </div>
                {serialConflict && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Serial number already registered as <strong>{serialConflict.deviceId}</strong>
                      {serialConflict.deviceName ? ` (${serialConflict.deviceName})` : ''}.
                      You can still view the info but prefill is disabled.
                    </p>
                  </div>
                )}
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  {[
                    { label: 'Name', value: deviceInfo.name },
                    { label: 'Model', value: deviceInfo.model },
                    { label: 'Platform', value: deviceInfo.platform },
                    { label: 'OS Version', value: deviceInfo.osVersion },
                    { label: 'Serial', value: deviceInfo.serialNumber },
                    { label: 'UDID', value: deviceInfo.udid },
                    { label: 'Model No.', value: deviceInfo.modelNumber },
                    { label: 'CPU Arch', value: deviceInfo.cpuArch },
                    { label: 'ROM', value: deviceInfo.rom },
                    { label: 'IMEI 1', value: deviceInfo.imei },
                    { label: 'IMEI 2', value: deviceInfo.imei2 },
                    { label: 'MAC Address', value: deviceInfo.macAddress },
                    { label: 'SIM (ICCID)', value: deviceInfo.simNumber },
                  ]
                    .filter((row) => row.value)
                    .map((row) => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-gray-600">{row.label}:</span>
                        <span className="font-medium text-gray-900 truncate max-w-[220px]">{row.value}</span>
                      </div>
                    ))}
                </div>
                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    ← Back
                  </Button>
                  <Button type="button" onClick={handleUseInfo} disabled={!!serialConflict}>
                    Use This Info →
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
};
