import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
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
          <Sidebar />
          <div className="min-h-screen lg:pl-60">
            <TopBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
