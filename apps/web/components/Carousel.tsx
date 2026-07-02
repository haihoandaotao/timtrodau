'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { bannersApi, type BannerSlide } from '@/lib/api/banners';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);

/** Slide dự phòng khi chưa cấu hình banner (hoặc API lỗi). */
const FALLBACK: BannerSlide[] = [
  {
    id: 'f1',
    headerLabel: 'Đại học Kiến trúc Đà Nẵng',
    title: 'Tìm phòng trọ an toàn, gần trường DAU',
    subtitle: 'Nguồn trọ đã kiểm duyệt · giá minh bạch · kết nối trực tiếp chủ trọ.',
    imageUrl: null,
    sortOrder: 1,
    isActive: true,
  },
];

/** Ghép URL ảnh: ảnh upload (/uploads/...) cần tiền tố origin của API. */
function imageSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_ORIGIN}${url}`;
  return url; // asset trong public/ (vd /banner1.jpg)
}

export function Carousel() {
  const { data } = useQuery({ queryKey: ['banners'], queryFn: bannersApi.list });
  const slides = data && data.length > 0 ? data : FALLBACK;
  const [idx, setIdx] = useState(0);

  // Reset index khi số slide thay đổi (tránh idx vượt mảng).
  useEffect(() => {
    setIdx(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative h-64 overflow-hidden rounded-3xl sm:h-80">
      {slides.map((s, i) => {
        const src = imageSrc(s.imageUrl);
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0 bg-brand-gradient opacity-90" />
            <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-6 text-white sm:px-12">
              {s.headerLabel && (
                <p className="mb-1 text-sm font-medium text-white/80">{s.headerLabel}</p>
              )}
              <h2 className="text-balance text-2xl font-extrabold leading-tight sm:text-4xl">{s.title}</h2>
              {s.subtitle && <p className="mt-3 text-white/85">{s.subtitle}</p>}
            </div>
          </div>
        );
      })}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
