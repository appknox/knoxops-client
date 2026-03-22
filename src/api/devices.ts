import apiClient from './client';
import type {
  Device,
  CreateDeviceInput,
  UpdateDeviceInput,
  ListDevicesParams,
  DeviceListResponse,
  DeviceStats,
  DeviceComment,
} from '@/types';
import type { AuditLog } from '@/types';

export const devicesApi = {
  list: async (params?: ListDevicesParams): Promise<DeviceListResponse> => {
    const response = await apiClient.get<DeviceListResponse>('/devices', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Device> => {
    const response = await apiClient.get<Device>(`/devices/${id}`);
    return response.data;
  },

  create: async (data: CreateDeviceInput): Promise<Device> => {
    const response = await apiClient.post<Device>('/devices', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDeviceInput): Promise<Device> => {
    const response = await apiClient.put<Device>(`/devices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/devices/${id}`);
  },

  getStats: async (): Promise<DeviceStats> => {
    const response = await apiClient.get<DeviceStats>('/devices/stats');
    return response.data;
  },

  checkSerial: async (serialNumber: string, excludeId?: string): Promise<{
    exists: boolean;
    deviceId: string | null;
    deviceName: string | null;
  }> => {
    const params = new URLSearchParams({ serialNumber });
    if (excludeId) params.set('excludeId', excludeId);
    const response = await apiClient.get<{
      exists: boolean;
      deviceId: string | null;
      deviceName: string | null;
    }>(`/devices/check-serial?${params}`);
    return response.data;
  },

  getAuditLogs: async (id: string, startDate?: string, endDate?: string): Promise<{ data: AuditLog[] }> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<{ data: AuditLog[] }>(`/devices/${id}/audit`, { params });
    return response.data;
  },

  // Comments endpoints
  getComments: async (id: string): Promise<{ data: DeviceComment[] }> => {
    const response = await apiClient.get<{ data: DeviceComment[] }>(`/devices/${id}/comments`);
    return response.data;
  },

  addComment: async (id: string, text: string): Promise<DeviceComment> => {
    const response = await apiClient.post<DeviceComment>(`/devices/${id}/comments`, { text });
    return response.data;
  },

  updateComment: async (id: string, commentId: string, text: string): Promise<DeviceComment> => {
    const response = await apiClient.put<DeviceComment>(`/devices/${id}/comments/${commentId}`, { text });
    return response.data;
  },

  deleteComment: async (deviceId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/devices/${deviceId}/comments/${commentId}`);
  },

  // History endpoint - merged comments + activities
  getHistory: async (
    id: string,
    params?: {
      type?: 'all' | 'comment' | 'activity';
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: Array<{
      id: string;
      type: 'comment' | 'activity';
      timestamp: string;
      user?: { id: string; firstName: string; lastName: string; email: string } | null;
      data: unknown;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const response = await apiClient.get(`/devices/${id}/history`, { params });
    return response.data;
  },
};
