'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { bannerAdminApi, type BannerSlide } from '@/lib/api/banners';
import { Card } from '@/components/ui';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: bannerAdminApi.list,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });

  const create = useMutation({
    mutationFn: () => bannerAdminApi.create({ title: 'Slide mới', headerLabel: 'Đại học Kiến trúc Đà Nẵng' }),
    onSuccess: invalidate,
  });
  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: BannerSlide; b: BannerSlide }) => {
      await Promise.all([
        bannerAdminApi.update(a.id, { sortOrder: b.sortOrder }),
        bannerAdminApi.update(b.id, { sortOrder: a.sortOrder }),
      ]);
    },
    onSuccess: invalidate,
  });

  const slides = data ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Banner trang chủ</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">← Dashboard</Link>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Các slide hiển thị cho khách chưa đăng nhập ở trang chủ. Chỉnh chữ, đổi ảnh nền, bật/tắt và sắp xếp thứ tự.
      </p>

      <button
        type="button"
        onClick={() => create.mutate()}
        disabled={create.isPending}
        className="mb-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        + Thêm slide
      </button>

      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      {isError && <p className="rounded bg-red-50 p-3 text-sm text-red-600">Cần đăng nhập Admin.</p>}

      <div className="space-y-4">
        {slides.map((s, i) => (
          <SlideCard
            key={s.id}
            slide={s}
            onChanged={invalidate}
            canUp={i > 0}
            canDown={i < slides.length - 1}
            onUp={() => swapOrder.mutate({ a: s, b: slides[i - 1] })}
            onDown={() => swapOrder.mutate({ a: s, b: slides[i + 1] })}
          />
        ))}
        {data && slides.length === 0 && (
          <p className="text-slate-500">Chưa có slide nào. Bấm “Thêm slide” để tạo.</p>
        )}
      </div>
    </main>
  );
}

function SlideCard({
  slide,
  onChanged,
  canUp,
  canDown,
  onUp,
  onDown,
}: {
  slide: BannerSlide;
  onChanged: () => void;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  const [headerLabel, setHeaderLabel] = useState(slide.headerLabel ?? '');
  const [title, setTitle] = useState(slide.title);
  const [subtitle, setSubtitle] = useState(slide.subtitle ?? '');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const save = useMutation({
    mutationFn: () => bannerAdminApi.update(slide.id, { headerLabel, title, subtitle }),
    onSuccess: () => { setMsg('Đã lưu.'); onChanged(); },
  });
  const toggle = useMutation({
    mutationFn: () => bannerAdminApi.update(slide.id, { isActive: !slide.isActive }),
    onSuccess: onChanged,
  });
  const remove = useMutation({ mutationFn: () => bannerAdminApi.remove(slide.id), onSuccess: onChanged });

  const upload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      await bannerAdminApi.uploadImage(slide.id, file);
      setMsg('Đã cập nhật ảnh nền.');
      onChanged();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const preview = slide.imageUrl
    ? slide.imageUrl.startsWith('/uploads')
      ? `${API_ORIGIN}${slide.imageUrl}`
      : slide.imageUrl
    : null;

  return (
    <Card className={`p-4 ${slide.isActive ? '' : 'opacity-60'}`}>
      {/* Xem trước */}
      <div className="relative mb-3 h-28 overflow-hidden rounded-xl">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-brand-gradient opacity-90" />
        <div className="relative z-10 flex h-full flex-col justify-center px-4 text-white">
          {headerLabel && <p className="text-[10px] text-white/80">{headerLabel}</p>}
          <p className="text-sm font-extrabold leading-tight">{title || '(chưa có tiêu đề)'}</p>
          {subtitle && <p className="mt-0.5 text-[11px] text-white/85 line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Dòng nhãn nhỏ</span>
          <input className="inp" value={headerLabel} onChange={(e) => setHeaderLabel(e.target.value)} placeholder="VD: Đại học Kiến trúc Đà Nẵng" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Tiêu đề</span>
          <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Phụ đề</span>
          <input className="inp" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {save.isPending ? 'Đang lưu…' : 'Lưu'}
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:border-brand">
          {uploading ? 'Đang tải…' : '📷 Ảnh nền'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        <button type="button" onClick={() => toggle.mutate()} className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${slide.isActive ? 'bg-amber-500' : 'bg-green-600'}`}>
          {slide.isActive ? 'Đang bật · Tắt' : 'Đang tắt · Bật'}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={onUp} disabled={!canUp} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600 disabled:opacity-40">↑</button>
          <button type="button" onClick={onDown} disabled={!canDown} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-600 disabled:opacity-40">↓</button>
          <button type="button" onClick={() => { if (confirm('Xoá slide này?')) remove.mutate(); }} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">Xoá</button>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-green-700">{msg}</p>}
    </Card>
  );
}
