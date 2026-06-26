'use client';

import { useEffect, useState } from 'react';

interface Slide {
  title: string;
  subtitle: string;
  /** Ảnh nền tuỳ chọn (đặt trong public/, vd /banner1.jpg). Không có → dùng gradient. */
  image?: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Tìm phòng trọ an toàn, gần trường DAU',
    subtitle: 'Nguồn trọ đã kiểm duyệt · giá minh bạch · kết nối trực tiếp chủ trọ.',
    image: '/banner1.jpg',
  },
  {
    title: 'Tân sinh viên 2026 — đăng ký ngay hôm nay',
    subtitle: 'Tạo tài khoản để lưu phòng, giữ chỗ và tìm bạn ở ghép cùng ngành.',
    image: '/banner2.jpg',
  },
  {
    title: 'Bạn là chủ trọ?',
    subtitle: 'Đăng tin cho thuê, tiếp cận hàng nghìn tân sinh viên DAU.',
    image: '/banner3.jpg',
  },
];

export function Carousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-64 overflow-hidden rounded-3xl sm:h-80">
      {SLIDES.map((s, i) => (
        <div
          key={s.title}
          className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        >
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-brand-gradient opacity-90" />
          <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-6 text-white sm:px-12">
            <p className="mb-1 text-sm font-medium text-white/80">Đại học Kiến trúc Đà Nẵng</p>
            <h2 className="text-balance text-2xl font-extrabold leading-tight sm:text-4xl">{s.title}</h2>
            <p className="mt-3 text-white/85">{s.subtitle}</p>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
