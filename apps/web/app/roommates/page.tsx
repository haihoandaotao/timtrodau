'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { accommodationsApi } from '@/lib/api/accommodations';
import { majorsApi } from '@/lib/api/auth';
import { roommateApi, type CreateRoommatePayload, type GenderPref } from '@/lib/api/roommate';
import { useAuth } from '@/lib/auth-context';
import { formatVnd } from '@/lib/format';
import { Badge, Card } from '@/components/ui';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1$/,
  '',
);
const GENDER_LABEL: Record<GenderPref, string> = {
  ANY: 'Không yêu cầu giới tính',
  MALE: 'Cần tìm bạn nam',
  FEMALE: 'Cần tìm bạn nữ',
};

export default function RoommatesPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: accommodationsApi.areas });
  const list = useQuery({
    queryKey: ['roommates', page],
    queryFn: () => roommateApi.list({ page }),
    enabled: !!user,
  });
  const posts = list.data?.data ?? [];
  const meta = list.data?.meta;

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
      <p className="mb-4 text-sm text-slate-500">
        Giới thiệu chỗ trọ của bạn và tìm người ở ghép cùng ngành.
      </p>

      <CreateForm areas={areas ?? []} onCreated={invalidate} />

      <div className="mt-5 space-y-3">
        {list.isLoading && <p className="text-slate-500">Đang tải…</p>}
        {posts.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{p.major}</Badge>
                {p.preferredArea && <Badge tone="neutral">{p.preferredArea.name}</Badge>}
                <Badge tone={p.genderPref === 'ANY' ? 'neutral' : 'warning'}>
                  {GENDER_LABEL[p.genderPref]}
                </Badge>
              </div>
              {p.studentId === user?.id && (
                <button
                  type="button"
                  onClick={() => close.mutate(p.id)}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-500 hover:border-brand"
                >
                  Đóng tin
                </button>
              )}
            </div>

            {/* Ảnh căn hộ */}
            {p.images && p.images.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {p.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={`${API_ORIGIN}${img.url}`}
                    alt=""
                    className="h-28 w-40 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}

            {p.budget && <p className="mt-2 text-sm font-semibold text-brand">Tiền phòng: {formatVnd(p.budget)}/tháng</p>}
            {p.address && <p className="mt-0.5 text-sm text-slate-600">📍 {p.address}</p>}
            {p.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{p.description}</p>}
            {p.contactPhone && (
              <a href={`tel:${p.contactPhone}`} className="mt-2 inline-block text-sm font-medium text-brand">
                📞 Liên hệ: {p.contactPhone}
              </a>
            )}
          </Card>
        ))}
        {list.data && posts.length === 0 && (
          <p className="text-slate-500">Chưa có tin nào. Hãy đăng tin của bạn ở trên.</p>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Trang {meta.page}/{meta.totalPages} · {meta.total} tin
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
  const emptyForm: CreateRoommatePayload = {
    major: '',
    address: '',
    contactPhone: '',
    budget: 0,
    genderPref: 'ANY',
  };
  const [form, setForm] = useState<CreateRoommatePayload>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { data: majors } = useQuery({ queryKey: ['majors'], queryFn: majorsApi.listActive });

  // Nhận mảng đã chuyển sẵn (không nhận FileList) để tránh bị xoá bởi input.value=''.
  const addFiles = (picked: File[]) => {
    if (picked.length) setFiles((p) => [...p, ...picked]);
  };
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (files.length === 0) {
      setError('Vui lòng đăng ít nhất 1 ảnh căn hộ/phòng.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await roommateApi.create(form);
      await roommateApi.uploadImages(created.id, files);
      setMsg('Đã đăng tin tìm bạn ở ghép!');
      setForm(emptyForm);
      setFiles([]);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-3">
        <select
          className="inp"
          value={form.major}
          onChange={(e) => setForm({ ...form, major: e.target.value })}
          required
        >
          <option value="">— Chọn ngành bạn đang học —</option>
          {majors?.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>

        <input
          className="inp"
          placeholder="Địa chỉ chỗ trọ (số nhà, đường, phường/xã…)"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            className="inp"
            type="number"
            placeholder="Tiền phòng / tháng (VND)"
            value={form.budget || ''}
            onChange={(e) => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : 0 })}
            required
          />
          <input
            className="inp"
            placeholder="SĐT liên hệ (VD: 0905…)"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            className="inp"
            value={form.preferredAreaId ?? ''}
            onChange={(e) => setForm({ ...form, preferredAreaId: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">— Khu vực trọ —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select
            className="inp"
            value={form.genderPref}
            onChange={(e) => setForm({ ...form, genderPref: e.target.value as GenderPref })}
          >
            <option value="ANY">Không yêu cầu giới tính</option>
            <option value="MALE">Tìm bạn nam</option>
            <option value="FEMALE">Tìm bạn nữ</option>
          </select>
        </div>

        <textarea
          className="inp"
          rows={3}
          placeholder="Giới thiệu chỗ trọ & mong muốn (diện tích, nội thất, giờ giấc…)"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Ảnh căn hộ */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase text-slate-400">
            Ảnh căn hộ/phòng (bắt buộc, tự nén &lt; 2MB)
          </p>
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-500 hover:border-brand hover:text-brand">
            📷 Chọn ảnh
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { addFiles(e.target.files ? Array.from(e.target.files) : []); e.target.value = ''; }} />
          </label>
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeFile(i)} className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/60 text-xs text-white hover:bg-red-600">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
          {submitting ? 'Đang đăng…' : 'Đăng tin'}
        </button>
      </form>
    </Card>
  );
}
