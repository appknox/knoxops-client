import { create } from 'zustand';
import { devicesApi } from '@/api';
import type {
  Device,
  DeviceListItem,
  DeviceStats,
  CreateDeviceInput,
  UpdateDeviceInput,
  ListDevicesParams,
  DeviceType,
  DeviceStatus,
} from '@/types';

interface DeviceFilters {
  search: string;
  type: DeviceType | '';
  status: DeviceStatus | '';
  platform: string;
  osVersions: string[];
  purpose: string;
  assignedTo: string;
}

interface DeviceState {
  devices: DeviceListItem[];
  selectedDevice: Device | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: DeviceFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
  stats: DeviceStats | null;

  // Actions
  fetchDevices: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setFilters: (filters: Partial<DeviceFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  selectDevice: (device: Device | null) => void;
  createDevice: (data: CreateDeviceInput) => Promise<Device>;
  updateDevice: (id: string, data: UpdateDeviceInput) => Promise<Device>;
  deleteDevice: (id: string) => Promise<void>;
  refreshDevice: (id: string) => Promise<void>;
}

const initialFilters: DeviceFilters = {
  search: '',
  type: '',
  status: '',
  platform: '',
  osVersions: [],
  purpose: '',
  assignedTo: '',
};

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  selectedDevice: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: initialFilters,
  sortBy: 'name',
  sortOrder: 'desc',
  isLoading: false,
  error: null,
  stats: null,

  fetchDevices: async () => {
    const { filters, pagination, sortBy, sortOrder } = get();
    set({ isLoading: true, error: null });

    try {
      const params: ListDevicesParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy as ListDevicesParams['sortBy'],
        sortOrder,
      };

      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;
      if (filters.osVersions.length > 0) params.osVersion = filters.osVersions.join(',');
      if (filters.purpose) params.purpose = filters.purpose;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;

      const response = await devicesApi.list(params);
      set({
        devices: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch devices';
      set({ error: message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await devicesApi.getStats();
      set({ stats });
    } catch {
      // Stats fetch failure is non-critical
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchDevices();
  },

  clearFilters: () => {
    set({
      filters: initialFilters,
      pagination: { ...get().pagination, page: 1 },
    });
    get().fetchDevices();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchDevices();
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchDevices();
  },

  selectDevice: (device) => set({ selectedDevice: device }),

  createDevice: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const device = await devicesApi.create(data);
      get().fetchDevices();
      get().fetchStats();
      set({ isLoading: false });
      return device;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create device';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateDevice: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const device = await devicesApi.update(id, data);
      set((state) => ({
        devices: state.devices.map((d) => (d.id === id ? device : d)),
        selectedDevice: state.selectedDevice?.id === id ? device : state.selectedDevice,
        isLoading: false,
      }));
      get().fetchStats();
      return device;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update device';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteDevice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await devicesApi.delete(id);
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== id),
        selectedDevice: state.selectedDevice?.id === id ? null : state.selectedDevice,
        isLoading: false,
      }));
      get().fetchStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete device';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  refreshDevice: async (id) => {
    try {
      const device = await devicesApi.getById(id);
      set((state) => ({
        devices: state.devices.map((d) => (d.id === id ? device : d)),
        selectedDevice: state.selectedDevice?.id === id ? device : state.selectedDevice,
      }));
    } catch {
      // Ignore refresh errors
    }
  },
}));
