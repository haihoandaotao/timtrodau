/** Lưu/đọc token phía client (tạm thời localStorage cho MVP). */
const ACCESS_KEY = 'dal_access_token';
const REFRESH_KEY = 'dal_refresh_token';

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ACCESS_KEY) ?? undefined;
}
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(ACCESS_KEY, token);
}
export function getRefreshToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(REFRESH_KEY) ?? undefined;
}
export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(REFRESH_KEY, token);
}
export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
}
