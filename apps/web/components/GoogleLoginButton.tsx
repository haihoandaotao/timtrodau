'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { authApi, type LoginResult } from '@/lib/api/auth';

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (resp: { credential: string }) => void;
  }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

/**
 * Nút "Tiếp tục với Google" (Google Identity Services). Khi chọn tài khoản,
 * lấy ID token gửi về backend (/auth/google) để đăng nhập/đăng ký chủ trọ.
 */
export function GoogleLoginButton({ onSuccess }: { onSuccess: (res: LoginResult) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const render = () => {
    if (!window.google?.accounts?.id || !divRef.current || !CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (resp: { credential: string }) => {
        setError('');
        setLoading(true);
        try {
          onSuccess(await authApi.googleLogin(resp.credential));
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setLoading(false);
        }
      },
    });
    window.google.accounts.id.renderButton(divRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 300,
      locale: 'vi',
    });
  };

  // Nếu script đã tải sẵn (điều hướng nội bộ), render ngay.
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        Chưa cấu hình đăng nhập Google (NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={render} />
      <div ref={divRef} className="flex justify-center" />
      {loading && <p className="text-center text-sm text-slate-400">Đang đăng nhập…</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
