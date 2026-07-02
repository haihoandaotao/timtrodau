import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type GenderPref = 'ANY' | 'MALE' | 'FEMALE';

export interface RoommateImage {
  id: string;
  url: string;
}

export interface RoommatePost {
  id: string;
  major: string;
  budget: string | null;
  address: string | null;
  contactPhone: string | null;
  genderPref: GenderPref;
  preferredAreaId: number | null;
  preferredArea?: { id: number; name: string } | null;
  description: string | null;
  images?: RoommateImage[];
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  studentId: string;
}

export interface CreateRoommatePayload {
  major: string;
  address: string;
  contactPhone: string;
  budget: number;
  genderPref?: GenderPref;
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
  /** Upload nhiều ảnh căn hộ (multipart). */
  uploadImages: async (id: string, files: FileList | File[]) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    const res = await fetch(`${API_BASE_URL}/roommates/${id}/images`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error(`Tải ảnh thất bại (HTTP ${res.status})`);
    return res.json();
  },
};
