'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { bookingsApi, type MyBooking } from '@/lib/api/bookings';
import { reviewsApi } from '@/lib/api/reviews';
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
        {data?.map((b) => <BookingCard key={b.id} b={b} />)}
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

function BookingCard({ b }: { b: MyBooking }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const review = useMutation({
    mutationFn: () => reviewsApi.create(b.id, rating, comment.trim() || undefined),
    onSuccess: () => { setMsg('Cảm ơn bạn đã đánh giá!'); setOpen(false); },
    onError: (e) => setError((e as Error).message),
  });

  return (
    <Card className="p-4">
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

      {/* Đánh giá chủ trọ — chỉ khi giữ chỗ thành công */}
      {b.status === 'SUCCESS' && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {msg ? (
            <p className="text-sm text-green-700">{msg}</p>
          ) : !open ? (
            <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-brand hover:text-brand">
              ⭐ Đánh giá chủ trọ
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onClick={() => setRating(i)} className={`text-2xl ${i <= rating ? 'text-amber-500' : 'text-slate-300'}`} aria-label={`${i} sao`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea className="inp" rows={2} placeholder="Nhận xét về chủ trọ (tuỳ chọn)…" value={comment} onChange={(e) => setComment(e.target.value)} />
              {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => review.mutate()} disabled={review.isPending} className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
                  {review.isPending ? 'Đang gửi…' : 'Gửi đánh giá'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-500">
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
