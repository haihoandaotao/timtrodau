import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface RoommatePost {
  id: string;
  major: string;
  budget: string | null;
  preferredAreaId: number | null;
  preferredArea?: { id: number; name: string } | null;
  description: string | null;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  studentId: string;
}

export interface CreateRoommatePayload {
  major: string;
  budget?: number;
  preferredAreaId?: number;
  description?: string;
}

export const roommateApi = {
  list: (filter: { major?: string; areaId?: number; budgetMax?: number } = {}) => {
    const p = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => v !== undefined && v !== '' && p.append(k, String(v)));
    const qs = p.toString();
    return apiFetch<RoommatePost[]>(`/roommates${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
  },
  create: (payload: CreateRoommatePayload) =>
    apiFetch<RoommatePost>('/roommates', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),
  close: (id: string) =>
    apiFetch<RoommatePost>(`/roommates/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'CLOSED' }),
    }),
};
