import { apiFetch } from './client';
import { getAccessToken } from '../auth-token';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  studentName: string;
  createdAt: string;
}

export interface LandlordReviewSummary {
  average: number;
  count: number;
  items: ReviewItem[];
}

export const reviewsApi = {
  /** Công khai: điểm + đánh giá chủ trọ của phòng đang xem. */
  byAccommodation: (accId: string) =>
    apiFetch<LandlordReviewSummary>(`/reviews/by-accommodation/${accId}`),

  /** SV đánh giá chủ trọ (dựa trên lượt giữ chỗ SUCCESS). */
  create: (bookingId: string, rating: number, comment?: string) =>
    apiFetch<{ id: string }>('/reviews', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ bookingId, rating, comment }),
    }),
};
