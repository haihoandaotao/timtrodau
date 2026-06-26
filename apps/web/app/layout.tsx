import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'DAU Accommodation Link',
  description: 'Hỗ trợ tìm kiếm & đăng ký phòng trọ cho tân sinh viên DAU',
};

// Mobile-first: viewport tối ưu cho điện thoại.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
