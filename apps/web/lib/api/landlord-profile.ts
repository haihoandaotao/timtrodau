import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface LandlordProfile {
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  representativeName: string | null;
  representativePhotoUrl: string | null;
  verifyStatus: string;
  completed: boolean;
}

export const landlordProfileApi = {
  getMine: () => apiFetch<LandlordProfile>('/landlord/profile', { headers: authHeaders() }),

  update: (payload: { representativeName?: string; phone?: string; address?: string }) =>
    apiFetch<LandlordProfile>('/landlord/profile', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),

  uploadPhoto: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE_URL}/landlord/profile/photo`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error(`Upload thất bại (HTTP ${res.status})`);
    return res.json() as Promise<{ url: string }>;
  },
};
