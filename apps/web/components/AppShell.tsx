'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Khung layout: sidebar chỉ hiện khi ĐÃ đăng nhập; khách chỉ thấy top bar + nội dung. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const showSidebar = !loading && !!user;

  return (
    <>
      {showSidebar && <Sidebar />}
      <div className={`min-h-screen ${showSidebar ? 'lg:pl-60' : ''}`}>
        <TopBar showMenuButton={showSidebar} />
        {children}
      </div>
    </>
  );
}
