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

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Duyệt bài đăng</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </div>

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
