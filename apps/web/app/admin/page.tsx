'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin';

/**
 * Dashboard Admin (DAL-15). Dùng refetch khi tải + nút làm mới (MVP, không websocket).
 */
export default function AdminDashboard() {
  const overview = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview });
  const prices = useQuery({
    queryKey: ['admin', 'prices'],
    queryFn: adminApi.priceDistribution,
  });
  const areas = useQuery({ queryKey: ['admin', 'areas'], queryFn: adminApi.areaDistribution });
  const trusted = useQuery({
    queryKey: ['admin', 'trusted'],
    queryFn: adminApi.trustedLandlords,
  });

  const refreshAll = () => {
    overview.refetch();
    prices.refetch();
    areas.refetch();
    trusted.refetch();
  };

  const maxArea = Math.max(1, ...(areas.data?.map((a) => a.count) ?? [1]));
  const maxPrice = Math.max(1, ...(prices.data?.map((p) => p.count) ?? [1]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Dashboard quản trị</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/moderation"
            className="rounded-lg border border-brand px-3 py-1.5 text-sm text-brand"
          >
            Duyệt tin
          </Link>
          <button
            type="button"
            onClick={refreshAll}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white"
          >
            ↻ Làm mới
          </button>
        </div>
      </div>

      {overview.isError && (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          Không tải được dữ liệu. Cần đăng nhập Admin (token) và API đang chạy.
        </p>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="SV đã tìm được phòng" value={overview.data?.studentsFoundRoom} />
        <StatCard label="Phòng đã duyệt" value={overview.data?.publishedAccommodations} />
        <StatCard label="Tổng lượt giữ chỗ" value={overview.data?.totalBookings} />
      </div>

      {/* Phân bố giá */}
      <Section title="Phân bố theo khoảng giá">
        {prices.data?.map((p) => (
          <BarRow key={p.bucket} label={p.bucket} value={p.count} max={maxPrice} />
        ))}
      </Section>

      {/* Phân bố khu vực */}
      <Section title="Khu vực được chọn nhiều nhất">
        {areas.data && areas.data.length > 0 ? (
          areas.data.map((a) => (
            <BarRow key={a.area} label={a.area} value={a.count} max={maxArea} />
          ))
        ) : (
          <p className="text-sm text-slate-400">Chưa có dữ liệu booking.</p>
        )}
      </Section>

      {/* Chủ trọ uy tín */}
      <Section title="Chủ trọ uy tín">
        {trusted.data && trusted.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {trusted.data.map((l) => (
              <li key={l.userId} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {l.fullName} {l.isTrusted && <span className="text-amber-500">★</span>}
                </span>
                <span className="text-slate-500">{l.verifiedBookingCount} giao dịch</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Chưa có chủ trọ uy tín.</p>
        )}
      </Section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-bold text-brand">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase text-slate-400">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-slate-600">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-brand" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}
