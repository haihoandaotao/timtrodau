'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { accommodationsApi } from '@/lib/api/accommodations';
import { BookingButton } from '@/components/BookingButton';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);

const EXTRA_COST_LABEL: Record<string, string> = {
  electricity: 'Điện',
  water: 'Nước',
  sanitation: 'Vệ sinh',
  internet: 'Mạng',
};

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const { data: room, isLoading, isError } = useQuery({
    queryKey: ['room', params.id],
    queryFn: () => accommodationsApi.getById(params.id),
  });

  if (isLoading) return <Centered>Đang tải…</Centered>;
  if (isError || !room) return <Centered>Không tìm thấy phòng này.</Centered>;

  const mapSrc =
    room.lat && room.lng
      ? `https://www.google.com/maps?q=${room.lat},${room.lng}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(room.address)}&output=embed`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/search" className="text-sm text-brand hover:underline">
        ← Quay lại tìm kiếm
      </Link>

      {/* Ảnh */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(room.images ?? []).slice(0, 4).map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={`${API_ORIGIN}${img.url}`}
            alt={room.title}
            className="aspect-video w-full rounded-lg object-cover"
          />
        ))}
        {(!room.images || room.images.length === 0) && (
          <div className="col-span-2 flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {ACCOMMODATION_TYPE_LABEL[room.type] ?? room.type}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              room.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}
          >
            {room.isAvailable ? 'Còn phòng' : 'Hết phòng'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">{room.title}</h1>
        <p className="text-2xl font-bold text-brand">{formatVnd(room.price)}/tháng</p>
        <p className="text-sm text-slate-500">{room.address}</p>
        {room.description && <p className="text-slate-700">{room.description}</p>}
      </div>

      {/* Chi phí phát sinh */}
      {room.extraCosts && (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Chi phí phát sinh</h2>
          <ul className="space-y-1 text-sm text-slate-700">
            {Object.entries(room.extraCosts).map(([k, v]) =>
              v ? (
                <li key={k} className="flex justify-between">
                  <span>{EXTRA_COST_LABEL[k] ?? k}</span>
                  <span className="font-medium">{v}</span>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {/* Tiện ích */}
      {room.amenities && room.amenities.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Tiện ích</h2>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((am) => (
              <span key={am.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {am.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Bản đồ */}
      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Vị trí</h2>
        <iframe
          title="map"
          src={mapSrc}
          className="h-64 w-full rounded-lg border-0"
          loading="lazy"
        />
      </section>

      {/* Giữ chỗ (DAL-11) */}
      <BookingButton accommodationId={room.id} disabled={!room.isAvailable} />
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4 text-slate-500">
      {children}
    </main>
  );
}
