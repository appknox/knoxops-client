import { create } from 'zustand';
import { deviceRequestsApi } from '@/api/deviceRequests.js';
import type { DeviceRequest, CreateDeviceRequestInput } from '@/types/device-request.types.js';

interface DeviceRequestStore {
  requests: DeviceRequest[];
  isLoading: boolean;
  error: string | null;
  showRequestModal: boolean;
  selectedRequest: DeviceRequest | null;
  pagination: {
    total: number;
  };

  // Actions
  fetchRequests: () => Promise<void>;
  createRequest: (input: CreateDeviceRequestInput) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;
  completeRequest: (id: string, linkedDeviceId?: string) => Promise<void>;
  setShowRequestModal: (show: boolean) => void;
  selectRequest: (request: DeviceRequest | null) => void;
}

export const useDeviceRequestStore = create<DeviceRequestStore>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  showRequestModal: false,
  selectedRequest: null,
  pagination: { total: 0 },

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const response = await deviceRequestsApi.list();
      set({
        requests: response.data,
        pagination: response.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  createRequest: async (input: CreateDeviceRequestInput) => {
    try {
      await deviceRequestsApi.create(input);
      get().setShowRequestModal(false);
      await get().fetchRequests();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  approveRequest: async (id: string) => {
    try {
      await deviceRequestsApi.approve(id);
      await get().fetchRequests();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  rejectRequest: async (id: string, reason: string) => {
    try {
      await deviceRequestsApi.reject(id, reason);
      await get().fetchRequests();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  completeRequest: async (id: string, linkedDeviceId?: string) => {
    try {
      await deviceRequestsApi.complete(id, linkedDeviceId);
      await get().fetchRequests();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setShowRequestModal: (show: boolean) => {
    set({ showRequestModal: show });
  },

  selectRequest: (request: DeviceRequest | null) => {
    set({ selectedRequest: request });
  },
}));
