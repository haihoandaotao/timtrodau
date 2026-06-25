import { apiFetch } from './client';
import type { Accommodation, AccommodationType } from './accommodations';
import { getAccessToken } from '../auth-token';

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
  areaId?: number;
  distanceKm?: number;
  amenityIds?: number[];
  extraCosts?: { electricity?: string; water?: string; sanitation?: string; internet?: string };
}

export const landlordApi = {
  create: (payload: CreateAccommodationPayload) =>
    apiFetch<Accommodation>('/accommodations', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  mine: () => apiFetch<Accommodation[]>('/accommodations/mine', { headers: authHeaders() }),

  toggleAvailability: (id: string, isAvailable: boolean) =>
    apiFetch<Accommodation>(`/accommodations/${id}/availability`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isAvailable }),
    }),
};
