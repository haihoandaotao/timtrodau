'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { BarRow, Badge, Card, Section, StatCard } from '@/components/ui';

type Tab = 'students' | 'prospective' | 'landlord' | 'admin';
const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'students', label: 'Sinh viên' },
  { key: 'prospective', label: 'Tân sinh viên' },
  { key: 'landlord', label: 'Chủ trọ' },
  { key: 'admin', label: 'Quản trị' },
];

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>('students');

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800">Quản lý người dùng & sinh viên</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Tổng quan
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' && <StudentsTab />}
      {tab === 'prospective' && <ProspectiveTab />}
      {tab === 'landlord' && <AccountsTab role="LANDLORD" canDelete />}
      {tab === 'admin' && <AccountsTab role="ADMIN" />}
    </main>
  );
}

/* ---------- Tab Sinh viên (roster student_records) ---------- */
function StudentsTab() {
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
    <>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Tổng sinh viên" value={stats.data?.total} />
        <StatCard label="Số ngành" value={stats.data?.byMajor.length} />
        <StatCard label="Số khóa" value={stats.data?.byCohort.length} />
      </div>

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
            placeholder="Tìm MSSV hoặc họ tên…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <select className="inp" value={major} onChange={(e) => resetTo(() => setMajor(e.target.value))}>
            <option value="">Tất cả ngành</option>
            {stats.data?.byMajor.map((m) => (
              <option key={m.major} value={m.major}>
                {m.major} ({m.count})
              </option>
            ))}
          </select>
          <select
            className="inp"
            value={cohort ? `20${cohort}` : ''}
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
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Đang tải…</td>
                </tr>
              )}
              {list.data?.data.map((s) => (
                <tr key={s.studentCode} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-slate-700">{s.studentCode}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.fullName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.major ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{fmtDate(s.dateOfBirth)}</td>
                </tr>
              ))}
              {list.data && list.data.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Không tìm thấy sinh viên.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pager meta={meta} onPage={setPage} unit="sinh viên" />

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
    </>
  );
}

/* ---------- Tab Tân sinh viên dự kiến (admission_candidates) ---------- */
function ProspectiveTab() {
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const stats = useQuery({ queryKey: ['admin', 'candidate-stats'], queryFn: adminApi.candidateStats });
  const list = useQuery({
    queryKey: ['admin', 'candidates', { q, page }],
    queryFn: () => adminApi.admissionCandidates({ q, page }),
  });
  const maxMajor = Math.max(1, ...(stats.data?.byMajor.map((m) => m.count) ?? [1]));
  const meta = list.data?.meta;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label="Tổng Tân sinh viên dự kiến" value={stats.data?.total} />
        <StatCard label="Số ngành đăng ký" value={stats.data?.byMajor.length} />
      </div>

      <Card className="mb-4 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(qInput.trim());
          }}
          className="grid gap-2 sm:grid-cols-[1fr_auto]"
        >
          <input
            className="inp"
            placeholder="Tìm theo họ tên / email / SĐT…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <button type="submit" className="rounded-xl bg-brand px-5 py-2 font-semibold text-white">
            Tìm
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Họ và tên</th>
                <th className="px-4 py-2.5">Liên hệ</th>
                <th className="px-4 py-2.5">Ngành dự kiến</th>
                <th className="px-4 py-2.5">Ngày sinh</th>
                <th className="px-4 py-2.5">Nguồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Đang tải…</td>
                </tr>
              )}
              {list.data?.data.map((c, i) => (
                <tr key={`${c.email ?? c.phone ?? i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.fullName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.email ?? c.phone ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.intendedMajor ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{fmtDate(c.dateOfBirth)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={c.isSelfRegistered ? 'warning' : 'success'}>
                      {c.isSelfRegistered ? 'Tự đăng ký' : 'Tuyển sinh'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {list.data && list.data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Chưa có tân sinh viên dự kiến.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pager meta={meta} onPage={setPage} unit="tân sinh viên" />

      <div className="mt-6">
        <Section title="Tân sinh viên dự kiến theo ngành">
          {stats.data?.byMajor.length ? (
            stats.data.byMajor.map((m) => (
              <BarRow key={m.major} label={m.major} value={m.count} max={maxMajor} />
            ))
          ) : (
            <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
          )}
        </Section>
      </div>
    </>
  );
}

/* ---------- Tab Chủ trọ / Quản trị (users) ---------- */
const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BLOCKED: 'danger',
};
function AccountsTab({ role, canDelete = false }: { role: 'LANDLORD' | 'ADMIN'; canDelete?: boolean }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', role, page],
    queryFn: () => adminApi.users(role, page),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' }) =>
      adminApi.setUserStatus(id, status),
    onSuccess: invalidate,
  });
  const del = useMutation({ mutationFn: adminApi.deleteUser, onSuccess: invalidate });

  return (
    <>
      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      <div className="space-y-2">
        {data?.data.map((u) => (
          <Card key={u.id} className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">{u.fullName}</p>
              <p className="truncate text-xs text-slate-500">{u.phone ?? u.email ?? '—'} · {u.role}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={STATUS_TONE[u.status] ?? 'warning'}>{u.status}</Badge>
              {u.role !== 'ADMIN' &&
                (u.status === 'BLOCKED' ? (
                  <button
                    type="button"
                    onClick={() => setStatus.mutate({ id: u.id, status: 'ACTIVE' })}
                    className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Mở khoá
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatus.mutate({ id: u.id, status: 'BLOCKED' })}
                    className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Khoá
                  </button>
                ))}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xoá tài khoản "${u.fullName}"? Hành động không thể hoàn tác.`))
                      del.mutate(u.id);
                  }}
                  className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white"
                >
                  Xoá
                </button>
              )}
            </div>
          </Card>
        ))}
        {data && data.data.length === 0 && <p className="text-slate-500">Không có tài khoản.</p>}
      </div>
      <Pager meta={data?.meta} onPage={setPage} unit="tài khoản" />
    </>
  );
}

/* ---------- Phân trang dùng chung ---------- */
function Pager({
  meta,
  onPage,
  unit,
}: {
  meta?: { total: number; page: number; totalPages: number };
  onPage: (fn: (p: number) => number) => void;
  unit: string;
}) {
  if (!meta || meta.total === 0) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <span className="text-slate-500">
        Trang {meta.page}/{meta.totalPages} · {meta.total.toLocaleString('vi-VN')} {unit}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPage((p) => p - 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        >
          ← Trước
        </button>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage((p) => p + 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
