import apiClient from './client';
import type { Invite, CreateInviteInput } from '@/types';

export interface InvitesListResponse {
  data: Invite[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface InviteValidationResponse {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  expiresAt: string | null;
}

export const invitesApi = {
  create: async (data: CreateInviteInput): Promise<Invite> => {
    const response = await apiClient.post<Invite>('/invites', data);
    return response.data;
  },

  list: async (status?: 'pending' | 'accepted' | 'expired' | 'revoked'): Promise<InvitesListResponse> => {
    const params = status ? { status } : undefined;
    const response = await apiClient.get<InvitesListResponse>('/invites', { params });
    return response.data;
  },

  getPending: async (): Promise<Invite[]> => {
    const response = await invitesApi.list('pending');
    return response.data;
  },

  validateToken: async (token: string): Promise<InviteValidationResponse> => {
    const response = await apiClient.get<InviteValidationResponse>(`/invites/${token}`);
    return response.data;
  },

  acceptInvite: async (token: string, data: { password: string }): Promise<void> => {
    await apiClient.post(`/invites/${token}/accept`, data);
  },

  revoke: async (id: string): Promise<void> => {
    await apiClient.delete(`/invites/${id}`);
  },

  resend: async (id: string): Promise<Invite> => {
    const response = await apiClient.post<Invite>(`/invites/${id}/resend`, {});
    return response.data;
  },
};
