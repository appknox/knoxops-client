import type { Role, User } from './auth.types';

export type PermissionLevel = 'none' | 'read' | 'read_write';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type UserStatus = 'pending' | 'active' | 'expired' | 'deleted';

// User item for list display
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

// API response for user list
export interface UserListResponse {
  data: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query params for listing users
export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
  sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

// Input for updating a user
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: Role;
}

// User stats for summary cards
export interface UserStats {
  totalUsers: number;
  activeNow: number;
  pendingInvites: number;
  externalGuests: number;
}

// Invite entity
export interface Invite {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: string | null;
}

// Input for creating an invite
export interface CreateInviteInput {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

// Invite list response
export interface InviteListResponse {
  data: Invite[];
}

// Re-export for convenience
export type { Role, User };
