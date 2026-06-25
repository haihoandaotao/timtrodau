'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { accommodationsApi, type AccommodationType } from '@/lib/api/accommodations';
import { landlordApi, type CreateAccommodationPayload } from '@/lib/api/landlord';
import { useAuth } from '@/lib/auth-context';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';
import { Badge, Card } from '@/components/ui';

const STATUS_TONE: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  HIDDEN: 'neutral',
  DRAFT: 'neutral',
};

export default function LandlordPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const mine = useQuery({ queryKey: ['landlord', 'mine'], queryFn: landlordApi.mine, enabled: !!user });

  const toggle = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      landlordApi.toggleAvailability(id, isAvailable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landlord', 'mine'] }),
  });

  if (!loading && (!user || user.role !== 'LANDLORD')) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center text-slate-500">
        Trang dành cho chủ trọ. Vui lòng đăng nhập bằng tài khoản chủ trọ đã được duyệt.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-800">Quản lý cho thuê</h1>

      <CreateForm onCreated={() => queryClient.invalidateQueries({ queryKey: ['landlord', 'mine'] })} />

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">Bài đăng của tôi</h2>
      {mine.isLoading && <p className="text-slate-500">Đang tải…</p>}
      <div className="space-y-3">
        {mine.data?.map((room) => (
          <Card key={room.id} className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[room.status ?? 'PENDING'] ?? 'neutral'}>{room.status}</Badge>
                <Badge tone="neutral">{ACCOMMODATION_TYPE_LABEL[room.type] ?? room.type}</Badge>
              </div>
              <p className="mt-1 truncate font-semibold text-slate-800">{room.title}</p>
              <p className="text-sm text-brand">{formatVnd(room.price)}/tháng</p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
              <span className={room.isAvailable ? 'text-green-600' : 'text-slate-400'}>
                {room.isAvailable ? 'Còn phòng' : 'Hết phòng'}
              </span>
              <input
                type="checkbox"
                checked={room.isAvailable}
                onChange={(e) => toggle.mutate({ id: room.id, isAvailable: e.target.checked })}
                className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition checked:bg-brand"
              />
            </label>
          </Card>
        ))}
        {mine.data && mine.data.length === 0 && (
          <p className="text-slate-500">Chưa có bài đăng. Tạo bài đầu tiên ở trên.</p>
        )}
      </div>
    </main>
  );
}

const TYPES: AccommodationType[] = ['TRADITIONAL', 'MINI_APT', 'SHARED'];

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: accommodationsApi.areas });
  const { data: amenities } = useQuery({ queryKey: ['amenities'], queryFn: accommodationsApi.amenities });

  const [form, setForm] = useState<CreateAccommodationPayload>({
    title: '',
    price: 2000000,
    type: 'TRADITIONAL',
    address: '',
  });
  const [amenityIds, setAmenityIds] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => landlordApi.create({ ...form, amenityIds: amenityIds.length ? amenityIds : undefined }),
    onSuccess: () => {
      setMsg('Đã gửi bài đăng — chờ Ban quản trị duyệt.');
      setError('');
      setForm({ title: '', price: 2000000, type: 'TRADITIONAL', address: '' });
      setAmenityIds([]);
      onCreated();
    },
    onError: (e) => setError((e as Error).message),
  });

  const toggleAmenity = (id: number) =>
    setAmenityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-lg font-bold text-slate-800">Đăng bài cho thuê mới</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-3"
      >
        <input className="inp" placeholder="Tiêu đề (VD: Phòng trọ Hòa Xuân gần DAU)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <input className="inp" type="number" placeholder="Giá (VND/tháng)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          <select className="inp" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccommodationType })}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOMMODATION_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <input className="inp" placeholder="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <select className="inp" value={form.areaId ?? ''} onChange={(e) => setForm({ ...form, areaId: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">— Khu vực —</option>
            {areas?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input className="inp" type="number" step="0.1" placeholder="Cách trường (km)" value={form.distanceKm ?? ''} onChange={(e) => setForm({ ...form, distanceKm: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">Tiện ích</p>
          <div className="flex flex-wrap gap-2">
            {amenities?.map((am) => (
              <button
                type="button"
                key={am.id}
                onClick={() => toggleAmenity(am.id)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  amenityIds.includes(am.id)
                    ? 'border-brand bg-brand text-white'
                    : 'border-slate-300 text-slate-600 hover:border-brand'
                }`}
              >
                {am.label}
              </button>
            ))}
          </div>
        </div>
        <textarea className="inp" rows={2} placeholder="Mô tả (tuỳ chọn)" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <button
          type="submit"
          disabled={create.isPending}
          className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {create.isPending ? 'Đang gửi…' : 'Đăng bài (chờ duyệt)'}
        </button>
      </form>
    </Card>
  );
}
