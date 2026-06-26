'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { Card } from '@/components/ui';

export default function LandlordRegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.landlordRegister({
        fullName: form.fullName,
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="text-3xl">✅</p>
          <h1 className="mt-2 text-xl font-bold text-green-700">Đăng ký thành công!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hồ sơ của bạn đang chờ Ban quản trị duyệt. Sau khi được duyệt, bạn có thể đăng nhập và
            đăng tin cho thuê.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white"
          >
            Về trang đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-slate-800">Đăng ký chủ trọ</h1>
      <p className="mb-6 mt-1 text-center text-sm text-slate-500">
        Đăng ký bằng Gmail — thông tin chỗ trọ sẽ hoàn thiện sau khi đăng nhập
      </p>
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Họ tên người quản lý">
            <input className="inp" value={form.fullName} onChange={set('fullName')} required />
          </Field>
          <Field label="Email (Gmail) — dùng để đăng nhập">
            <input className="inp" type="email" value={form.email} onChange={set('email')} placeholder="ten@gmail.com" required />
          </Field>
          <Field label="Số điện thoại (tuỳ chọn)">
            <input className="inp" value={form.phone} onChange={set('phone')} placeholder="0905xxxxxx" />
          </Field>
          <Field label="Mật khẩu">
            <input className="inp" type="password" value={form.password} onChange={set('password')} required />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'Đang xử lý…' : 'Gửi đăng ký'}
          </button>
          <p className="text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </Card>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
