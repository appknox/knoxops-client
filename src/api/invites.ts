import apiClient from './client';
import type { Invite } from '@/types';

export interface InvitesListResponse {
  data: Invite[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export const invitesApi = {
  list: async (status?: 'pending' | 'accepted' | 'expired' | 'revoked'): Promise<InvitesListResponse> => {
    const params = status ? { status } : undefined;
    const response = await apiClient.get<InvitesListResponse>('/invites', { params });
    return response.data;
  },

  getPending: async (): Promise<Invite[]> => {
    const response = await invitesApi.list('pending');
    return response.data;
  },

  revoke: async (id: string): Promise<void> => {
    await apiClient.delete(`/invites/${id}`);
  },

  resend: async (id: string): Promise<Invite> => {
    const response = await apiClient.post<Invite>(`/invites/${id}/resend`, {});
    return response.data;
  },
};
