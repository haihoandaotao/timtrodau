'use client';

import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/lib/api/health';

/**
 * Trang chủ tạm (Phase 1.1) — kiểm chứng FE↔BE thông nhau qua service layer.
 * Sẽ thay bằng trang tìm kiếm phòng (DAL-8) ở Phase 3.
 */
export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-brand">DAU Accommodation Link</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hỗ trợ tìm phòng trọ cho tân sinh viên DAU
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">
          Trạng thái hệ thống
        </h2>
        {isLoading && <p className="text-slate-500">Đang kết nối API…</p>}
        {isError && (
          <p className="text-red-600">
            ❌ Chưa kết nối được API. Hãy chạy <code>npm run dev:api</code>.
          </p>
        )}
        {data && (
          <div className="flex items-center gap-2 text-green-700">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            <span>
              API: <strong>{data.status}</strong> ({data.service})
            </span>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        Phase 1.1 — Scaffold hoàn tất. Các tính năng sẽ được bổ sung theo Implementation Plan.
      </p>
    </main>
  );
}
