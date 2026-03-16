import { apiClient } from './client';
import type {
  OnpremDeployment,
  OnpremListResponse,
  CreateOnpremInput,
  UpdateOnpremInput,
  ListOnpremParams,
  OnpremDeviceAssociation,
  OnpremDevicesListResponse,
  AddDeviceInput,
  UpdateDeviceAssociationInput,
  OnpremVersionHistory,
  VersionHistoryListResponse,
  AddVersionInput,
  OnpremStatusHistory,
  OnpremComment,
  CreateCommentInput,
  UpdateCommentInput,
  CommentListResponse,
  CombinedHistoryResponse,
  OnpremDocument,
  DocumentCategory,
} from '@/types';

export const onpremApi = {
  // ============================================
  // MAIN CRUD
  // ============================================

  list: async (params?: ListOnpremParams): Promise<OnpremListResponse> => {
    const response = await apiClient.get<OnpremListResponse>('/onprem', { params });
    return response.data;
  },

  getDistinctVersions: async (): Promise<string[]> => {
    const response = await apiClient.get<{ data: string[] }>('/onprem/distinct-versions');
    return response.data.data;
  },

  getDistinctCsmUsers: async (): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> => {
    const response = await apiClient.get<{ data: { id: string; firstName: string; lastName: string; email: string }[] }>('/onprem/distinct-csm-users');
    return response.data.data;
  },

  getById: async (id: string): Promise<OnpremDeployment> => {
    const response = await apiClient.get<OnpremDeployment>(`/onprem/${id}`);
    return response.data;
  },

  create: async (data: CreateOnpremInput): Promise<OnpremDeployment> => {
    const response = await apiClient.post<OnpremDeployment>('/onprem', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOnpremInput): Promise<OnpremDeployment> => {
    const response = await apiClient.put<OnpremDeployment>(`/onprem/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string, reason?: string): Promise<OnpremDeployment> => {
    const response = await apiClient.patch<OnpremDeployment>(`/onprem/${id}/status`, { status, reason });
    return response.data;
  },

  updateClientStatus: async (id: string, clientStatus: string, reason?: string): Promise<OnpremDeployment> => {
    const response = await apiClient.patch<OnpremDeployment>(`/onprem/${id}/client-status`, { clientStatus, reason });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/onprem/${id}`);
  },

  // ============================================
  // HISTORY & AUDIT
  // ============================================

  getStatusHistory: async (id: string): Promise<{ data: OnpremStatusHistory[] }> => {
    const response = await apiClient.get<{ data: OnpremStatusHistory[] }>(`/onprem/${id}/history`);
    return response.data;
  },

  getAuditLog: async (id: string): Promise<{ data: unknown[] }> => {
    const response = await apiClient.get<{ data: unknown[] }>(`/onprem/${id}/audit`);
    return response.data;
  },

  // ============================================
  // DEVICE ASSOCIATIONS
  // ============================================

  listDevices: async (
    deploymentId: string,
    params?: { page?: number; limit?: number; search?: string; connectionStatus?: string }
  ): Promise<OnpremDevicesListResponse> => {
    const response = await apiClient.get<OnpremDevicesListResponse>(`/onprem/${deploymentId}/devices`, { params });
    return response.data;
  },

  addDevice: async (deploymentId: string, data: AddDeviceInput): Promise<OnpremDeviceAssociation> => {
    const response = await apiClient.post<OnpremDeviceAssociation>(`/onprem/${deploymentId}/devices`, data);
    return response.data;
  },

  updateDevice: async (
    deploymentId: string,
    deviceId: string,
    data: UpdateDeviceAssociationInput
  ): Promise<OnpremDeviceAssociation> => {
    const response = await apiClient.put<OnpremDeviceAssociation>(`/onprem/${deploymentId}/devices/${deviceId}`, data);
    return response.data;
  },

  removeDevice: async (deploymentId: string, deviceId: string): Promise<void> => {
    await apiClient.delete(`/onprem/${deploymentId}/devices/${deviceId}`);
  },

  // ============================================
  // VERSION HISTORY
  // ============================================

  getVersionHistory: async (
    deploymentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<VersionHistoryListResponse> => {
    const response = await apiClient.get<VersionHistoryListResponse>(`/onprem/${deploymentId}/versions`, { params });
    return response.data;
  },

  addVersion: async (deploymentId: string, data: AddVersionInput): Promise<OnpremVersionHistory> => {
    const response = await apiClient.post<OnpremVersionHistory>(`/onprem/${deploymentId}/versions`, data);
    return response.data;
  },

  // ============================================
  // FILE UPLOAD/DOWNLOAD
  // ============================================

  uploadPrerequisite: async (deploymentId: string, file: File): Promise<{ message: string; fileName: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ message: string; fileName: string }>(
      `/onprem/${deploymentId}/prerequisite`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  downloadPrerequisite: async (deploymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/onprem/${deploymentId}/prerequisite`, {
      responseType: 'blob',
    });
    return response.data;
  },

  uploadSslCertificate: async (deploymentId: string, file: File): Promise<{ message: string; fileName: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ message: string; fileName: string }>(
      `/onprem/${deploymentId}/ssl-certificate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  downloadSslCertificate: async (deploymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/onprem/${deploymentId}/ssl-certificate`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ============================================
  // VALIDATION
  // ============================================

  checkEmailExists: async (
    email: string,
    excludeId?: string
  ): Promise<{ exists: boolean; deployment?: { id: string; clientName: string } }> => {
    const response = await apiClient.get<{ exists: boolean; deployment?: { id: string; clientName: string } }>(
      '/onprem/check-email',
      { params: { email, excludeId } }
    );
    return response.data;
  },

  checkPhoneExists: async (
    phone: string,
    excludeId?: string
  ): Promise<{ exists: boolean; deployment?: { id: string; clientName: string } }> => {
    const response = await apiClient.get<{ exists: boolean; deployment?: { id: string; clientName: string } }>(
      '/onprem/check-phone',
      { params: { phone, excludeId } }
    );
    return response.data;
  },

  // ============================================
  // COMMENTS
  // ============================================

  getComments: async (deploymentId: string): Promise<CommentListResponse> => {
    const response = await apiClient.get<CommentListResponse>(`/onprem/${deploymentId}/comments`);
    return response.data;
  },

  createComment: async (deploymentId: string, data: CreateCommentInput): Promise<OnpremComment> => {
    const response = await apiClient.post<OnpremComment>(`/onprem/${deploymentId}/comments`, data);
    return response.data;
  },

  updateComment: async (
    deploymentId: string,
    commentId: string,
    data: UpdateCommentInput
  ): Promise<OnpremComment> => {
    const response = await apiClient.put<OnpremComment>(
      `/onprem/${deploymentId}/comments/${commentId}`,
      data
    );
    return response.data;
  },

  deleteComment: async (deploymentId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/onprem/${deploymentId}/comments/${commentId}`);
  },

  getCombinedHistory: async (deploymentId: string): Promise<CombinedHistoryResponse> => {
    const response = await apiClient.get<CombinedHistoryResponse>(
      `/onprem/${deploymentId}/combined-history`
    );
    return response.data;
  },

  // ============================================
  // DOCUMENT MANAGEMENT
  // ============================================

  uploadDocuments: async (
    deploymentId: string,
    category: DocumentCategory,
    files: File[]
  ): Promise<OnpremDocument[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await apiClient.post<OnpremDocument[]>(
      `/onprem/${deploymentId}/documents?category=${category}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  listDocuments: async (
    deploymentId: string,
    category?: DocumentCategory
  ): Promise<OnpremDocument[]> => {
    const params = category ? { category } : undefined;
    const response = await apiClient.get<OnpremDocument[]>(
      `/onprem/${deploymentId}/documents`,
      { params }
    );
    return response.data;
  },

  deleteDocument: async (deploymentId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/onprem/${deploymentId}/documents/${documentId}`);
  },

  downloadAll: async (deploymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/onprem/${deploymentId}/download-all`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
