import apiClient from './client';
import type {
  User,
  UserListItem,
  UserListResponse,
  ListUsersParams,
  UpdateUserInput,
  UserStats,
  Invite,
} from '@/types';

export const usersApi = {
  list: async (params?: ListUsersParams): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  search: async (query: string, limit = 10): Promise<User[]> => {
    const response = await apiClient.get<UserListResponse>('/users', {
      params: { search: query, limit },
    });
    return response.data.data as unknown as User[];
  },

  update: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Compute stats from users list and invites
  getStats: async (): Promise<UserStats> => {
    const [usersRes, invitesRes] = await Promise.all([
      apiClient.get<UserListResponse>('/users', { params: { limit: 100 } }),
      apiClient.get<{ data: Invite[] }>('/invites'),
    ]);

    const allUsers = usersRes.data.data || [];
    const invites = invitesRes.data.data || [];
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter out pending invites from users list (only count active users)
    const activeUsers = allUsers.filter((u) => u.status === 'active');
    const pendingInvites = invites.filter((i) => i.status === 'pending');

    return {
      totalUsers: activeUsers.length,
      activeNow: activeUsers.filter(
        (u) => u.lastLoginAt && new Date(u.lastLoginAt) > yesterday
      ).length,
      pendingInvites: pendingInvites.length,
      externalGuests: activeUsers.filter((u) => u.role !== 'admin').length,
    };
  },
};
