import { create } from 'zustand';
import { onpremLicenseRequestsApi } from '@/api/onpremLicenseRequests';
import type { OnpremLicenseRequest, CreateLicenseRequestInput } from '@/types/onprem-license-request.types';

interface OnpremLicenseRequestStore {
  requests: OnpremLicenseRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRequests: (deploymentId: string) => Promise<void>;
  fetchAllRequests: () => Promise<void>;
  createRequest: (deploymentId: string, input: CreateLicenseRequestInput) => Promise<void>;
  uploadFile: (deploymentId: string, requestId: string, file: File) => Promise<void>;
  cancelRequest: (deploymentId: string, requestId: string, reason?: string) => Promise<void>;
  generateToken: (requestId: string) => Promise<{ token: string; expiresAt: string }>;
  clearError: () => void;
}

export const useOnpremLicenseRequestStore = create<OnpremLicenseRequestStore>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async (deploymentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await onpremLicenseRequestsApi.list(deploymentId);
      set({ requests: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to fetch requests';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchAllRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await onpremLicenseRequestsApi.listAll();
      set({ requests: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to fetch requests';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createRequest: async (deploymentId: string, input: CreateLicenseRequestInput) => {
    set({ isLoading: true, error: null });
    try {
      await onpremLicenseRequestsApi.create(deploymentId, input);
      // Refetch requests
      await get().fetchRequests(deploymentId);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to create request';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  uploadFile: async (deploymentId: string, requestId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      await onpremLicenseRequestsApi.uploadFile(deploymentId, requestId, file);
      // Refetch requests
      await get().fetchRequests(deploymentId);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to upload file';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  cancelRequest: async (deploymentId: string, requestId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await onpremLicenseRequestsApi.cancel(deploymentId, requestId, reason);
      // Refetch requests
      await get().fetchRequests(deploymentId);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to cancel request';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  generateToken: async (requestId: string) => {
    try {
      return await onpremLicenseRequestsApi.generateToken(requestId);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to generate token';
      set({ error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
