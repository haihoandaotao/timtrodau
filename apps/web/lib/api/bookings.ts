import { apiFetch } from './client';

export interface BookingContact {
  phone: string | null;
  zalo: string | null;
}

export interface BookingResult {
  booking: { id: string; status: string };
  contact: BookingContact;
}

export const bookingsApi = {
  create: (accommodationId: string, note?: string, token?: string) =>
    apiFetch<BookingResult>('/bookings', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ accommodationId, note }),
    }),
};
