/**
 * HTTP client tập trung — MỌI API call đi qua đây (service layer).
 * Quy tắc dự án: không fetch trực tiếp trong component.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

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
