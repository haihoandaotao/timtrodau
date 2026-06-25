import { apiFetch } from './client';

export type UserRole = 'STUDENT' | 'LANDLORD' | 'ADMIN';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  studentCode: string | null;
  role: UserRole;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: AuthUser;
}

export const authApi = {
  requestOtp: (studentCode: string, phone: string) =>
    apiFetch<{ requestId: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ studentCode, phone }),
    }),

  verifyOtp: (requestId: string, code: string) =>
    apiFetch<LoginResult>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ requestId, code }),
    }),

  login: (phone: string, password: string) =>
    apiFetch<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  me: (token: string) =>
    apiFetch<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};
