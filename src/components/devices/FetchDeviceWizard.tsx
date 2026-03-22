import { useEffect, useState } from 'react';
import { AlertCircle, Smartphone, Loader2, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { deviceUsbApi, type UsbDetectResult, type UsbDeviceInfo } from '@/api/deviceUsb';
import { devicesApi } from '@/api/devices';

interface FetchDeviceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onFetched: (info: UsbDeviceInfo) => void;
}

export const FetchDeviceWizard = ({ isOpen, onClose, onFetched }: FetchDeviceWizardProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [detectedDevice, setDetectedDevice] = useState<UsbDetectResult | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<UsbDeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialConflict, setSerialConflict] = useState<{
    deviceId: string;
    deviceName: string | null;
  } | null>(null);

  // Reset state when wizard opens
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

  const handleDetect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await deviceUsbApi.detect();
      if (result) {
        setDetectedDevice(result);
        setPlatform(result.platform);
        setStep(2);
      } else {
        setError('No device detected. For iPhone: keep screen unlocked. For Android: ensure USB Debugging is enabled in Developer Options.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect device.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePair = async () => {
    if (!platform || !detectedDevice) return;
    setIsLoading(true);
    setError(null);
    try {
      await deviceUsbApi.pair(platform, detectedDevice.id);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to authorize device.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchInfo = async () => {
    if (!platform || !detectedDevice) return;
    setIsLoading(true);
    setError(null);
    try {
      const info = await deviceUsbApi.fetchInfo(platform, detectedDevice.id);
      setDeviceInfo(info);

      // Check for serial conflict
      if (info.serialNumber) {
        const check = await devicesApi.checkSerial(info.serialNumber);
        if (check.exists) {
          setSerialConflict({ deviceId: check.deviceId!, deviceName: check.deviceName });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch device information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseInfo = () => {
    if (deviceInfo) {
      onFetched(deviceInfo);
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setError(null);
      setStep((s) => (s - 1) as 1 | 2 | 3);
    }
  };

  // Fetch info on Step 3 entry
  useEffect(() => {
    if (step === 3 && !deviceInfo && !isLoading) {
      handleFetchInfo();
    }
  }, [step]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Step {step} of 3 · {step === 1 ? 'Connect Device' : step === 2 ? 'Authorize Device' : 'Device Info'}
          </h2>
        </div>

        {/* Step 1: Connect */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="py-6">
              <div className="flex justify-center mb-4">
                <Smartphone className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium text-center mb-5">Connect your device via USB cable</p>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-1">iPhone</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Keep screen on and unlocked</li>
                    <li>• Use original Apple cable</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-1">Android</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Go to <strong>Settings → About Phone</strong></li>
                    <li>• Tap <strong>Build Number</strong> 7 times to unlock Developer Options</li>
                    <li>• Go to <strong>Settings → Developer Options</strong></li>
                    <li>• Enable <strong>USB Debugging</strong></li>
                    <li>• Connect cable and tap <strong>Allow</strong> when prompted</li>
                  </ul>
                </div>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleDetect} isLoading={isLoading}>
                Check Connection →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Authorize (iOS) */}
        {step === 2 && platform === 'ios' && (
          <div className="space-y-4">
            <div className="py-6 text-center">
              <div className="text-2xl mb-4">🔒</div>
              <p className="font-medium text-gray-900 mb-2">
                Device detected: iPhone {detectedDevice?.name ? `(${detectedDevice.name})` : ''}
              </p>
              <p className="text-sm text-gray-600 mt-4 mb-4">
                A "Trust This Computer?" prompt will appear on your iPhone.
              </p>
              <ol className="text-sm text-gray-600 space-y-2">
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
              <Button type="button" onClick={handlePair} isLoading={isLoading}>
                I've Tapped Trust →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Authorize (Android) */}
        {step === 2 && platform === 'android' && (
          <div className="space-y-4">
            <div className="py-6 text-center">
              <div className="text-2xl mb-4">🤖</div>
              <p className="font-medium text-gray-900 mb-2">
                Device detected: Android {detectedDevice?.name ? `(${detectedDevice.name})` : ''}
              </p>
              <p className="text-sm text-gray-600 mt-4 mb-4">
                An "Allow USB Debugging?" popup may appear on your Android device.
              </p>
              <ol className="text-sm text-gray-600 space-y-2">
                <li>1. Unlock your device</li>
                <li>2. Tap "Allow" when prompted</li>
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
              <Button type="button" onClick={handlePair} isLoading={isLoading}>
                Verify & Continue →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Fetch Info */}
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
                  <Button type="button" onClick={handleFetchInfo}>
                    Retry
                  </Button>
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
                  {deviceInfo.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{deviceInfo.name}</span>
                    </div>
                  )}
                  {deviceInfo.model && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium text-gray-900">{deviceInfo.model}</span>
                    </div>
                  )}
                  {deviceInfo.osVersion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">OS Version:</span>
                      <span className="font-medium text-gray-900">{deviceInfo.osVersion}</span>
                    </div>
                  )}
                  {deviceInfo.serialNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Serial:</span>
                      <span className="font-medium text-gray-900 truncate">{deviceInfo.serialNumber}</span>
                    </div>
                  )}
                  {deviceInfo.udid && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">UDID:</span>
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">{deviceInfo.udid}</span>
                    </div>
                  )}
                  {deviceInfo.modelNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model No.:</span>
                      <span className="font-medium text-gray-900">{deviceInfo.modelNumber}</span>
                    </div>
                  )}
                  {deviceInfo.cpuArch && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CPU Arch:</span>
                      <span className="font-medium text-gray-900">{deviceInfo.cpuArch}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform:</span>
                    <span className="font-medium text-gray-900">{deviceInfo.platform}</span>
                  </div>
                  {deviceInfo.colour && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Colour:</span>
                      <span className="font-medium text-gray-900">{deviceInfo.colour}</span>
                    </div>
                  )}
                  {deviceInfo.imei && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IMEI 1:</span>
                      <span className="font-medium text-gray-900 truncate">{deviceInfo.imei}</span>
                    </div>
                  )}
                  {deviceInfo.imei2 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IMEI 2:</span>
                      <span className="font-medium text-gray-900 truncate">{deviceInfo.imei2}</span>
                    </div>
                  )}
                  {deviceInfo.macAddress && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">MAC Address:</span>
                      <span className="font-medium text-gray-900 truncate">{deviceInfo.macAddress}</span>
                    </div>
                  )}
                  {deviceInfo.simNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SIM (ICCID):</span>
                      <span className="font-medium text-gray-900 truncate">{deviceInfo.simNumber}</span>
                    </div>
                  )}
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
