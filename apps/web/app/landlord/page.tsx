'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { accommodationsApi, type Accommodation, type AccommodationType } from '@/lib/api/accommodations';
import { landlordApi, type CreateAccommodationPayload } from '@/lib/api/landlord';
import { useAuth } from '@/lib/auth-context';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';
import { Badge, Card } from '@/components/ui';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);
const STATUS_TONE: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  HIDDEN: 'neutral',
  DRAFT: 'neutral',
};
const BOOKING_NEXT: Record<string, { label: string; status: string }[]> = {
  PENDING: [
    { label: 'Đã liên hệ', status: 'CONTACTED' },
    { label: 'Huỷ', status: 'CANCELLED' },
  ],
  CONTACTED: [
    { label: 'Thành công', status: 'SUCCESS' },
    { label: 'Huỷ', status: 'CANCELLED' },
  ],
};

export default function LandlordPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['landlord'] });
  const mine = useQuery({ queryKey: ['landlord', 'mine'], queryFn: landlordApi.mine, enabled: !!user });
  const bookings = useQuery({ queryKey: ['landlord', 'bookings'], queryFn: landlordApi.bookings, enabled: !!user });

  const bookingStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => landlordApi.setBookingStatus(id, status),
    onSuccess: invalidate,
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

      <CreateForm onCreated={invalidate} />

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">Bài đăng của tôi</h2>
      {mine.isLoading && <p className="text-slate-500">Đang tải…</p>}
      <div className="space-y-3">
        {mine.data?.map((room) => (
          <ListingCard key={room.id} room={room} onChanged={invalidate} />
        ))}
        {mine.data && mine.data.length === 0 && (
          <p className="text-slate-500">Chưa có bài đăng. Tạo bài đầu tiên ở trên.</p>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">Lượt giữ chỗ phòng của bạn</h2>
      <div className="space-y-2">
        {bookings.data?.map((b) => (
          <Card key={b.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{b.student?.fullName ?? 'Sinh viên'}</p>
                <p className="truncate text-xs text-slate-500">
                  {b.accommodation?.title} · {b.student?.phone ?? '—'}
                </p>
              </div>
              <Badge tone={b.status === 'SUCCESS' ? 'success' : b.status === 'CANCELLED' ? 'danger' : 'warning'}>
                {b.status}
              </Badge>
            </div>
            {BOOKING_NEXT[b.status] && (
              <div className="mt-2 flex gap-2">
                {BOOKING_NEXT[b.status].map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    onClick={() => bookingStatus.mutate({ id: b.id, status: a.status })}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-brand hover:text-brand"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
        {bookings.data && bookings.data.length === 0 && (
          <p className="text-slate-500">Chưa có lượt giữ chỗ nào.</p>
        )}
      </div>
    </main>
  );
}

function ListingCard({ room, onChanged }: { room: Accommodation; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(room.title);
  const [price, setPrice] = useState(Number(room.price));
  const [uploading, setUploading] = useState(false);

  const toggle = useMutation({
    mutationFn: (isAvailable: boolean) => landlordApi.toggleAvailability(room.id, isAvailable),
    onSuccess: onChanged,
  });
  const save = useMutation({
    mutationFn: () => landlordApi.update(room.id, { title, price }),
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
  });
  const remove = useMutation({ mutationFn: () => landlordApi.remove(room.id), onSuccess: onChanged });

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await landlordApi.uploadImages(room.id, files);
      queryClient.invalidateQueries({ queryKey: ['landlord', 'mine'] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {room.images?.[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_ORIGIN}${room.images[0].url}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">No ảnh</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[room.status ?? 'PENDING'] ?? 'neutral'}>{room.status}</Badge>
            <Badge tone="neutral">{ACCOMMODATION_TYPE_LABEL[room.type] ?? room.type}</Badge>
          </div>
          {editing ? (
            <div className="mt-2 space-y-2">
              <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="inp" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
          ) : (
            <>
              <p className="mt-1 truncate font-semibold text-slate-800">{room.title}</p>
              <p className="text-sm text-brand">{formatVnd(room.price)}/tháng</p>
            </>
          )}
          {room.status === 'REJECTED' && (room as { rejectReason?: string }).rejectReason && (
            <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
              Lý do từ chối: {(room as { rejectReason?: string }).rejectReason}
            </p>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs">
          <span className={room.isAvailable ? 'text-green-600' : 'text-slate-400'}>
            {room.isAvailable ? 'Còn' : 'Hết'}
          </span>
          <input
            type="checkbox"
            checked={room.isAvailable}
            onChange={(e) => toggle.mutate(e.target.checked)}
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition checked:bg-brand"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {editing ? (
          <>
            <button type="button" onClick={() => save.mutate()} className="rounded-lg bg-brand px-3 py-1 font-semibold text-white">
              Lưu (về chờ duyệt)
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-300 px-3 py-1 text-slate-600">
              Huỷ
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-slate-300 px-3 py-1 text-slate-600 hover:border-brand">
            ✏️ Sửa
          </button>
        )}
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1 text-slate-600 hover:border-brand">
          {uploading ? 'Đang tải ảnh…' : '📷 Thêm ảnh'}
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
        <button
          type="button"
          onClick={() => window.confirm('Xoá bài đăng này?') && remove.mutate()}
          className="rounded-lg border border-red-300 px-3 py-1 text-red-500 hover:bg-red-50"
        >
          🗑 Xoá
        </button>
        {room.images && room.images.length > 0 && (
          <span className="text-slate-400">{room.images.length} ảnh</span>
        )}
      </div>
    </Card>
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
      setMsg('Đã gửi bài đăng — chờ Ban quản trị duyệt. Thêm ảnh ở danh sách bên dưới.');
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
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
        <input className="inp" placeholder="Tiêu đề (VD: Phòng trọ Hòa Xuân gần DAU)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <input className="inp" type="number" placeholder="Giá (VND/tháng)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          <select className="inp" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AccommodationType })}>
            {TYPES.map((t) => <option key={t} value={t}>{ACCOMMODATION_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <input className="inp" placeholder="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <select className="inp" value={form.areaId ?? ''} onChange={(e) => setForm({ ...form, areaId: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">— Khu vực —</option>
            {areas?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input className="inp" type="number" step="0.1" placeholder="Cách trường (km)" value={form.distanceKm ?? ''} onChange={(e) => setForm({ ...form, distanceKm: e.target.value ? Number(e.target.value) : undefined })} />
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
        <textarea className="inp" rows={2} placeholder="Mô tả (tuỳ chọn)" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <button type="submit" disabled={create.isPending} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {create.isPending ? 'Đang gửi…' : 'Đăng bài (chờ duyệt)'}
        </button>
      </form>
    </Card>
  );
}
