import { apiClient } from './client';

export interface UsbDetectResult {
  platform: 'ios' | 'android';
  id: string;
  name?: string;
}

export interface UsbDeviceInfo {
  name: string | null;
  model: string | null;
  osVersion: string | null;
  serialNumber: string | null;
  udid: string | null;
  modelNumber: string | null;
  cpuArch: string | null;
  platform: 'iOS' | 'Android';
  colour: string | null;
  imei: string | null;
  imei2: string | null;
  macAddress: string | null;
  simNumber: string | null;
}

function extractError(err: any): Error {
  const message = err?.response?.data?.message || err?.message || 'Unknown error';
  return new Error(message);
}

export const deviceUsbApi = {
  detect: async (): Promise<UsbDetectResult | null> => {
    try {
      const response = await apiClient.post('/devices/usb/detect');
      return response.data.device;
    } catch (err) {
      throw extractError(err);
    }
  },

  pair: async (platform: string, id: string): Promise<void> => {
    try {
      await apiClient.post('/devices/usb/pair', { platform, id });
    } catch (err) {
      throw extractError(err);
    }
  },

  fetchInfo: async (platform: string, id: string): Promise<UsbDeviceInfo> => {
    try {
      const response = await apiClient.post('/devices/usb/fetch', { platform, id });
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },
};
