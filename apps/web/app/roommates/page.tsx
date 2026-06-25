'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { accommodationsApi } from '@/lib/api/accommodations';
import { roommateApi, type CreateRoommatePayload } from '@/lib/api/roommate';
import { useAuth } from '@/lib/auth-context';
import { formatVnd } from '@/lib/format';
import { Badge, Card } from '@/components/ui';

export default function RoommatesPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [major, setMajor] = useState('');

  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: accommodationsApi.areas });
  const list = useQuery({
    queryKey: ['roommates', major],
    queryFn: () => roommateApi.list({ major: major || undefined }),
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roommates'] });
  const close = useMutation({ mutationFn: (id: string) => roommateApi.close(id), onSuccess: invalidate });

  if (!loading && (!user || user.role !== 'STUDENT')) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center text-slate-500">
        Tính năng tìm bạn ở ghép dành cho sinh viên. Vui lòng đăng nhập.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-extrabold text-slate-800">Tìm bạn ở ghép</h1>
      <p className="mb-4 text-sm text-slate-500">Ghép cùng ngành để tiện học & làm đồ án chung.</p>

      <CreateForm areas={areas ?? []} onCreated={invalidate} />

      <div className="my-5 flex items-center gap-2">
        <input
          className="inp"
          placeholder="Lọc theo ngành (VD: Kiến trúc)"
          value={major}
          onChange={(e) => setMajor(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {list.isLoading && <p className="text-slate-500">Đang tải…</p>}
        {list.data?.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="brand">{p.major}</Badge>
                  {p.preferredArea && <Badge tone="neutral">{p.preferredArea.name}</Badge>}
                </div>
                {p.budget && <p className="mt-1 text-sm text-brand">Ngân sách: {formatVnd(p.budget)}</p>}
                {p.description && <p className="mt-1 text-sm text-slate-600">{p.description}</p>}
              </div>
              {p.studentId === user?.id && (
                <button type="button" onClick={() => close.mutate(p.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-500 hover:border-brand">
                  Đóng tin
                </button>
              )}
            </div>
          </Card>
        ))}
        {list.data && list.data.length === 0 && (
          <p className="text-slate-500">Chưa có tin phù hợp. Hãy đăng tin của bạn ở trên.</p>
        )}
      </div>
    </main>
  );
}

function CreateForm({
  areas,
  onCreated,
}: {
  areas: Array<{ id: number; name: string }>;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateRoommatePayload>({ major: '' });
  const [msg, setMsg] = useState('');
  const create = useMutation({
    mutationFn: () => roommateApi.create(form),
    onSuccess: () => {
      setMsg('Đã đăng tin tìm bạn ở ghép!');
      setForm({ major: '' });
      onCreated();
    },
  });

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-bold text-slate-800">Đăng tin tìm bạn ở ghép</h2>
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
        <input className="inp" placeholder="Ngành học (VD: Kiến trúc)" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <input className="inp" type="number" placeholder="Ngân sách (VND)" value={form.budget ?? ''} onChange={(e) => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : undefined })} />
          <select className="inp" value={form.preferredAreaId ?? ''} onChange={(e) => setForm({ ...form, preferredAreaId: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">— Khu vực —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <textarea className="inp" rows={2} placeholder="Mô tả mong muốn (giới tính, giờ giấc…)" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <button type="submit" disabled={create.isPending} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
          {create.isPending ? 'Đang đăng…' : 'Đăng tin'}
        </button>
      </form>
    </Card>
  );
}
