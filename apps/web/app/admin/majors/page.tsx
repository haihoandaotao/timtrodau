'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Badge, Card } from '@/components/ui';

export default function AdminMajorsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'majors'],
    queryFn: adminApi.majors,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'majors'] });
  const create = useMutation({ mutationFn: () => adminApi.createMajor(name.trim()), onSuccess: () => { setName(''); invalidate(); } });
  const toggle = useMutation({ mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.updateMajor(id, { isActive }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: number) => adminApi.deleteMajor(id), onSuccess: invalidate });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Cấu hình ngành nhập học</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
        className="mb-5 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên ngành mới…"
          className="inp"
        />
        <button type="submit" disabled={create.isPending} className="shrink-0 rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-60">
          Thêm
        </button>
      </form>
      {create.isError && <p className="mb-3 text-sm text-red-600">{(create.error as Error).message}</p>}

      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      {isError && <p className="rounded bg-red-50 p-3 text-sm text-red-600">Cần đăng nhập Admin.</p>}

      <div className="space-y-2">
        {data?.map((m) => (
          <Card key={m.id} className="flex items-center justify-between p-3">
            <span className="font-medium text-slate-800">{m.name}</span>
            <div className="flex items-center gap-2">
              <Badge tone={m.isActive ? 'success' : 'neutral'}>{m.isActive ? 'Đang mở' : 'Đã tắt'}</Badge>
              <button
                type="button"
                onClick={() => toggle.mutate({ id: m.id, isActive: !m.isActive })}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-brand"
              >
                {m.isActive ? 'Tắt' : 'Bật'}
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(m.id)}
                className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white"
              >
                Xoá
              </button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
