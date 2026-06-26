'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { accommodationsApi, type Accommodation, type AccommodationType } from '@/lib/api/accommodations';
import type { CreateAccommodationPayload } from '@/lib/api/landlord';
import { ACCOMMODATION_TYPE_LABEL } from '@/lib/format';

const TYPES: AccommodationType[] = ['TRADITIONAL', 'MINI_APT', 'SHARED'];

/** Form đăng/sửa bài — dùng chung. Trả payload qua onSubmit. */
export function AccommodationForm({
  initial,
  submitLabel,
  onSubmit,
  pending,
}: {
  initial?: Accommodation;
  submitLabel: string;
  onSubmit: (payload: CreateAccommodationPayload) => void;
  pending?: boolean;
}) {
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: accommodationsApi.areas });
  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: accommodationsApi.amenities });

  const [form, setForm] = useState<CreateAccommodationPayload>({
    title: initial?.title ?? '',
    description: initial?.description ?? undefined,
    price: initial ? Number(initial.price) : 2000000,
    type: initial?.type ?? 'TRADITIONAL',
    address: initial?.address ?? '',
    mapUrl: initial?.mapUrl ?? undefined,
    areaId: initial?.areaId ?? undefined,
    distanceKm: initial?.distanceKm ? Number(initial.distanceKm) : undefined,
    extraCosts: (initial?.extraCosts as CreateAccommodationPayload['extraCosts']) ?? {},
  });
  const [amenityIds, setAmenityIds] = useState<number[]>(
    initial?.amenities?.map((a) => a.id) ?? [],
  );

  const setCost = (k: 'electricity' | 'water' | 'sanitation' | 'internet', v: string) =>
    setForm((f) => ({ ...f, extraCosts: { ...f.extraCosts, [k]: v } }));
  const toggleAmenity = (id: number) =>
    setAmenityIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ec = Object.entries(form.extraCosts ?? {}).filter(([, v]) => v && v.trim());
    onSubmit({
      ...form,
      amenityIds: amenityIds.length ? amenityIds : undefined,
      extraCosts: ec.length ? Object.fromEntries(ec) : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="inp" placeholder="Tiêu đề (VD: Phòng trọ Hòa Xuân gần DAU)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <div className="grid grid-cols-2 gap-3">
        <input className="inp" type="number" placeholder="Giá (VND/tháng)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
        <select className="inp" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccommodationType })}>
          {TYPES.map((t) => <option key={t} value={t}>{ACCOMMODATION_TYPE_LABEL[t]}</option>)}
        </select>
      </div>
      <input className="inp" placeholder="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
      <input className="inp" placeholder="Link Google Maps (tuỳ chọn, dán từ Google Maps)" value={form.mapUrl ?? ''} onChange={(e) => setForm({ ...form, mapUrl: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <select className="inp" value={form.areaId ?? ''} onChange={(e) => setForm({ ...form, areaId: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">— Phường/xã —</option>
          {areas?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="inp" type="number" step="0.1" placeholder="Cách trường (km)" value={form.distanceKm ?? ''} onChange={(e) => setForm({ ...form, distanceKm: e.target.value ? Number(e.target.value) : undefined })} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">Chi phí dịch vụ (tuỳ chọn)</p>
        <div className="grid grid-cols-2 gap-3">
          <input className="inp" placeholder="Điện (VD: 3.500đ/kWh)" value={form.extraCosts?.electricity ?? ''} onChange={(e) => setCost('electricity', e.target.value)} />
          <input className="inp" placeholder="Nước (VD: 100k/người/tháng)" value={form.extraCosts?.water ?? ''} onChange={(e) => setCost('water', e.target.value)} />
          <input className="inp" placeholder="Vệ sinh/rác (VD: 20k/tháng)" value={form.extraCosts?.sanitation ?? ''} onChange={(e) => setCost('sanitation', e.target.value)} />
          <input className="inp" placeholder="Mạng/Internet (VD: Miễn phí)" value={form.extraCosts?.internet ?? ''} onChange={(e) => setCost('internet', e.target.value)} />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">Tiện ích</p>
        <div className="flex flex-wrap gap-2">
          {amenities?.map((am) => (
            <button type="button" key={am.id} onClick={() => toggleAmenity(am.id)} className={`rounded-full border px-3 py-1 text-sm transition ${amenityIds.includes(am.id) ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-600 hover:border-brand'}`}>
              {am.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">Mô tả chi tiết</p>
        <textarea
          className="inp min-h-[200px] leading-relaxed"
          rows={9}
          placeholder="Mô tả chi tiết: vị trí, diện tích, nội thất, an ninh, giờ giấc, ưu đãi… (mỗi ý một dòng để dễ đọc)"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <button type="submit" disabled={pending} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
        {pending ? 'Đang lưu…' : submitLabel}
      </button>
    </form>
  );
}
