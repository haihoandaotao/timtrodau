'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api/bookings';
import { useAuth } from '@/lib/auth-context';
import { formatVnd } from '@/lib/format';
import { Badge, Card } from '@/components/ui';

const TONE: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  CONTACTED: 'neutral',
  SUCCESS: 'success',
  CANCELLED: 'danger',
};
const LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  CONTACTED: 'Đã liên hệ',
  SUCCESS: 'Thành công',
  CANCELLED: 'Đã huỷ',
};

export default function MyBookingsPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: bookingsApi.mine,
    enabled: !!user,
  });

  if (!loading && (!user || user.role !== 'STUDENT')) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center text-slate-500">
        Vui lòng đăng nhập bằng tài khoản sinh viên để xem lịch sử giữ chỗ.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-800">Lịch sử giữ chỗ</h1>
      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      <div className="space-y-3">
        {data?.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/rooms/${b.accommodation?.id}`} className="font-semibold text-slate-800 hover:text-brand">
                  {b.accommodation?.title ?? 'Phòng'}
                </Link>
                <p className="text-sm text-slate-500">{b.accommodation?.address}</p>
                {b.accommodation?.price && (
                  <p className="text-sm text-brand">{formatVnd(b.accommodation.price)}/tháng</p>
                )}
              </div>
              <Badge tone={TONE[b.status] ?? 'neutral'}>{LABEL[b.status] ?? b.status}</Badge>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && (
          <p className="text-slate-500">
            Bạn chưa giữ chỗ phòng nào.{' '}
            <Link href="/search" className="text-brand hover:underline">
              Tìm phòng ngay
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
