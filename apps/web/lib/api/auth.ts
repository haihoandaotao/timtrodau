import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type UserRole = 'STUDENT' | 'LANDLORD' | 'ADMIN';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  studentCode: string | null;
  role: UserRole;
  status: string;
  mustChangePassword?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface ProspectiveRegisterPayload {
  fullName: string;
  email?: string;
  phone?: string;
  dob: string;
  intendedMajor: string;
  enrollmentYear: number;
}

export const authApi = {
  /** Tân sinh viên: email hoặc SĐT + ngày sinh (mật khẩu). */
  prospectiveLogin: (identifier: string, dob: string) =>
    apiFetch<LoginResult>('/auth/prospective/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, dob }),
    }),

  /** Thí sinh tự đăng ký → đăng nhập luôn. */
  prospectiveRegister: (payload: ProspectiveRegisterPayload) =>
    apiFetch<LoginResult>('/auth/prospective/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Sinh viên trường: MSSV + ngày sinh (yyyy-mm-dd). */
  studentLogin: (studentCode: string, dob: string) =>
    apiFetch<LoginResult>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ studentCode, dob }),
    }),

  /** Chủ trọ / Admin: email hoặc SĐT + mật khẩu. */
  login: (identifier: string, password: string) =>
    apiFetch<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  /** Chủ trọ: đăng nhập/đăng ký bằng Google (ID token từ Google Identity Services). */
  googleLogin: (idToken: string) =>
    apiFetch<LoginResult>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  me: (token: string) =>
    apiFetch<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),

  updateProfile: (payload: { fullName?: string; email?: string; phone?: string }) =>
    apiFetch<AuthUser>('/auth/profile', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  /** Quên mật khẩu: gửi mật khẩu tạm về email (chủ trọ/admin). */
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export interface Major {
  id: number;
  name: string;
  isActive: boolean;
}

export const majorsApi = {
  listActive: () => apiFetch<Major[]>('/majors'),
};
