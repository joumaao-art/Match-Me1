/**
 * Authentication and user-related types.
 */

export type UserRole = 'job_seeker' | 'company';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  userRole: UserRole | null;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface ResetPasswordRequest {
  email: string;
}