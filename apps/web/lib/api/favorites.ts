import { apiFetch } from './client';
import type { Accommodation } from './accommodations';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const favoritesApi = {
  list: () => apiFetch<Accommodation[]>('/favorites', { headers: authHeaders() }),
  ids: () => apiFetch<string[]>('/favorites/ids', { headers: authHeaders() }),
  add: (accommodationId: string) =>
    apiFetch<{ success: boolean }>('/favorites', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ accommodationId }),
    }),
  remove: (accommodationId: string) =>
    apiFetch<{ success: boolean }>(`/favorites/${accommodationId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
};
