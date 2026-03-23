import { apiClient } from './client.js';
import type { DeviceRequest, CreateDeviceRequestInput, ListDeviceRequestsResponse } from '@/types/device-request.types.js';

export const deviceRequestsApi = {
  create: async (input: CreateDeviceRequestInput): Promise<DeviceRequest> => {
    const response = await apiClient.post<DeviceRequest>('/device-requests', input);
    return response.data;
  },

  list: async (): Promise<ListDeviceRequestsResponse> => {
    const response = await apiClient.get<ListDeviceRequestsResponse>('/device-requests');
    return response.data;
  },

  getById: async (id: string): Promise<DeviceRequest> => {
    const response = await apiClient.get<DeviceRequest>(`/device-requests/${id}`);
    return response.data;
  },

  approve: async (id: string): Promise<DeviceRequest> => {
    const response = await apiClient.patch<DeviceRequest>(`/device-requests/${id}/approve`, {});
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<DeviceRequest> => {
    const response = await apiClient.patch<DeviceRequest>(`/device-requests/${id}/reject`, { reason });
    return response.data;
  },

  complete: async (id: string, linkedDeviceId?: string): Promise<DeviceRequest> => {
    const response = await apiClient.patch<DeviceRequest>(`/device-requests/${id}/complete`, {
      linkedDeviceId,
    });
    return response.data;
  },
};
