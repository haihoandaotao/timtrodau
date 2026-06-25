import Link from 'next/link';
import type { Accommodation } from '@/lib/api/accommodations';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);

export function RoomCard({ room }: { room: Accommodation }) {
  const cover = room.images?.[0]?.url;
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-video w-full bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_ORIGIN}${cover}`}
            alt={room.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Chưa có ảnh
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {ACCOMMODATION_TYPE_LABEL[room.type] ?? room.type}
          </span>
          {!room.isAvailable && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">Hết phòng</span>
          )}
        </div>
        <h3 className="line-clamp-2 font-semibold text-slate-800">{room.title}</h3>
        <p className="text-brand font-bold">{formatVnd(room.price)}/tháng</p>
        <p className="line-clamp-1 text-xs text-slate-500">
          {room.area?.name ? `${room.area.name} · ` : ''}
          {room.distanceKm ? `${room.distanceKm}km tới trường` : room.address}
        </p>
      </div>
    </Link>
  );
}
