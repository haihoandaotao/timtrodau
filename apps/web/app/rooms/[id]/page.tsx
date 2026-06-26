'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { accommodationsApi } from '@/lib/api/accommodations';
import { BookingButton } from '@/components/BookingButton';
import { FavoriteButton } from '@/components/FavoriteButton';
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
  const [lightbox, setLightbox] = useState<string | null>(null);
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

      {/* Ảnh — bấm để xem lớn */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(room.images ?? []).map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={`${API_ORIGIN}${img.url}`}
            alt={room.title}
            onClick={() => setLightbox(`${API_ORIGIN}${img.url}`)}
            className="aspect-video w-full cursor-zoom-in rounded-lg object-cover transition hover:opacity-90"
          />
        ))}
        {(!room.images || room.images.length === 0) && (
          <div className="col-span-2 flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            Chưa có ảnh
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
      )}

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
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-800">{room.title}</h1>
          <FavoriteButton accommodationId={room.id} />
        </div>
        <p className="text-2xl font-bold text-brand">{formatVnd(room.price)}/tháng</p>
        <p className="text-sm text-slate-500">📍 {room.address}</p>
        {room.description && (
          <p className="whitespace-pre-line leading-relaxed text-slate-700">{room.description}</p>
        )}
      </div>

      {/* Liên hệ chủ trọ */}
      {room.landlord && (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Liên hệ chủ trọ</h2>
          <p className="font-medium text-slate-800">{room.landlord.fullName}</p>
          {room.landlord.phone && (
            <a href={`tel:${room.landlord.phone}`} className="text-brand hover:underline">
              📞 {room.landlord.phone}
            </a>
          )}
        </section>
      )}

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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-slate-400">Vị trí</h2>
          {room.mapUrl && (
            <a href={room.mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand hover:underline">
              🗺️ Mở Google Maps
            </a>
          )}
        </div>
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
