'use client';

import { useState } from 'react';
import { authApi, type AuthUser } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui';

export default function ProfilePage() {
  const { user, loading, setUser } = useAuth();

  if (loading) return <main className="px-4 py-12 text-center text-slate-500">Đang tải…</main>;
  if (!user)
    return <main className="px-4 py-12 text-center text-slate-500">Vui lòng đăng nhập.</main>;

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-800">Hồ sơ cá nhân</h1>
      <ProfileForm onUpdated={setUser} />
      {user.role !== 'STUDENT' && <PasswordForm />}
    </main>
  );
}

function ProfileForm({ onUpdated }: { onUpdated: (u: AuthUser) => void }) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const updated = await authApi.updateProfile({
        fullName,
        email: email || undefined,
        phone: phone || undefined,
      });
      onUpdated(updated);
      setMsg('Đã cập nhật hồ sơ.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-5 p-5">
      <h2 className="mb-3 font-bold text-slate-800">Thông tin</h2>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Họ tên">
          <input className="inp" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="inp" type="email" value={email ?? ''} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Số điện thoại">
          <input className="inp" value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
          {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    try {
      await authApi.changePassword(current, next);
      setMsg('Đổi mật khẩu thành công.');
      setCurrent('');
      setNext('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-bold text-slate-800">Đổi mật khẩu</h2>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Mật khẩu hiện tại">
          <input className="inp" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="Mật khẩu mới">
          <input className="inp" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white disabled:opacity-60">
          {loading ? 'Đang đổi…' : 'Đổi mật khẩu'}
        </button>
      </form>
    </Card>
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
