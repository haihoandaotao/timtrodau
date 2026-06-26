'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMobileNav } from '@/lib/mobile-nav';
import { Icon } from './icons';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

function navFor(role?: string): { group: string; items: NavItem[] }[] {
  const groups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Chung',
      items: [
        { href: '/', label: 'Trang chủ', icon: 'home' },
        { href: '/search', label: 'Tìm phòng', icon: 'search' },
      ],
    },
  ];
  if (role === 'STUDENT') {
    groups.push({
      group: 'Sinh viên',
      items: [
        { href: '/roommates', label: 'Tìm bạn ở ghép', icon: 'users' },
        { href: '/favorites', label: 'Phòng đã lưu', icon: 'heart' },
        { href: '/bookings', label: 'Lịch sử giữ chỗ', icon: 'clipboard' },
      ],
    });
  }
  if (role === 'LANDLORD') {
    groups.push({ group: 'Chủ trọ', items: [{ href: '/landlord', label: 'Quản lý cho thuê', icon: 'building' }] });
  }
  if (role === 'ADMIN') {
    groups.push({
      group: 'Quản trị',
      items: [
        { href: '/admin', label: 'Tổng quan', icon: 'grid' },
        { href: '/admin/moderation', label: 'Duyệt tin', icon: 'check' },
        { href: '/admin/bookings', label: 'Quản lý giữ chỗ', icon: 'list' },
        { href: '/admin/users', label: 'Người dùng & SV', icon: 'users' },
        { href: '/admin/majors', label: 'Cấu hình Ngành', icon: 'cap' },
        { href: '/admin/areas', label: 'Cấu hình Phường/xã', icon: 'pin' },
      ],
    });
  }
  if (role) {
    groups.push({ group: 'Tài khoản', items: [{ href: '/profile', label: 'Hồ sơ cá nhân', icon: 'gear' }] });
  }
  return groups;
}

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { open, setOpen } = useMobileNav();
  const pathname = usePathname();
  const groups = navFor(user?.role);

  const content = (
    <div className="flex h-full flex-col bg-brand-gradient text-white">
      {/* Logo */}
      <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="KTĐ" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
        <span className="text-lg font-bold leading-tight">
          DAU<br />
          <span className="text-xs font-medium text-white/70">Hệ thống tìm trọ</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {groups.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">{g.group}</p>
            <div className="space-y-1">
              {g.items.map((it) => {
                const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active ? 'bg-white/20 font-semibold text-white shadow-sm' : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    <Icon name={it.icon} />
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/15 p-3">
        <button type="button" onClick={() => { signOut(); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/85 transition hover:bg-white/10">
          <Icon name="logout" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{content}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
