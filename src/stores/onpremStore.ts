import { create } from 'zustand';
import { onpremApi } from '@/api';
import type {
  OnpremDeployment,
  CreateOnpremInput,
  UpdateOnpremInput,
  ListOnpremParams,
  ClientStatus,
  EnvironmentType,
  OnpremDeviceAssociation,
  OnpremVersionHistory,
  AddDeviceInput,
  UpdateDeviceAssociationInput,
  AddVersionInput,
  OnpremComment,
  CreateCommentInput,
  UpdateCommentInput,
  CombinedHistoryEntry,
} from '@/types';

interface OnpremFilters {
  search: string;
  clientStatus: ClientStatus | '';
  environmentType: EnvironmentType | '';
  appknoxVersions: string[];
  csmIds: string[];
}

interface OnpremState {
  deployments: OnpremDeployment[];
  selectedDeployment: OnpremDeployment | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: OnpremFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;

  // Device associations
  devices: OnpremDeviceAssociation[];
  devicesPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  devicesLoading: boolean;

  // Version history
  versionHistory: OnpremVersionHistory[];
  versionHistoryPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  versionHistoryLoading: boolean;

  // Comments
  comments: OnpremComment[];
  commentsLoading: boolean;

  // Combined history
  combinedHistory: CombinedHistoryEntry[];
  combinedHistoryLoading: boolean;

