'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';
import { formatVnd } from '@/lib/format';

/** Trang duyệt bài đăng chờ kiểm duyệt (DAL-13). */
export default function ModerationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'pending-accommodations'],
    queryFn: adminApi.pendingAccommodations,
  });

  const mutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'APPROVE' | 'REJECT'; reason?: string }) =>
      adminApi.moderateAccommodation(id, action, reason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-accommodations'] }),
  });

  const reject = (id: string) => {
    const reason = window.prompt('Lý do từ chối (bắt buộc):');
    if (reason && reason.trim()) {
      mutation.mutate({ id, action: 'REJECT', reason: reason.trim() });
    }
  };

  // Duyệt chủ trọ
  const landlords = useQuery({
    queryKey: ['admin', 'pending-landlords'],
    queryFn: adminApi.pendingLandlords,
  });
  const llMutation = useMutation({
    mutationFn: ({ userId, action, reason }: { userId: string; action: 'APPROVE' | 'REJECT'; reason?: string }) =>
      adminApi.moderateLandlord(userId, action, reason, action === 'APPROVE'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pending-landlords'] }),
  });
  const rejectLandlord = (userId: string) => {
    const reason = window.prompt('Lý do từ chối chủ trọ (bắt buộc):');
    if (reason && reason.trim()) llMutation.mutate({ userId, action: 'REJECT', reason: reason.trim() });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Duyệt bài đăng</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* Duyệt chủ trọ chờ xác minh */}
      {landlords.data && landlords.data.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Chủ trọ chờ xác minh</h2>
          <div className="space-y-2">
            {landlords.data.map((l) => (
              <div key={l.userId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{l.user?.fullName ?? 'Chủ trọ'}</p>
                  <p className="truncate text-xs text-slate-500">{l.user?.phone} · {l.address}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => llMutation.mutate({ userId: l.userId, action: 'APPROVE' })} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                    Duyệt
                  </button>
                  <button type="button" onClick={() => rejectLandlord(l.userId)} className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Bài đăng chờ duyệt</h2>

      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      {isError && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">
          Không tải được. Cần đăng nhập Admin và API đang chạy.
        </p>
      )}

      {data && data.length === 0 && (
        <p className="text-slate-500">🎉 Không có bài chờ duyệt.</p>
      )}

      <div className="space-y-3">
        {data?.map((room) => (
          <div key={room.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800">{room.title}</h3>
            <p className="text-sm text-brand">{formatVnd(room.price)}/tháng</p>
            <p className="text-sm text-slate-500">{room.address}</p>
            {room.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{room.description}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: room.id, action: 'APPROVE' })}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                ✓ Duyệt
              </button>
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => reject(room.id)}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                ✕ Từ chối
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
