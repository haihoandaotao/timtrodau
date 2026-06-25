'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { publicStatsApi } from '@/lib/api/public-stats';
import { useAuth } from '@/lib/auth-context';
import { RoomCard } from '@/components/RoomCard';
import { BarRow, LinkButton, Section, StatCard } from '@/components/ui';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const overview = useQuery({ queryKey: ['pub', 'overview'], queryFn: publicStatsApi.overview });
  const featured = useQuery({ queryKey: ['pub', 'featured'], queryFn: publicStatsApi.featured });
  const prices = useQuery({ queryKey: ['pub', 'prices'], queryFn: publicStatsApi.priceDistribution });
  const areas = useQuery({ queryKey: ['pub', 'areas'], queryFn: publicStatsApi.areaDistribution });

  const maxPrice = Math.max(1, ...(prices.data?.map((p) => p.count) ?? [1]));
  const maxArea = Math.max(1, ...(areas.data?.map((a) => a.count) ?? [1]));

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/search?keyword=${encodeURIComponent(q.trim())}` : '/search');
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-12">
      {/* HERO */}
      <section className="relative mt-5 overflow-hidden rounded-3xl bg-brand-gradient px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-white/80">Đại học Kiến trúc Đà Nẵng</p>
          <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-4xl">
            Tìm phòng trọ an toàn, gần trường cho tân sinh viên DAU
          </h1>
          <p className="mt-3 text-white/85">
            Nguồn trọ đã kiểm duyệt · giá minh bạch · kết nối trực tiếp chủ trọ.
          </p>
          <form onSubmit={search} className="mt-6 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo khu vực, tên phòng…"
              className="w-full rounded-xl border-0 px-4 py-3 text-slate-800 outline-none ring-2 ring-transparent focus:ring-white/50"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-brand transition hover:bg-white/90"
            >
              Tìm ngay
            </button>
          </form>
          {!user && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/register/student" className="rounded-lg bg-white/15 px-4 py-2 font-medium text-white ring-1 ring-white/30 transition hover:bg-white/25">
                🎓 Đăng ký tân sinh viên
              </Link>
              <Link href="/register/landlord" className="rounded-lg bg-white/15 px-4 py-2 font-medium text-white ring-1 ring-white/30 transition hover:bg-white/25">
                🏠 Đăng ký chủ trọ
              </Link>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-56 w-56 rounded-full bg-white/5" />
      </section>

      {/* SỐ LIỆU TỔNG QUAN */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tổng phòng trọ" value={overview.data?.totalRooms ?? '—'} icon="🏠" accent />
        <StatCard label="Phòng trọ truyền thống" value={overview.data?.traditional ?? '—'} icon="🛏️" />
        <StatCard label="Căn hộ mini" value={overview.data?.miniApt ?? '—'} icon="🏢" />
        <StatCard label="Lượt đăng ký giữ chỗ" value={overview.data?.totalRegistrations ?? '—'} icon="✅" />
      </div>

      {/* PHÒNG NỔI BẬT — chỉ hiện khi đã đăng nhập */}
      {user ? (
        <Section
          title="Phòng nổi bật"
          action={<LinkButton href="/search" variant="ghost">Xem tất cả →</LinkButton>}
        >
          {featured.isLoading && <p className="text-slate-500">Đang tải…</p>}
          {featured.data && featured.data.length === 0 && (
            <p className="text-slate-500">Chưa có phòng nào.</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.data?.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </Section>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-slate-600">
            🔒 <strong>Đăng nhập</strong> để xem danh sách phòng nổi bật và đăng ký giữ chỗ.
          </p>
          <LinkButton href="/login" className="mt-3" variant="primary">
            Đăng nhập / Đăng ký
          </LinkButton>
        </div>
      )}

      {/* BIỂU ĐỒ PHÂN BỐ */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 font-bold text-slate-800">Phân bố theo khoảng giá</h3>
          <div className="space-y-2.5">
            {prices.data?.map((p) => (
              <BarRow key={p.bucket} label={p.bucket} value={p.count} max={maxPrice} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 font-bold text-slate-800">Khu vực được quan tâm</h3>
          <div className="space-y-2.5">
            {areas.data && areas.data.length > 0 ? (
              areas.data.map((a) => <BarRow key={a.area} label={a.area} value={a.count} max={maxArea} />)
            ) : (
              <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
