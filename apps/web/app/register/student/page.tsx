'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi, majorsApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui';

export default function StudentRegisterPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { data: majors } = useQuery({ queryKey: ['majors'], queryFn: majorsApi.listActive });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email && !phone) {
      setError('Cần nhập email hoặc số điện thoại');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.prospectiveRegister({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dob,
        intendedMajor: major,
      });
      signIn(res.tokens.accessToken, res.user, res.tokens.refreshToken);
      router.push('/search');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-slate-800">Đăng ký tân sinh viên</h1>
      <p className="mb-6 mt-1 text-center text-sm text-slate-500">
        Dành cho thí sinh chưa có tài khoản tuyển sinh
      </p>
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Họ và tên">
            <input className="inp" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="(email hoặc SĐT)" />
          </Field>
          <Field label="Số điện thoại">
            <input className="inp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(email hoặc SĐT)" />
          </Field>
          <Field label="Ngày sinh (sẽ là mật khẩu)">
            <input className="inp" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
          </Field>
          <Field label="Ngành dự kiến nhập học">
            <select className="inp" value={major} onChange={(e) => setMajor(e.target.value)} required>
              <option value="">— Chọn ngành —</option>
              {majors?.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'Đang xử lý…' : 'Đăng ký & vào hệ thống'}
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
