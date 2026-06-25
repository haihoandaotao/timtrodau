'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  accommodationsApi,
  type AccommodationFilter,
  type AccommodationType,
} from '@/lib/api/accommodations';
import { RoomCard } from '@/components/RoomCard';
import { ACCOMMODATION_TYPE_LABEL } from '@/lib/format';

const PRICE_RANGES: Array<{ label: string; priceMin?: number; priceMax?: number }> = [
  { label: 'Tất cả' },
  { label: 'Dưới 1.5tr', priceMax: 1_500_000 },
  { label: '1.5 - 2.5tr', priceMin: 1_500_000, priceMax: 2_500_000 },
  { label: 'Trên 2.5tr', priceMin: 2_500_000 },
];

const DISTANCES: Array<{ label: string; distanceMax?: number }> = [
  { label: 'Mọi khoảng cách' },
  { label: 'Dưới 1km', distanceMax: 1 },
  { label: 'Dưới 2km', distanceMax: 2 },
  { label: 'Dưới 5km', distanceMax: 5 },
];

const TYPES: AccommodationType[] = ['TRADITIONAL', 'MINI_APT', 'SHARED'];

export default function SearchPage() {
  const [priceIdx, setPriceIdx] = useState(0);
  const [distIdx, setDistIdx] = useState(0);
  const [type, setType] = useState<AccommodationType | undefined>(undefined);
  const [areaId, setAreaId] = useState<number | undefined>(undefined);
  const [amenityIds, setAmenityIds] = useState<number[]>([]);

  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: accommodationsApi.areas });
  const { data: amenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: accommodationsApi.amenities,
  });

  const filter: AccommodationFilter = useMemo(
    () => ({
      ...PRICE_RANGES[priceIdx],
      ...DISTANCES[distIdx],
      type,
      areaId,
      amenityIds: amenityIds.length ? amenityIds : undefined,
    }),
    [priceIdx, distIdx, type, areaId, amenityIds],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accommodations', filter],
    queryFn: () => accommodationsApi.list(filter),
  });

  const toggleAmenity = (id: number) =>
    setAmenityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-brand">Tìm phòng trọ gần DAU</h1>

      {/* Bộ lọc */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <FilterRow label="Mức giá">
          {PRICE_RANGES.map((r, i) => (
            <Chip key={r.label} active={priceIdx === i} onClick={() => setPriceIdx(i)}>
              {r.label}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Khoảng cách">
          {DISTANCES.map((d, i) => (
            <Chip key={d.label} active={distIdx === i} onClick={() => setDistIdx(i)}>
              {d.label}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Loại hình">
          <Chip active={type === undefined} onClick={() => setType(undefined)}>
            Tất cả
          </Chip>
          {TYPES.map((t) => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              {ACCOMMODATION_TYPE_LABEL[t]}
            </Chip>
          ))}
        </FilterRow>

        {areas && areas.length > 0 && (
          <FilterRow label="Khu vực">
            <Chip active={areaId === undefined} onClick={() => setAreaId(undefined)}>
              Tất cả
            </Chip>
            {areas.map((a) => (
              <Chip key={a.id} active={areaId === a.id} onClick={() => setAreaId(a.id)}>
                {a.name}
              </Chip>
            ))}
          </FilterRow>
        )}

        {amenities && amenities.length > 0 && (
          <FilterRow label="Tiện ích">
            {amenities.map((am) => (
              <Chip
                key={am.id}
                active={amenityIds.includes(am.id)}
                onClick={() => toggleAmenity(am.id)}
              >
                {am.label}
              </Chip>
            ))}
          </FilterRow>
        )}
      </div>

      {/* Kết quả */}
      <div className="mt-5">
        {isLoading && <p className="text-slate-500">Đang tải…</p>}
        {isError && (
          <p className="text-red-600">Không tải được dữ liệu. Kiểm tra API đang chạy.</p>
        )}
        {data && (
          <>
            <p className="mb-3 text-sm text-slate-500">Tìm thấy {data.meta.total} phòng</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.data.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
            {data.data.length === 0 && (
              <p className="text-slate-500">Không có phòng phù hợp bộ lọc.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? 'border-brand bg-brand text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:border-brand'
      }`}
    >
      {children}
    </button>
  );
}
