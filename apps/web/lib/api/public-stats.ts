import { apiFetch } from './client';
import type { Accommodation } from './accommodations';

export interface PublicOverview {
  totalRooms: number;
  traditional: number;
  miniApt: number;
  shared: number;
  totalRegistrations: number;
}
export interface Bucket {
  bucket: string;
  count: number;
}
export interface AreaCount {
  area: string;
  count: number;
}

export const publicStatsApi = {
  overview: () => apiFetch<PublicOverview>('/public/stats/overview'),
  featured: () => apiFetch<Accommodation[]>('/public/stats/featured'),
  priceDistribution: () => apiFetch<Bucket[]>('/public/stats/price-distribution'),
  areaDistribution: () => apiFetch<AreaCount[]>('/public/stats/area-distribution'),
};
