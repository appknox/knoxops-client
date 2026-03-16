import { create } from 'zustand';
import { usersApi, invitesApi } from '@/api';
import type {
  User,
  UserListItem,
  UserStats,
  ListUsersParams,
  UpdateUserInput,
  Invite,
  CreateInviteInput,
  Role,
  UserStatus,
} from '@/types';

interface UserFilters {
  search: string;
  role: Role | '';
  status: UserStatus[];
}

interface UserState {
  users: UserListItem[];
  selectedUser: User | null;
  invites: Invite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: UserFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
  stats: UserStats | null;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<User>;
  fetchStats: () => Promise<void>;
  fetchInvites: () => Promise<void>;
  setFilters: (filters: Partial<UserFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  selectUser: (user: User | null) => void;
  updateUser: (id: string, data: UpdateUserInput) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  createInvite: (data: CreateInviteInput) => Promise<Invite>;
  revokeInvite: (id: string) => Promise<void>;
  resendInvite: (userId: string) => Promise<void>;
}

const initialFilters: UserFilters = {
  search: '',
  role: '',
  status: [],
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  invites: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  filters: initialFilters,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isLoading: false,
  error: null,
  stats: null,

  fetchUsers: async () => {
    const { filters, pagination, sortBy, sortOrder } = get();
    set({ isLoading: true, error: null });

    try {
      const params: ListUsersParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy as ListUsersParams['sortBy'],
        sortOrder,
      };

      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status.length > 0) params.status = filters.status.join(',');

      const response = await usersApi.list(params);
      set({
        users: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false,
      });
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await usersApi.getById(id);
      set({ selectedUser: user, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await usersApi.getStats();
      set({ stats });
    } catch {
      // Non-critical, don't set error
    }
  },

  fetchInvites: async () => {
    try {
      const response = await invitesApi.list();
      set({ invites: response.data });
    } catch {
      // Non-critical, don't set error
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchUsers();
  },

  clearFilters: () => {
    set({ filters: initialFilters, pagination: { ...get().pagination, page: 1 } });
    get().fetchUsers();
  },

  setPage: (page) => {
    set((state) => ({ pagination: { ...state.pagination, page } }));
    get().fetchUsers();
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().fetchUsers();
  },

  selectUser: (user) => set({ selectedUser: user }),

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await usersApi.update(id, data);
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, ...user } : u
        ),
        selectedUser: state.selectedUser?.id === id ? user : state.selectedUser,
        isLoading: false,
      }));
      get().fetchStats();
      return user;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update user',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await usersApi.delete(id);
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, status: 'deleted' } : u
        ),
        isLoading: false,
      }));
      get().fetchStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete user',
        isLoading: false,
      });
      throw error;
    }
  },

  createInvite: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const invite = await invitesApi.create(data);
      set((state) => ({
        invites: [invite, ...state.invites],
        isLoading: false,
      }));
      get().fetchStats();
      return invite;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send invite',
        isLoading: false,
      });
      throw error;
    }
  },

  revokeInvite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await invitesApi.revoke(id);
      set((state) => ({
        invites: state.invites.filter((i) => i.id !== id),
        isLoading: false,
      }));
      get().fetchStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to revoke invite',
        isLoading: false,
      });
      throw error;
    }
  },

  resendInvite: async (userId: string) => {
    try {
      await invitesApi.resend(userId);
      get().fetchUsers();
    } catch (error) {
      throw error;
    }
  },
}));
