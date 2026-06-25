import Link from 'next/link';
import type { Accommodation } from '@/lib/api/accommodations';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';
import { Badge } from './ui';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);

export function RoomCard({ room }: { room: Accommodation }) {
  const cover = room.images?.[0]?.url;
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_ORIGIN}${cover}`}
            alt={room.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Chưa có ảnh
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Badge tone="brand">{ACCOMMODATION_TYPE_LABEL[room.type] ?? room.type}</Badge>
        </div>
        {!room.isAvailable && (
          <div className="absolute right-2 top-2">
            <Badge tone="danger">Hết phòng</Badge>
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 font-semibold text-slate-800 group-hover:text-brand">
          {room.title}
        </h3>
        <p className="text-lg font-bold text-brand">{formatVnd(room.price)}<span className="text-xs font-normal text-slate-400">/tháng</span></p>
        <p className="line-clamp-1 text-xs text-slate-500">
          📍 {room.area?.name ? `${room.area.name}` : room.address}
          {room.distanceKm ? ` · ${room.distanceKm}km tới trường` : ''}
        </p>
      </div>
    </Link>
  );
}
