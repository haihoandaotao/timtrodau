'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Badge, Card } from '@/components/ui';

const STATUSES = ['', 'PENDING', 'CONTACTED', 'SUCCESS', 'CANCELLED'];
const TONE: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  CONTACTED: 'neutral',
  SUCCESS: 'success',
  CANCELLED: 'danger',
};

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'bookings', status],
    queryFn: () => adminApi.bookings(status || undefined),
  });
  const setStat = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => adminApi.setBookingStatus(id, s),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] }),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Quản lý giữ chỗ</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">← Dashboard</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${status === s ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-600'}`}
          >
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      {isError && <p className="rounded bg-red-50 p-3 text-sm text-red-600">Cần đăng nhập Admin.</p>}

      <div className="space-y-2">
        {data?.data.map((b) => (
          <Card key={b.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{b.student?.fullName ?? 'SV'}</p>
                <p className="truncate text-xs text-slate-500">{b.accommodation?.title} · {b.student?.phone ?? '—'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={TONE[b.status] ?? 'neutral'}>{b.status}</Badge>
                <select
                  value={b.status}
                  onChange={(e) => setStat.mutate({ id: b.id, s: e.target.value })}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                >
                  {['PENDING', 'CONTACTED', 'SUCCESS', 'CANCELLED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ))}
        {data && data.data.length === 0 && <p className="text-slate-500">Không có booking.</p>}
      </div>
      {data && <p className="mt-3 text-sm text-slate-400">Tổng: {data.meta.total}</p>}
    </main>
  );
}
