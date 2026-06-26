'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên',
  LANDLORD: 'Chủ trọ',
  ADMIN: 'Quản trị',
};

function navFor(role?: string): { group: string; items: NavItem[] }[] {
  const groups: { group: string; items: NavItem[] }[] = [
    { group: 'Chung', items: [{ href: '/', label: 'Trang chủ', icon: '🏠' }, { href: '/search', label: 'Tìm phòng', icon: '🔍' }] },
  ];
  if (role === 'STUDENT') {
    groups.push({
      group: 'Sinh viên',
      items: [
        { href: '/roommates', label: 'Tìm bạn ở ghép', icon: '👥' },
        { href: '/favorites', label: 'Phòng đã lưu', icon: '❤️' },
        { href: '/bookings', label: 'Lịch sử giữ chỗ', icon: '📝' },
      ],
    });
  }
  if (role === 'LANDLORD') {
    groups.push({ group: 'Chủ trọ', items: [{ href: '/landlord', label: 'Quản lý cho thuê', icon: '🏢' }] });
  }
  if (role === 'ADMIN') {
    groups.push({
      group: 'Quản trị',
      items: [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/moderation', label: 'Duyệt tin', icon: '✅' },
        { href: '/admin/bookings', label: 'Giữ chỗ', icon: '📋' },
        { href: '/admin/users', label: 'Người dùng', icon: '👤' },
        { href: '/admin/majors', label: 'Ngành học', icon: '🎓' },
        { href: '/admin/areas', label: 'Phường/xã', icon: '📍' },
      ],
    });
  }
  if (role) {
    groups.push({ group: 'Tài khoản', items: [{ href: '/profile', label: 'Hồ sơ', icon: '⚙️' }] });
  }
  return groups;
}

export function Sidebar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = navFor(user?.role);

  const NavContent = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-5 py-4" onClick={() => setOpen(false)}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-base font-bold text-white">D</span>
        <span className="font-bold text-slate-800">DAU <span className="text-brand">Accom.</span></span>
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{it.icon}</span>
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        {!loading && user ? (
          <div className="space-y-2">
            <Link href="/profile" onClick={() => setOpen(false)} className="block rounded-lg bg-slate-50 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{user.fullName}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[user.role] ?? user.role}</p>
            </Link>
            <button type="button" onClick={() => { signOut(); setOpen(false); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-brand hover:text-brand">
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg bg-brand px-3 py-2 text-center text-sm font-semibold text-white">
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Mở menu" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <Link href="/" className="font-bold text-slate-800">DAU <span className="text-brand">Accommodation</span></Link>
        <span className="w-8" />
      </div>

      {/* Desktop sidebar (fixed) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block">
        {NavContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">{NavContent}</aside>
        </div>
      )}
    </>
  );
}
