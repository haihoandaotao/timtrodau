import { apiFetch } from './client';
import type { Accommodation, AccommodationType } from './accommodations';
import { getAccessToken } from '../auth-token';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CreateAccommodationPayload {
  title: string;
  description?: string;
  price: number;
  type: AccommodationType;
  address: string;
  mapUrl?: string;
  areaId?: number;
  distanceKm?: number;
  amenityIds?: number[];
  extraCosts?: { electricity?: string; water?: string; sanitation?: string; internet?: string };
}

export interface LandlordStats {
  publishedCount: number;
  totalViews: number;
  totalBookings: number;
  successBookings: number;
}

export interface LandlordBooking {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  accommodation?: { id: string; title: string };
  student?: { id: string; fullName: string; phone: string | null };
}

export const landlordApi = {
  create: (payload: CreateAccommodationPayload) =>
    apiFetch<Accommodation>('/accommodations', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<CreateAccommodationPayload>) =>
    apiFetch<Accommodation>(`/accommodations/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/accommodations/${id}`, { method: 'DELETE', headers: authHeaders() }),

  mine: () => apiFetch<Accommodation[]>('/accommodations/mine', { headers: authHeaders() }),

  stats: () => apiFetch<LandlordStats>('/accommodations/landlord/stats', { headers: authHeaders() }),

  deleteImage: (accId: string, imageId: string) =>
    apiFetch<{ success: boolean }>(`/accommodations/${accId}/images/${imageId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  toggleAvailability: (id: string, isAvailable: boolean) =>
    apiFetch<Accommodation>(`/accommodations/${id}/availability`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isAvailable }),
    }),

  /** Upload nhiều ảnh (multipart). Không set Content-Type để browser tự đặt boundary. */
  uploadImages: async (id: string, files: FileList | File[]) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    const res = await fetch(`${API_BASE_URL}/accommodations/${id}/images`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
    if (!res.ok) {
      throw new Error(`Upload thất bại (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Booking của phòng mình
  bookings: () => apiFetch<LandlordBooking[]>('/bookings/landlord', { headers: authHeaders() }),
  setBookingStatus: (id: string, status: string) =>
    apiFetch<unknown>(`/bookings/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),
};
