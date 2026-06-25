'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Badge, Card } from '@/components/ui';

const ROLE_TABS: Array<{ label: string; role?: string }> = [
  { label: 'Tất cả' },
  { label: 'Sinh viên', role: 'STUDENT' },
  { label: 'Chủ trọ', role: 'LANDLORD' },
  { label: 'Quản trị', role: 'ADMIN' },
];

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BLOCKED: 'danger',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const role = ROLE_TABS[tab].role;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', role],
    queryFn: () => adminApi.users(role),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' }) =>
      adminApi.setUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Quản lý người dùng</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {ROLE_TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              tab === i ? 'border-brand bg-brand text-white' : 'border-slate-300 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      {isError && <p className="rounded bg-red-50 p-3 text-sm text-red-600">Cần đăng nhập Admin.</p>}

      <div className="space-y-2">
        {data?.data.map((u) => (
          <Card key={u.id} className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">{u.fullName}</p>
              <p className="truncate text-xs text-slate-500">
                {u.studentCode ? `MSSV ${u.studentCode} · ` : ''}
                {u.phone ?? u.email ?? '—'} · {u.role}
              </p>
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
                    className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Khoá
                  </button>
                ))}
            </div>
          </Card>
        ))}
        {data && data.data.length === 0 && <p className="text-slate-500">Không có người dùng.</p>}
      </div>
      {data && <p className="mt-3 text-sm text-slate-400">Tổng: {data.meta.total}</p>}
    </main>
  );
}
