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
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-brand">
          DAU Accommodation
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/search" className="text-slate-600 hover:text-brand">
            Tìm phòng
          </Link>
          {!loading && user && user.role === 'ADMIN' && (
            <Link href="/admin" className="text-slate-600 hover:text-brand">
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
                  className="rounded-lg border border-slate-300 px-3 py-1 text-slate-600 hover:border-brand"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link href="/login" className="rounded-lg bg-brand px-3 py-1 text-white">
                Đăng nhập
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
