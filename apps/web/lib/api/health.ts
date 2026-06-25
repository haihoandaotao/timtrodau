import { apiFetch } from './client';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export const healthApi = {
  check: () => apiFetch<HealthResponse>('/health'),
};
