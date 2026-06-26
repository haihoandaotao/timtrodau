import { apiFetch } from './client';
import type { Accommodation } from './accommodations';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Overview {
  studentsFoundRoom: number;
  publishedAccommodations: number;
  totalBookings: number;
}
export interface Bucket {
  bucket: string;
  count: number;
}
export interface AreaCount {
  area: string;
  count: number;
}
export interface TrustedLandlord {
  userId: string;
  fullName: string;
  isTrusted: boolean;
  verifiedBookingCount: number;
}

export const adminApi = {
  // Stats (DAL-15)
  overview: () => apiFetch<Overview>('/admin/stats/overview', { headers: authHeaders() }),
  priceDistribution: () =>
    apiFetch<Bucket[]>('/admin/stats/price-distribution', { headers: authHeaders() }),
  areaDistribution: () =>
    apiFetch<AreaCount[]>('/admin/stats/area-distribution', { headers: authHeaders() }),
  trustedLandlords: () =>
    apiFetch<TrustedLandlord[]>('/admin/stats/trusted-landlords', { headers: authHeaders() }),

  // Moderation (DAL-13)
  pendingAccommodations: () =>
    apiFetch<Accommodation[]>('/admin/moderation/accommodations', { headers: authHeaders() }),
  moderateAccommodation: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) =>
    apiFetch<Accommodation>(`/admin/moderation/accommodations/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ action, reason }),
    }),
  pendingLandlords: () =>
    apiFetch<PendingLandlord[]>('/admin/moderation/landlords', { headers: authHeaders() }),
  moderateLandlord: (userId: string, action: 'APPROVE' | 'REJECT', reason?: string, isTrusted?: boolean) =>
    apiFetch<unknown>(`/admin/moderation/landlords/${userId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ action, reason, isTrusted }),
    }),

  // Users (quản lý người dùng)
  users: (role?: string, page = 1) =>
    apiFetch<Paginated<AdminUser>>(
      `/admin/users?${role ? `role=${role}&` : ''}page=${page}`,
      { headers: authHeaders() },
    ),
  setUserStatus: (id: string, status: 'ACTIVE' | 'BLOCKED') =>
    apiFetch<AdminUser>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  // Bookings (DAL-14)
  bookings: (status?: string, page = 1) =>
    apiFetch<Paginated<AdminBooking>>(
      `/bookings?${status ? `status=${status}&` : ''}page=${page}`,
      { headers: authHeaders() },
    ),
  setBookingStatus: (id: string, status: string) =>
    apiFetch<unknown>(`/bookings/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  // Areas (phường/xã)
  areas: () => apiFetch<AdminArea[]>('/admin/areas', { headers: authHeaders() }),
  createArea: (name: string) =>
    apiFetch<AdminArea>('/admin/areas', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name }) }),
  updateArea: (id: number, name: string) =>
    apiFetch<AdminArea>(`/admin/areas/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ name }) }),
  deleteArea: (id: number) =>
    apiFetch<void>(`/admin/areas/${id}`, { method: 'DELETE', headers: authHeaders() }),

  // Majors (cấu hình ngành)
  majors: () => apiFetch<AdminMajor[]>('/admin/majors', { headers: authHeaders() }),
  createMajor: (name: string) =>
    apiFetch<AdminMajor>('/admin/majors', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    }),
  updateMajor: (id: number, data: { name?: string; isActive?: boolean }) =>
    apiFetch<AdminMajor>(`/admin/majors/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  deleteMajor: (id: number) =>
    apiFetch<void>(`/admin/majors/${id}`, { method: 'DELETE', headers: authHeaders() }),
};

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
export interface AdminUser {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  studentCode: string | null;
  role: 'STUDENT' | 'LANDLORD' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
}
export interface AdminMajor {
  id: number;
  name: string;
  isActive: boolean;
}
export interface AdminArea {
  id: number;
  name: string;
}
export interface AdminBooking {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  accommodation?: { id: string; title: string };
  student?: { id: string; fullName: string; phone: string | null };
}
export interface PendingLandlord {
  userId: string;
  idCardNo: string;
  address: string;
  verifyStatus: string;
  user?: { fullName: string; phone: string | null };
}
