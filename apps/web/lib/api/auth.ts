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
  /** Tân sinh viên: tài khoản thí sinh tuyển sinh + ngành dự kiến. */
  prospectiveLogin: (sbd: string, password: string, intendedMajor: string) =>
    apiFetch<LoginResult>('/auth/prospective/login', {
      method: 'POST',
      body: JSON.stringify({ sbd, password, intendedMajor }),
    }),

  /** Sinh viên trường: MSSV + ngày sinh (yyyy-mm-dd). */
  studentLogin: (studentCode: string, dob: string) =>
    apiFetch<LoginResult>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ studentCode, dob }),
    }),

  /** Chủ trọ / Admin: SĐT + mật khẩu. */
  login: (phone: string, password: string) =>
    apiFetch<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  me: (token: string) =>
    apiFetch<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};
