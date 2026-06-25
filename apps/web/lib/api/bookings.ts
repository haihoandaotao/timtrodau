import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface BookingContact {
  phone: string | null;
  zalo: string | null;
}

export interface BookingResult {
  booking: { id: string; status: string };
  contact: BookingContact;
}

export interface MyBooking {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  accommodation?: { id: string; title: string; address: string; price: string };
}

export const bookingsApi = {
  create: (accommodationId: string, note?: string, token?: string) =>
    apiFetch<BookingResult>('/bookings', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ accommodationId, note }),
    }),

  /** SV: lịch sử giữ chỗ của mình. */
  mine: () => apiFetch<MyBooking[]>('/bookings/mine', { headers: authHeaders() }),
};
