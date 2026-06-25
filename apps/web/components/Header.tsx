'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên',
  LANDLORD: 'Chủ trọ',
  ADMIN: 'Quản trị',
};

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
            D
          </span>
          <span className="font-bold text-slate-800">
            DAU <span className="text-brand">Accommodation</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/search"
            className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-brand"
          >
            Tìm phòng
          </Link>
          {!loading && user?.role === 'LANDLORD' && (
            <Link
              href="/landlord"
              className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-brand"
            >
              Cho thuê
            </Link>
          )}
          {!loading && user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-brand"
            >
              Quản trị
            </Link>
          )}
          {!loading &&
            (user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {user.fullName} · {ROLE_LABEL[user.role] ?? user.role}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 transition hover:border-brand hover:text-brand"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-brand px-4 py-1.5 font-medium text-white transition hover:bg-brand-dark"
              >
                Đăng nhập
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
