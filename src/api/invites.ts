import apiClient from './client';
import type { Invite, CreateInviteInput, InviteListResponse, Role } from '@/types';

export interface InviteValidationResponse {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  expiresAt: string;
}

export interface AcceptInviteInput {
  password: string;
}

export interface AcceptInviteResponse {
  message: string;
}

export const invitesApi = {
  list: async (): Promise<InviteListResponse> => {
    const response = await apiClient.get<InviteListResponse>('/invites');
    return response.data;
  },

  getById: async (id: string): Promise<Invite> => {
    const response = await apiClient.get<Invite>(`/invites/${id}`);
    return response.data;
  },

  create: async (data: CreateInviteInput): Promise<Invite> => {
    const response = await apiClient.post<Invite>('/invites', data);
    return response.data;
  },

  revoke: async (id: string): Promise<void> => {
    await apiClient.delete(`/invites/${id}`);
  },

  resend: async (id: string): Promise<Invite> => {
    const response = await apiClient.post<Invite>(`/invites/${id}/resend`);
    return response.data;
  },

  // Public endpoints for invite acceptance
  validateToken: async (token: string): Promise<InviteValidationResponse> => {
    const response = await apiClient.get<InviteValidationResponse>(`/invites/${token}`);
    return response.data;
  },

  acceptInvite: async (token: string, data: AcceptInviteInput): Promise<AcceptInviteResponse> => {
    const response = await apiClient.post<AcceptInviteResponse>(`/invites/${token}/accept`, data);
    return response.data;
  },
};
