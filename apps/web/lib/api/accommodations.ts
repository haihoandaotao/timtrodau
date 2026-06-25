import { apiFetch } from './client';

export type AccommodationType = 'TRADITIONAL' | 'MINI_APT' | 'SHARED';

export interface Area {
  id: number;
  name: string;
  centerLat: string | null;
  centerLng: string | null;
}

export interface Amenity {
  id: number;
  code: string;
  label: string;
}

export interface AccommodationImage {
  id: string;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  sortOrder: number;
}

export interface Accommodation {
  id: string;
  title: string;
  description: string | null;
  price: string;
  type: AccommodationType;
  address: string;
  areaId: number | null;
  area: Area | null;
  lat: string | null;
  lng: string | null;
  distanceKm: string | null;
  extraCosts: Record<string, string> | null;
  isAvailable: boolean;
  images?: AccommodationImage[];
  amenities?: Amenity[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AccommodationFilter {
  keyword?: string;
  areaId?: number;
  distanceMax?: number;
  priceMin?: number;
  priceMax?: number;
  type?: AccommodationType;
  amenityIds?: number[];
  page?: number;
  limit?: number;
}

function toQueryString(filter: AccommodationFilter): string {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const accommodationsApi = {
  list: (filter: AccommodationFilter = {}) =>
    apiFetch<Paginated<Accommodation>>(`/accommodations${toQueryString(filter)}`),
  getById: (id: string) => apiFetch<Accommodation>(`/accommodations/${id}`),
  areas: () => apiFetch<Area[]>('/accommodations/areas'),
  amenities: () => apiFetch<Amenity[]>('/accommodations/amenities'),
};
