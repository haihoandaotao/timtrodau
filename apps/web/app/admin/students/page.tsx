'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { BarRow, Card, Section, StatCard } from '@/components/ui';

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default function AdminStudentsPage() {
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [major, setMajor] = useState('');
  const [cohort, setCohort] = useState('');
  const [page, setPage] = useState(1);

  const stats = useQuery({ queryKey: ['admin', 'student-stats'], queryFn: adminApi.studentStats });
  const list = useQuery({
    queryKey: ['admin', 'students', { q, major, cohort, page }],
    queryFn: () => adminApi.students({ q, major, cohort, page }),
  });

  const resetTo = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const maxMajor = Math.max(1, ...(stats.data?.byMajor.map((m) => m.count) ?? [1]));
  const maxCohort = Math.max(1, ...(stats.data?.byCohort.map((c) => c.count) ?? [1]));
  const meta = list.data?.meta;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800">Quản lý sinh viên</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Tổng quan
        </Link>
      </div>

      {/* Thống kê tổng */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Tổng sinh viên" value={stats.data?.total} />
        <StatCard label="Số ngành" value={stats.data?.byMajor.length} />
        <StatCard label="Số khóa" value={stats.data?.byCohort.length} />
      </div>

      {/* Bộ lọc */}
      <Card className="mb-4 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetTo(() => setQ(qInput.trim()));
          }}
          className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <input
            className="inp"
            placeholder="Tìm theo MSSV hoặc họ tên…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <select
            className="inp"
            value={major}
            onChange={(e) => resetTo(() => setMajor(e.target.value))}
          >
            <option value="">Tất cả ngành</option>
            {stats.data?.byMajor.map((m) => (
              <option key={m.major} value={m.major}>
                {m.major} ({m.count})
              </option>
            ))}
          </select>
          <select
            className="inp"
            value={cohort}
            onChange={(e) => resetTo(() => setCohort(e.target.value.slice(2)))}
          >
            <option value="">Tất cả khóa</option>
            {stats.data?.byCohort.map((c) => (
              <option key={c.cohort} value={c.cohort}>
                Khóa {c.cohort} ({c.count})
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-brand px-5 py-2 font-semibold text-white">
            Tìm
          </button>
        </form>
      </Card>

      {/* Bảng sinh viên */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">MSSV</th>
                <th className="px-4 py-2.5">Họ và tên</th>
                <th className="px-4 py-2.5">Ngành</th>
                <th className="px-4 py-2.5">Ngày sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Đang tải…
                  </td>
                </tr>
              )}
              {list.data?.data.map((s) => (
                <tr key={s.studentCode} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-slate-700">
                    {s.studentCode}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.fullName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.major ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                    {fmtDate(s.dateOfBirth)}
                  </td>
                </tr>
              ))}
              {list.data && list.data.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Không tìm thấy sinh viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Phân trang */}
      {meta && meta.total > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Trang {meta.page}/{meta.totalPages} · {meta.total.toLocaleString('vi-VN')} sinh viên
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Thống kê theo ngành & khóa */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Sinh viên theo ngành">
          {stats.data?.byMajor.map((m) => (
            <BarRow key={m.major} label={m.major} value={m.count} max={maxMajor} />
          ))}
        </Section>
        <Section title="Sinh viên theo khóa">
          {stats.data?.byCohort.map((c) => (
            <BarRow key={c.cohort} label={`Khóa ${c.cohort}`} value={c.count} max={maxCohort} />
          ))}
        </Section>
      </div>
    </main>
  );
}
