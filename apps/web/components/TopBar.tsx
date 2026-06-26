'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useMobileNav } from '@/lib/mobile-nav';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'SINH VIÊN',
  LANDLORD: 'CHỦ TRỌ',
  ADMIN: 'ADMIN',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || 'U';
}

export function TopBar({ showMenuButton = false }: { showMenuButton?: boolean }) {
  const { user, loading } = useAuth();
  const { setOpen } = useMobileNav();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="KTĐ" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5 ring-1 ring-slate-200" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800">DAU ACCOMMODATION</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Hệ thống hỗ trợ tìm trọ</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" aria-label="Thông báo" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        {!loading &&
          (user ? (
            <Link href="/profile" className="flex items-center gap-2.5 rounded-full py-1 pl-2 pr-1 transition hover:bg-slate-100">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                <p className="text-[11px] font-medium text-brand">{ROLE_LABEL[user.role] ?? user.role}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {initials(user.fullName)}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
              Đăng nhập
            </Link>
          ))}
      </div>
    </header>
  );
}
