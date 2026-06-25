/**
 * HTTP client tập trung — MỌI API call đi qua đây (service layer).
 * Tự refresh access token khi gặp 401 (dùng refresh token đã lưu).
 */
import { getAccessToken, getRefreshToken, setAccessToken, clearAccessToken } from '../auth-token';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function doFetch<T>(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await doFetch<T>(path, options);

  // Token hết hạn → thử refresh 1 lần rồi gọi lại (trừ chính endpoint refresh).
  if (res.status === 401 && path !== '/auth/refresh' && getRefreshToken()) {
    const newToken = await tryRefresh();
    if (newToken) {
      const retried = await doFetch<T>(path, {
        ...options,
        headers: { ...(options.headers ?? {}), Authorization: `Bearer ${newToken}` },
      });
      res = retried;
    } else {
      clearAccessToken();
    }
  }

  if (!res.ok) {
    let body: ApiError | undefined;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // ignore parse error
    }
    throw new Error(
      body ? `${body.error}: ${JSON.stringify(body.message)}` : `HTTP ${res.status}`,
    );
  }

  return (await res.json()) as T;
}
