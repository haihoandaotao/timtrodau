'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { Card } from '@/components/ui';

export default function AdminAreasPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin', 'areas'], queryFn: adminApi.areas });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'areas'] });
  const create = useMutation({ mutationFn: () => adminApi.createArea(name.trim()), onSuccess: () => { setName(''); invalidate(); } });
  const remove = useMutation({ mutationFn: (id: number) => adminApi.deleteArea(id), onSuccess: invalidate });
  const rename = useMutation({ mutationFn: ({ id, n }: { id: number; n: string }) => adminApi.updateArea(id, n), onSuccess: invalidate });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Cấu hình Phường/xã</h1>
        <Link href="/admin" className="text-sm text-brand hover:underline">← Dashboard</Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }} className="mb-5 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên phường/xã mới…" className="inp" />
        <button type="submit" disabled={create.isPending} className="shrink-0 rounded-xl bg-brand px-4 font-semibold text-white disabled:opacity-60">Thêm</button>
      </form>
      {create.isError && <p className="mb-3 text-sm text-red-600">{(create.error as Error).message}</p>}

      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      {isError && <p className="rounded bg-red-50 p-3 text-sm text-red-600">Cần đăng nhập Admin.</p>}

      <div className="space-y-2">
        {data?.map((a) => (
          <Card key={a.id} className="flex items-center justify-between p-3">
            <span className="font-medium text-slate-800">{a.name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const n = window.prompt('Đổi tên phường/xã:', a.name);
                  if (n && n.trim()) rename.mutate({ id: a.id, n: n.trim() });
                }}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-brand"
              >
                Sửa
              </button>
              <button type="button" onClick={() => remove.mutate(a.id)} className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white">Xoá</button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
