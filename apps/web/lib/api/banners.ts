import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface BannerSlide {
  id: string;
  headerLabel: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface BannerPayload {
  title?: string;
  subtitle?: string;
  headerLabel?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/** Công khai: slide đang bật cho carousel trang chủ. */
export const bannersApi = {
  list: () => apiFetch<BannerSlide[]>('/banners'),
};

/** Admin: quản lý slide banner. */
export const bannerAdminApi = {
  list: () => apiFetch<BannerSlide[]>('/admin/banners', { headers: authHeaders() }),
  create: (payload: BannerPayload) =>
    apiFetch<BannerSlide>('/admin/banners', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: BannerPayload) =>
    apiFetch<BannerSlide>(`/admin/banners/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/banners/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),
  uploadImage: async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE_URL}/admin/banners/${id}/image`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error(`Tải ảnh thất bại (HTTP ${res.status})`);
    return res.json() as Promise<BannerSlide>;
  },
};
