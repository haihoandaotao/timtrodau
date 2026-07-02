'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { Accommodation } from '@/lib/api/accommodations';
import { adminApi } from '@/lib/api/admin';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';
import { Badge } from '@/components/ui';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);
const COST_LABEL: Record<string, string> = {
  electricity: 'Điện',
  water: 'Nước',
  sanitation: 'Vệ sinh',
  internet: 'Mạng',
};

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

  // Cấu hình tự động duyệt bài
  const settings = useQuery({
    queryKey: ['admin', 'moderation-settings'],
    queryFn: adminApi.moderationSettings,
  });
  const autoApproveMutation = useMutation({
    mutationFn: (autoApprove: boolean) => adminApi.setAutoApprove(autoApprove),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-settings'] }),
  });
  const autoApprove = settings.data?.autoApprove ?? false;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Duyệt bài đăng</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* Chế độ duyệt bài: tự động hay thủ công */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">Chế độ duyệt bài</p>
            <p className="text-xs text-slate-500">
              {autoApprove
                ? 'Tự động duyệt: bài đăng mới được công khai ngay, không cần admin xét.'
                : 'Duyệt thủ công: bài đăng mới ở trạng thái chờ, admin nhận email và xét duyệt tại đây.'}
            </p>
          </div>
          <button
            type="button"
            disabled={settings.isLoading || autoApproveMutation.isPending}
            onClick={() => autoApproveMutation.mutate(!autoApprove)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
              autoApprove ? 'bg-green-600' : 'bg-slate-300'
            }`}
            aria-label="Bật/tắt tự động duyệt"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                autoApprove ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-600">
          Trạng thái: {autoApprove ? '✅ Tự động duyệt' : '✋ Duyệt thủ công'}
        </p>
      </section>

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
          <PendingCard
            key={room.id}
            room={room}
            disabled={mutation.isPending}
            onApprove={() => mutation.mutate({ id: room.id, action: 'APPROVE' })}
            onReject={() => reject(room.id)}
          />
        ))}
      </div>
    </main>
  );
}

function PendingCard({
  room,
  disabled,
  onApprove,
  onReject,
}: {
  room: Accommodation;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const costs = room.extraCosts
    ? Object.entries(room.extraCosts).filter(([, v]) => v && String(v).trim())
    : [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">{ACCOMMODATION_TYPE_LABEL[room.type] ?? room.type}</Badge>
        {room.area?.name && <Badge tone="neutral">{room.area.name}</Badge>}
        {room.distanceKm && <span className="text-xs text-slate-400">{room.distanceKm}km tới trường</span>}
      </div>
      <h3 className="mt-1 text-lg font-semibold text-slate-800">{room.title}</h3>
      <p className="text-brand font-bold">{formatVnd(room.price)}/tháng</p>
      <p className="text-sm text-slate-500">📍 {room.address}</p>

      {/* Ảnh */}
      {room.images && room.images.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {room.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={`${API_ORIGIN}${img.url}`}
              alt=""
              className="h-28 w-40 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-amber-600">⚠️ Bài chưa có ảnh.</p>
      )}

      {/* Mô tả đầy đủ */}
      {room.description && (
        <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{room.description}</p>
      )}

      {/* Tiện ích */}
      {room.amenities && room.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {room.amenities.map((am) => (
            <span key={am.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {am.label}
            </span>
          ))}
        </div>
      )}

      {/* Chi phí dịch vụ */}
      {costs.length > 0 && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Chi phí phát sinh</p>
          <ul className="space-y-0.5 text-sm text-slate-700">
            {costs.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{COST_LABEL[k] ?? k}</span>
                <span className="font-medium">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bản đồ */}
      {room.mapUrl && (
        <a href={room.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          🗺️ Xem vị trí trên Google Maps
        </a>
      )}

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        <button type="button" disabled={disabled} onClick={onApprove} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white disabled:opacity-60">
          ✓ Duyệt
        </button>
        <button type="button" disabled={disabled} onClick={onReject} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white disabled:opacity-60">
          ✕ Từ chối
        </button>
      </div>
    </div>
  );
}