  // Actions
  fetchDeployments: () => Promise<void>;
  setFilters: (filters: Partial<OnpremFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  selectDeployment: (deployment: OnpremDeployment | null) => void;
  createDeployment: (data: CreateOnpremInput) => Promise<OnpremDeployment>;
  updateDeployment: (id: string, data: UpdateOnpremInput) => Promise<OnpremDeployment>;
  deleteDeployment: (id: string) => Promise<void>;
  refreshDeployment: (id: string) => Promise<void>;

  // Device actions
  fetchDevices: (deploymentId: string) => Promise<void>;
  addDevice: (deploymentId: string, data: AddDeviceInput) => Promise<void>;
  updateDeviceAssociation: (deploymentId: string, deviceId: string, data: UpdateDeviceAssociationInput) => Promise<void>;
  removeDevice: (deploymentId: string, deviceId: string) => Promise<void>;

  // Version history actions
  fetchVersionHistory: (deploymentId: string) => Promise<void>;
  addVersion: (deploymentId: string, data: AddVersionInput) => Promise<void>;

  // Comment actions
  fetchComments: (deploymentId: string) => Promise<void>;
  createComment: (deploymentId: string, data: CreateCommentInput) => Promise<void>;
  updateComment: (deploymentId: string, commentId: string, data: UpdateCommentInput) => Promise<void>;
  deleteComment: (deploymentId: string, commentId: string) => Promise<void>;
  fetchCombinedHistory: (deploymentId: string) => Promise<void>;
}

const initialFilters: OnpremFilters = {
  search: '',
  clientStatus: '',
  environmentType: '',
  appknoxVersions: [],
  csmIds: [],
};

export const useOnpremStore = create<OnpremState>((set, get) => ({
  deployments: [],
  selectedDeployment: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: initialFilters,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isLoading: false,
  error: null,

  devices: [],
  devicesPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  devicesLoading: false,

  versionHistory: [],
  versionHistoryPagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  versionHistoryLoading: false,

  comments: [],
  commentsLoading: false,

  combinedHistory: [],
  combinedHistoryLoading: false,

  fetchDeployments: async () => {
    const { filters, pagination, sortBy, sortOrder } = get();
    set({ isLoading: true, error: null });

    try {
      const params: ListOnpremParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy as ListOnpremParams['sortBy'],
        sortOrder,
      };

      if (filters.search) params.search = filters.search;
      if (filters.clientStatus) params.clientStatus = filters.clientStatus;
      if (filters.environmentType) params.environmentType = filters.environmentType;
      if (filters.appknoxVersions.length > 0) params.currentVersions = filters.appknoxVersions;
      if (filters.csmIds.length > 0) params.csmIds = filters.csmIds;

      const response = await onpremApi.list(params);
      set({
        deployments: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch deployments';
      set({ error: message, isLoading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchDeployments();
  },

  clearFilters: () => {
    set({
      filters: initialFilters,
      pagination: { ...get().pagination, page: 1 },
    });
    get().fetchDeployments();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchDeployments();
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchDeployments();
  },

  selectDeployment: (deployment) => set({ selectedDeployment: deployment }),

  createDeployment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const deployment = await onpremApi.create(data);
      get().fetchDeployments();
      set({ isLoading: false });
      return deployment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create deployment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateDeployment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const deployment = await onpremApi.update(id, data);
      set((state) => ({
        deployments: state.deployments.map((d) => (d.id === id ? deployment : d)),
        selectedDeployment: state.selectedDeployment?.id === id ? deployment : state.selectedDeployment,
        isLoading: false,
      }));
      return deployment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update deployment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteDeployment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await onpremApi.delete(id);
      set((state) => ({
        deployments: state.deployments.filter((d) => d.id !== id),
        selectedDeployment: state.selectedDeployment?.id === id ? null : state.selectedDeployment,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete deployment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  refreshDeployment: async (id) => {
    try {
      const deployment = await onpremApi.getById(id);
      set((state) => ({
        deployments: state.deployments.map((d) => (d.id === id ? deployment : d)),
        selectedDeployment: state.selectedDeployment?.id === id ? deployment : state.selectedDeployment,
      }));
    } catch {
      // Ignore refresh errors
    }
  },

  // Device actions
  fetchDevices: async (deploymentId) => {
    set({ devicesLoading: true });
    try {
      const response = await onpremApi.listDevices(deploymentId);
      set({
        devices: response.data,
        devicesPagination: response.pagination,
        devicesLoading: false,
      });
    } catch {
      set({ devicesLoading: false });
    }
  },

  addDevice: async (deploymentId, data) => {
    await onpremApi.addDevice(deploymentId, data);
    get().fetchDevices(deploymentId);
  },

  updateDeviceAssociation: async (deploymentId, deviceId, data) => {
    await onpremApi.updateDevice(deploymentId, deviceId, data);
    get().fetchDevices(deploymentId);
  },

  removeDevice: async (deploymentId, deviceId) => {
    await onpremApi.removeDevice(deploymentId, deviceId);
    get().fetchDevices(deploymentId);
  },

  // Version history actions
  fetchVersionHistory: async (deploymentId) => {
    set({ versionHistoryLoading: true });
    try {
      const response = await onpremApi.getVersionHistory(deploymentId);
      set({
        versionHistory: response.data,
        versionHistoryPagination: response.pagination,
        versionHistoryLoading: false,
      });
    } catch {
      set({ versionHistoryLoading: false });
    }
  },

  addVersion: async (deploymentId, data) => {
    await onpremApi.addVersion(deploymentId, data);
    get().fetchVersionHistory(deploymentId);
    get().refreshDeployment(deploymentId);
  },

  // Comment actions
  fetchComments: async (deploymentId) => {
    set({ commentsLoading: true });
    try {
      const response = await onpremApi.getComments(deploymentId);
      set({
        comments: response.data,
        commentsLoading: false,
      });
    } catch {
      set({ commentsLoading: false });
    }
  },

  createComment: async (deploymentId, data) => {
    await onpremApi.createComment(deploymentId, data);
    // Refresh both comments and combined history
    await Promise.all([
      get().fetchComments(deploymentId),
      get().fetchCombinedHistory(deploymentId),
    ]);
  },

  updateComment: async (deploymentId, commentId, data) => {
    await onpremApi.updateComment(deploymentId, commentId, data);
    // Refresh both comments and combined history
    await Promise.all([
      get().fetchComments(deploymentId),
      get().fetchCombinedHistory(deploymentId),
    ]);
  },

  deleteComment: async (deploymentId, commentId) => {
    await onpremApi.deleteComment(deploymentId, commentId);
    // Refresh both comments and combined history
    await Promise.all([
      get().fetchComments(deploymentId),
      get().fetchCombinedHistory(deploymentId),
    ]);
  },

  fetchCombinedHistory: async (deploymentId) => {
    set({ combinedHistoryLoading: true });
    try {
      const response = await onpremApi.getCombinedHistory(deploymentId);
      set({
        combinedHistory: response.data,
        combinedHistoryLoading: false,
      });
    } catch {
      set({ combinedHistoryLoading: false });
    }
  },
}));
