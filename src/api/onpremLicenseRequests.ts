import apiClient from './client';
import type { OnpremLicenseRequest, CreateLicenseRequestInput, ListOnpremLicenseRequestsResponse } from '@/types/onprem-license-request.types';

export const onpremLicenseRequestsApi = {
  list: async (deploymentId: string): Promise<ListOnpremLicenseRequestsResponse> => {
    const response = await apiClient.get<ListOnpremLicenseRequestsResponse>(
      `/onprem/${deploymentId}/license-requests`
    );
    return response.data;
  },

  listAll: async (): Promise<ListOnpremLicenseRequestsResponse> => {
    const response = await apiClient.get<ListOnpremLicenseRequestsResponse>(
      `/onprem/licence-requests/all`
    );
    return response.data;
  },

  create: async (
    deploymentId: string,
    input: CreateLicenseRequestInput
  ): Promise<OnpremLicenseRequest> => {
    const response = await apiClient.post<OnpremLicenseRequest>(
      `/onprem/${deploymentId}/license-requests`,
      input
    );
    return response.data;
  },

  getById: async (deploymentId: string, requestId: string): Promise<OnpremLicenseRequest> => {
    const response = await apiClient.get<OnpremLicenseRequest>(
      `/onprem/${deploymentId}/license-requests/${requestId}`
    );
    return response.data;
  },

  uploadFile: async (
    deploymentId: string,
    requestId: string,
    file: File
  ): Promise<OnpremLicenseRequest> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<OnpremLicenseRequest>(
      `/onprem/${deploymentId}/license-requests/${requestId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  cancel: async (
    deploymentId: string,
    requestId: string,
    reason?: string
  ): Promise<OnpremLicenseRequest> => {
    const response = await apiClient.post<OnpremLicenseRequest>(
      `/onprem/${deploymentId}/license-requests/${requestId}/cancel`,
      { reason }
    );
    return response.data;
  },

  generateToken: async (requestId: string): Promise<{ token: string; expiresAt: string }> => {
    const response = await apiClient.post<{ token: string; expiresAt: string }>(
      `/onprem/license-requests/${requestId}/generate-token`
    );
    return response.data;
  },

  getDownloadUrl: (requestId: string, token: string): string => {
    // This will be constructed in the component using the API base URL
    return `/onprem/license-requests/${requestId}/download?token=${token}`;
  },

  downloadFile: async (requestId: string): Promise<{ downloadUrl: string; fileName: string }> => {
    const { token } = await onpremLicenseRequestsApi.generateToken(requestId);
    const response = await apiClient.get<{ downloadUrl: string; fileName: string }>(
      `/onprem/license-requests/${requestId}/download`,
      { params: { token } }
    );
    return response.data;
  },
};
