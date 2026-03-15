import apiClient from './client';
import type { ListAuditLogsParams, AuditLogListResponse } from '@/types';

export const auditLogsApi = {
  list: async (params?: ListAuditLogsParams): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>('/audit-logs', { params });
    return response.data;
  },

  getByModule: async (module: string, params?: ListAuditLogsParams): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>(`/audit-logs/module/${module}`, { params });
    return response.data;
  },

  getByEntity: async (type: string, id: string): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>(`/audit-logs/entity/${type}/${id}`);
    return response.data;
  },

  getByUser: async (userId: string, params?: ListAuditLogsParams): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>(`/audit-logs/user/${userId}`, { params });
    return response.data;
  },
};
