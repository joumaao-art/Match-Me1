/**
 * Authentication and session types.
 */

export type UserRole = 'job_seeker' | 'company' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmedAt?: string;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  userRole: UserRole | null;
  isEmailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  password: string;
}