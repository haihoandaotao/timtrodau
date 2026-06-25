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
};
