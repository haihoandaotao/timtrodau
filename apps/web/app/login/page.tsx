'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi, type LoginResult } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';

type Tab = 'student' | 'password';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('student');

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-1 text-center text-xl font-bold text-brand">Đăng nhập</h1>
      <p className="mb-5 text-center text-sm text-slate-500">DAU Accommodation Link</p>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm">
        <TabButton active={tab === 'student'} onClick={() => setTab('student')}>
          Sinh viên (OTP)
        </TabButton>
        <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
          Chủ trọ / Admin
        </TabButton>
      </div>

      {tab === 'student' ? <StudentLogin /> : <PasswordLogin />}
    </main>
  );
}

/** Sau đăng nhập: điều hướng theo vai trò. */
function useAfterLogin() {
  const { signIn } = useAuth();
  const router = useRouter();
  return (res: LoginResult) => {
    signIn(res.tokens.accessToken, res.user);
    if (res.user.role === 'ADMIN') router.push('/admin');
    else router.push('/search');
  };
}

function StudentLogin() {
  const afterLogin = useAfterLogin();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [studentCode, setStudentCode] = useState('');
  const [phone, setPhone] = useState('');
  const [requestId, setRequestId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.requestOtp(studentCode.trim(), phone.trim());
      setRequestId(res.requestId);
      setStep('verify');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(requestId, code.trim());
      afterLogin(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <form onSubmit={verifyOtp} className="space-y-3">
        <p className="text-sm text-slate-500">
          Mã OTP đã gửi tới <strong>{phone}</strong>. (Bản dev: xem mã ở console API)
        </p>
        <Input label="Mã OTP" value={code} onChange={setCode} placeholder="6 chữ số" />
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton loading={loading}>Xác minh & đăng nhập</SubmitButton>
        <button
          type="button"
          onClick={() => setStep('request')}
          className="w-full text-center text-sm text-slate-500 hover:text-brand"
        >
          ← Nhập lại MSSV/SĐT
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-3">
      <Input label="Mã số sinh viên / SBD" value={studentCode} onChange={setStudentCode} placeholder="VD: 2024110001" />
      <Input label="Số điện thoại" value={phone} onChange={setPhone} placeholder="0905xxxxxx" />
      {error && <ErrorText>{error}</ErrorText>}
      <SubmitButton loading={loading}>Gửi mã OTP</SubmitButton>
    </form>
  );
}

function PasswordLogin() {
  const afterLogin = useAfterLogin();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(phone.trim(), password);
      afterLogin(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input label="Số điện thoại" value={phone} onChange={setPhone} placeholder="0905xxxxxx" />
      <Input
        label="Mật khẩu"
        value={password}
        onChange={setPassword}
        type="password"
        placeholder="••••••"
      />
      {error && <ErrorText>{error}</ErrorText>}
      <SubmitButton loading={loading}>Đăng nhập</SubmitButton>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md py-2 font-medium transition ${
        active ? 'bg-white text-brand shadow-sm' : 'text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
      />
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{children}</p>;
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white disabled:opacity-60"
    >
      {loading ? 'Đang xử lý…' : children}
    </button>
  );
}
