'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Accommodation } from '@/lib/api/accommodations';
import { landlordApi } from '@/lib/api/landlord';
import { landlordProfileApi } from '@/lib/api/landlord-profile';
import { useAuth } from '@/lib/auth-context';
import { ACCOMMODATION_TYPE_LABEL, formatVnd } from '@/lib/format';
import { AccommodationForm } from '@/components/AccommodationForm';
import { Badge, Card, StatCard } from '@/components/ui';

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

  const stats = useQuery({ queryKey: ['landlord', 'stats'], queryFn: landlordApi.stats, enabled: !!user });
  const mine = useQuery({ queryKey: ['landlord', 'mine'], queryFn: landlordApi.mine, enabled: !!user });
  const bookings = useQuery({ queryKey: ['landlord', 'bookings'], queryFn: landlordApi.bookings, enabled: !!user });

  const create = useMutation({
    mutationFn: (payload: Parameters<typeof landlordApi.create>[0]) => landlordApi.create(payload),
    onSuccess: invalidate,
  });
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

      {/* Hồ sơ chỗ trọ */}
      <ProfileCard />

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Bài đã duyệt" value={stats.data?.publishedCount ?? '—'} icon="🏠" accent />
        <StatCard label="Lượt tiếp cận" value={stats.data?.totalViews ?? '—'} icon="👀" />
        <StatCard label="Lượt giữ chỗ" value={stats.data?.totalBookings ?? '—'} icon="📝" />
        <StatCard label="Đặt thành công" value={stats.data?.successBookings ?? '—'} icon="✅" />
      </div>

      {/* Đăng bài */}
      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Đăng bài cho thuê mới</h2>
        <AccommodationForm
          submitLabel="Đăng bài (chờ duyệt)"
          pending={create.isPending}
          onSubmit={(payload) =>
            create.mutate(payload, {
              onSuccess: () => window.alert('Đã gửi bài đăng — chờ duyệt. Thêm ảnh ở danh sách bên dưới.'),
            })
          }
        />
      </Card>

      {/* Bài đăng của tôi */}
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

      {/* Lượt giữ chỗ */}
      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">Lượt giữ chỗ phòng của bạn</h2>
      <div className="space-y-2">
        {bookings.data?.map((b) => (
          <Card key={b.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{b.student?.fullName ?? 'Sinh viên'}</p>
                <p className="truncate text-xs text-slate-500">{b.accommodation?.title}</p>
                {b.student?.phone ? (
                  <a href={`tel:${b.student.phone}`} className="text-sm font-medium text-brand">📞 {b.student.phone}</a>
                ) : (
                  <span className="text-xs text-slate-400">SV chưa cập nhật SĐT</span>
                )}
              </div>
              <Badge tone={b.status === 'SUCCESS' ? 'success' : b.status === 'CANCELLED' ? 'danger' : 'warning'}>
                {b.status}
              </Badge>
            </div>
            {BOOKING_NEXT[b.status] && (
              <div className="mt-2 flex gap-2">
                {BOOKING_NEXT[b.status].map((a) => (
                  <button key={a.status} type="button" onClick={() => bookingStatus.mutate({ id: b.id, status: a.status })} className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-brand hover:text-brand">
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

function ProfileCard() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['landlord', 'profile'], queryFn: landlordProfileApi.getMine });
  const [form, setForm] = useState({ representativeName: '', phone: '', address: '' });
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  // Đồng bộ form khi tải xong (1 lần).
  if (data && !editing && form.representativeName === '' && form.phone === '' && form.address === '') {
    if (data.representativeName || data.phone || data.address) {
      setForm({
        representativeName: data.representativeName ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
      });
    }
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['landlord', 'profile'] });
  const save = useMutation({
    mutationFn: () => landlordProfileApi.update(form),
    onSuccess: () => { setMsg('Đã lưu hồ sơ.'); setEditing(false); invalidate(); },
  });

  const uploadPhoto = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      await landlordProfileApi.uploadPhoto(file);
      invalidate();
    } finally {
      setUploading(false);
    }
  };

  const incomplete = data && !data.completed;

  return (
    <Card className={`mb-6 p-5 ${incomplete ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Hồ sơ chỗ trọ</h2>
          {incomplete && (
            <p className="mt-0.5 text-sm text-amber-600">⚠️ Vui lòng hoàn thiện thông tin để được duyệt.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            {data?.representativePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_ORIGIN}${data.representativePhotoUrl}`} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-slate-400">Ảnh</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Người đại diện</span>
          <input className="inp" value={form.representativeName} onChange={(e) => { setForm({ ...form, representativeName: e.target.value }); setEditing(true); }} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại liên hệ</span>
          <input className="inp" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setEditing(true); }} placeholder="0905xxxxxx" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ chỗ trọ</span>
          <input className="inp" value={form.address} onChange={(e) => { setForm({ ...form, address: e.target.value }); setEditing(true); }} placeholder="Số nhà, đường, phường/xã, quận" />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {save.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
        <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-brand">
          {uploading ? 'Đang tải…' : '📷 Ảnh mặt đại diện'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
        </label>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
        {data?.email && <span className="ml-auto text-xs text-slate-400">{data.email}</span>}
      </div>
    </Card>
  );
}

function ListingCard({ room, onChanged }: { room: Accommodation; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['landlord'] });
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toggle = useMutation({ mutationFn: (v: boolean) => landlordApi.toggleAvailability(room.id, v), onSuccess: onChanged });
  const save = useMutation({
    mutationFn: (payload: Parameters<typeof landlordApi.update>[1]) => landlordApi.update(room.id, payload),
    onSuccess: () => { setEditing(false); onChanged(); },
  });
  const remove = useMutation({ mutationFn: () => landlordApi.remove(room.id), onSuccess: onChanged });
  const delImage = useMutation({ mutationFn: (imageId: string) => landlordApi.deleteImage(room.id, imageId), onSuccess: refresh });

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await landlordApi.uploadImages(room.id, files);
      refresh();
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
            <span className="text-xs text-slate-400">👀 {room.views ?? 0}</span>
          </div>
          <p className="mt-1 truncate font-semibold text-slate-800">{room.title}</p>
          <p className="text-sm text-brand">{formatVnd(room.price)}/tháng</p>
          {room.status === 'REJECTED' && room.rejectReason && (
            <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600">Lý do từ chối: {room.rejectReason}</p>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs">
          <span className={room.isAvailable ? 'text-green-600' : 'text-slate-400'}>{room.isAvailable ? 'Còn' : 'Hết'}</span>
          <input type="checkbox" checked={room.isAvailable} onChange={(e) => toggle.mutate(e.target.checked)} className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition checked:bg-brand" />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-slate-300 px-3 py-1 text-slate-600 hover:border-brand">
          {editing ? '✕ Đóng' : '✏️ Sửa'}
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1 text-slate-600 hover:border-brand">
          {uploading ? 'Đang tải…' : '📷 Thêm ảnh'}
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
        <button type="button" onClick={() => window.confirm('Xoá bài đăng này?') && remove.mutate()} className="rounded-lg border border-red-300 px-3 py-1 text-red-500 hover:bg-red-50">
          🗑 Xoá bài
        </button>
      </div>

      {/* Quản lý ảnh */}
      {room.images && room.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {room.images.map((img) => (
            <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${API_ORIGIN}${img.url}`} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => delImage.mutate(img.id)} className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/60 text-xs text-white hover:bg-red-600">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sửa đầy đủ */}
      {editing && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="mb-2 text-xs text-slate-500">Lưu ý: sửa nội dung sẽ đưa bài về trạng thái chờ duyệt.</p>
          <AccommodationForm
            initial={room}
            submitLabel="Lưu thay đổi"
            pending={save.isPending}
            onSubmit={(payload) => save.mutate(payload)}
          />
        </div>
      )}
    </Card>
  );
}
