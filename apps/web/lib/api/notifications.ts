import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const notificationsApi = {
  list: (page = 1) =>
    apiFetch<Paginated<AppNotification>>(`/notifications?page=${page}`, { headers: authHeaders() }),
  unreadCount: () =>
    apiFetch<{ count: number }>('/notifications/unread-count', { headers: authHeaders() }),
  markRead: (id: string) =>
    apiFetch<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    }),
  markAllRead: () =>
    apiFetch<{ success: boolean }>('/notifications/read-all', {
      method: 'PATCH',
      headers: authHeaders(),
    }),
};
