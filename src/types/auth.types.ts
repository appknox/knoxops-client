export type Role =
  | 'admin'
  | 'devices_admin'
  | 'devices_viewer'
  | 'onprem_admin'
  | 'onprem_viewer'
  | 'full_viewer'
  | 'full_editor'
  | 'devices_admin_onprem_viewer'
  | 'onprem_admin_devices_viewer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
