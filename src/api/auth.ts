import apiClient from './client';
import type { LoginRequest, LoginResponse, User } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  validateResetToken: async (token: string): Promise<{ valid: boolean }> => {
    const response = await apiClient.get<{ valid: boolean }>(`/auth/reset-password/${token}`);
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post(`/auth/reset-password/${token}`, { password });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
};
