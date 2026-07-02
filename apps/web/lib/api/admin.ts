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
  accommodationsByArea: () =>
    apiFetch<AreaCount[]>('/admin/stats/accommodations-by-area', { headers: authHeaders() }),
  trustedLandlords: () =>
    apiFetch<TrustedLandlord[]>('/admin/stats/trusted-landlords', { headers: authHeaders() }),
  prospectiveByMajor: () =>
    apiFetch<Array<{ major: string; count: number }>>('/admin/stats/prospective-by-major', {
      headers: authHeaders(),
    }),

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

  // Settings (cấu hình kiểm duyệt)
  moderationSettings: () =>
    apiFetch<{ autoApprove: boolean }>('/admin/settings/moderation', { headers: authHeaders() }),
  setAutoApprove: (autoApprove: boolean) =>
    apiFetch<{ autoApprove: boolean }>('/admin/settings/moderation', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ autoApprove }),
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
  deleteUser: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  // Chủ trọ (duyệt/hủy duyệt + hồ sơ chi tiết + thống kê)
  landlordStats: () =>
    apiFetch<LandlordStatsSummary>('/admin/users/landlords/stats', { headers: authHeaders() }),
  landlordDetail: (id: string) =>
    apiFetch<LandlordDetail>(`/admin/users/${id}/landlord`, { headers: authHeaders() }),
  setLandlordApproval: (id: string, approve: boolean) =>
    apiFetch<LandlordDetail>(`/admin/users/${id}/landlord-approval`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ approve }),
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

  // Tích hợp tuyển sinh
  admissionStatus: () =>
    apiFetch<{ configured: boolean; syncedCount: number }>('/admin/admission/status', {
      headers: authHeaders(),
    }),
  admissionSync: () =>
    apiFetch<{ synced: number; total: number }>('/admin/admission/sync', {
      method: 'POST',
      headers: authHeaders(),
    }),

  // Sinh viên trường (quản lý + thống kê)
  students: (params: { q?: string; major?: string; cohort?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.major) qs.set('major', params.major);
    if (params.cohort) qs.set('cohort', params.cohort);
    qs.set('page', String(params.page ?? 1));
    return apiFetch<Paginated<StudentRow>>(`/admin/students?${qs.toString()}`, {
      headers: authHeaders(),
    });
  },
  studentStats: () => apiFetch<StudentStatsData>('/admin/students/stats', { headers: authHeaders() }),

  // Tân sinh viên dự kiến (admission_candidates)
  admissionCandidates: (params: { q?: string; major?: string; source?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.major) qs.set('major', params.major);
    if (params.source) qs.set('source', params.source);
    qs.set('page', String(params.page ?? 1));
    return apiFetch<Paginated<CandidateRow>>(`/admin/admission/candidates?${qs.toString()}`, {
      headers: authHeaders(),
    });
  },
  candidateStats: () =>
    apiFetch<{ total: number; byMajor: Array<{ major: string; count: number }> }>(
      '/admin/admission/candidate-stats',
      { headers: authHeaders() },
    ),

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
export interface StudentRow {
  studentCode: string;
  fullName: string;
  major: string | null;
  dateOfBirth: string;
}
export interface StudentStatsData {
  total: number;
  byMajor: Array<{ major: string; count: number }>;
  byCohort: Array<{ cohort: string; count: number }>;
}
export interface CandidateRow {
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  intendedMajor: string | null;
  isSelfRegistered: boolean;
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
export interface LandlordStatsSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}
export interface LandlordDetail {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  createdAt: string;
  verifyStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  isTrusted: boolean;
  idCardNo: string | null;
  idCardImageUrl: string | null;
  address: string | null;
  representativeName: string | null;
  representativePhotoUrl: string | null;
}
