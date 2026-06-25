/** Lưu/đọc access token phía client (tạm thời localStorage cho MVP). */
const KEY = 'dal_access_token';

export function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(KEY) ?? undefined;
}

export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}
