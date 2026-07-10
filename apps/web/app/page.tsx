'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { publicStatsApi } from '@/lib/api/public-stats';
import { useAuth } from '@/lib/auth-context';
import { Carousel } from '@/components/Carousel';
import { RoomCard } from '@/components/RoomCard';
import { BarRow, LinkButton, Section } from '@/components/ui';

const FEATURES = [
  { icon: '🛡️', title: 'Đã kiểm duyệt', desc: 'Mọi tin đăng được Ban quản trị duyệt trước khi hiển thị.' },
  { icon: '💰', title: 'Giá minh bạch', desc: 'Giá thuê và chi phí điện/nước/dịch vụ công khai rõ ràng.' },
  { icon: '📞', title: 'Kết nối trực tiếp', desc: 'Liên hệ thẳng chủ trọ, không qua trung gian, không phí môi giới.' },
  { icon: '👥', title: 'Tìm bạn ở ghép', desc: 'Ghép cùng ngành để tiện học và chia sẻ chi phí phòng.' },
];

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
    <>
      <main className="mx-auto max-w-5xl px-4 pb-14 pt-5">
        {user ? (
          <>
            {/* Đã đăng nhập: hero có ô tìm kiếm */}
            <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-10 text-white sm:px-10 sm:py-14">
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
                  <button type="submit" className="shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-brand transition hover:bg-white/90">
                    Tìm ngay
                  </button>
                </form>
              </div>
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-16 right-16 h-56 w-56 rounded-full bg-white/5" />
            </section>

            <StatsStrip data={overview.data} />

            <Section
              title="Phòng nổi bật"
              action={<LinkButton href="/search" variant="ghost">Xem tất cả →</LinkButton>}
            >
              {featured.isLoading && <p className="text-slate-500">Đang tải…</p>}
              {featured.data && featured.data.length === 0 && (
                <p className="text-slate-500">Chưa có phòng nào.</p>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {featured.data?.map((room) => <RoomCard key={room.id} room={room} />)}
              </div>
            </Section>

            <MarketCharts
              prices={prices.data}
              areas={areas.data}
              maxPrice={maxPrice}
              maxArea={maxArea}
            />
          </>
        ) : (
          <>
            {/* Khách: banner + CTA gộp về thẻ chọn vai trò */}
            <Carousel />

            <section className="mt-6">
              <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
                Bắt đầu miễn phí — chọn đối tượng của bạn
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <RoleCard
                  href="/register/student"
                  icon="🎓"
                  title="Tôi là tân sinh viên"
                  desc="Tạo tài khoản để lưu phòng, giữ chỗ và tìm bạn ở ghép cùng ngành."
                />
                <RoleCard
                  href="/register/landlord"
                  icon="🏠"
                  title="Tôi là chủ trọ"
                  desc="Đăng tin cho thuê, tiếp cận hàng nghìn tân sinh viên DAU. Đăng nhập nhanh bằng Google."
                />
              </div>
              <p className="mt-4 text-center text-sm text-slate-500">
                Đã có tài khoản?{' '}
                <Link href="/login" className="font-semibold text-brand hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </section>

            <StatsStrip data={overview.data} />

            {/* Vì sao chọn */}
            <section className="mt-10">
              <h2 className="mb-5 text-center text-xl font-extrabold text-slate-800">
                Vì sao chọn DAU Accommodation?
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                      {f.icon}
                    </div>
                    <p className="mt-3 font-bold text-slate-800">{f.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Thị trường phòng trọ */}
            <div className="mt-10">
              <h2 className="mb-4 text-center text-xl font-extrabold text-slate-800">
                Thị trường phòng trọ quanh trường
              </h2>
              <MarketCharts
                prices={prices.data}
                areas={areas.data}
                maxPrice={maxPrice}
                maxArea={maxArea}
              />
            </div>

            {/* CTA cuối trang */}
            <section className="mt-10 overflow-hidden rounded-3xl bg-brand-gradient px-6 py-10 text-center text-white">
              <h2 className="text-2xl font-extrabold">Sẵn sàng tìm chỗ trọ phù hợp?</h2>
              <p className="mx-auto mt-2 max-w-md text-white/85">
                Đăng ký miễn phí để xem toàn bộ phòng đã kiểm duyệt và giữ chỗ trực tuyến.
              </p>
              <Link
                href="/register/student"
                className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand transition hover:bg-white/90"
              >
                Đăng ký ngay
              </Link>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}

/* ---------- Thành phần phụ ---------- */

function RoleCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card-hover"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-bold text-slate-800">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Đăng ký ngay <span className="transition group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  );
}

function StatsStrip({
  data,
}: {
  data?: { totalRooms: number; traditional: number; miniApt: number; totalRegistrations: number };
}) {
  const items = [
    { label: 'Tổng phòng trọ', value: data?.totalRooms },
    { label: 'Phòng truyền thống', value: data?.traditional },
    { label: 'Căn hộ mini', value: data?.miniApt },
    { label: 'Lượt giữ chỗ', value: data?.totalRegistrations },
  ];
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <p className="text-2xl font-extrabold text-brand">{it.value ?? '—'}</p>
            <p className="mt-0.5 text-xs text-slate-500">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketCharts({
  prices,
  areas,
  maxPrice,
  maxArea,
}: {
  prices?: Array<{ bucket: string; count: number }>;
  areas?: Array<{ area: string; count: number }>;
  maxPrice: number;
  maxArea: number;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="mb-3 font-bold text-slate-800">Phân bố theo khoảng giá</h3>
        <div className="space-y-2.5">
          {prices?.map((p) => <BarRow key={p.bucket} label={p.bucket} value={p.count} max={maxPrice} />)}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="mb-3 font-bold text-slate-800">Khu vực được quan tâm</h3>
        <div className="space-y-2.5">
          {areas && areas.length > 0 ? (
            areas.map((a) => <BarRow key={a.area} label={a.area} value={a.count} max={maxArea} />)
          ) : (
            <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-bold text-slate-800">DAU Accommodation</p>
          <p className="text-sm text-slate-500">Hệ thống hỗ trợ tìm trọ cho tân sinh viên DAU</p>
        </div>
        <p className="text-xs text-slate-400">© Trường Đại học Kiến trúc Đà Nẵng</p>
      </div>
    </footer>
  );
}
