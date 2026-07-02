'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi, type LoginResult } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui';

type Persona = 'prospective' | 'student' | 'staff';

const PERSONAS: Array<{ key: Persona; icon: string; title: string; desc: string }> = [
  { key: 'prospective', icon: '🎓', title: 'Tân sinh viên', desc: 'Thí sinh đang chờ nhập học' },
  { key: 'student', icon: '📘', title: 'Sinh viên của trường', desc: 'Đang theo học tại DAU' },
  { key: 'staff', icon: '🏠', title: 'Chủ trọ / Quản trị', desc: 'Đối tác & ban quản trị' },
];

export default function LoginPage() {
  const [persona, setPersona] = useState<Persona | null>(null);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-slate-800">Đăng nhập</h1>
      <p className="mb-6 mt-1 text-center text-sm text-slate-500">
        Chọn đối tượng để tiếp tục
      </p>

      {!persona ? (
        <div className="space-y-3">
          {PERSONAS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPersona(p.key)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card-hover"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
                {p.icon}
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-slate-800">{p.title}</span>
                <span className="block text-sm text-slate-500">{p.desc}</span>
              </span>
              <span className="text-brand">›</span>
            </button>
          ))}
        </div>
      ) : (
        <Card className="p-5">
          <button
            type="button"
            onClick={() => setPersona(null)}
            className="mb-4 text-sm text-slate-500 hover:text-brand"
          >
            ← Chọn lại đối tượng
          </button>
          {persona === 'prospective' && <ProspectiveForm />}
          {persona === 'student' && <StudentForm />}
          {persona === 'staff' && <StaffForm />}
        </Card>
      )}
    </main>
  );
}

function useAfterLogin() {
  const { signIn } = useAuth();
  const router = useRouter();
  return (res: LoginResult) => {
    signIn(res.tokens.accessToken, res.user, res.tokens.refreshToken);
    if (res.user.mustChangePassword) {
      router.push('/profile');
      return;
    }
    router.push(res.user.role === 'ADMIN' ? '/admin' : '/search');
  };
}

function ProspectiveForm() {
  const afterLogin = useAfterLogin();
  const [identifier, setIdentifier] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      afterLogin(await authApi.prospectiveLogin(identifier.trim(), dob));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-500">Đăng nhập bằng email/SĐT đã đăng ký tuyển sinh.</p>
      <Input label="Email hoặc số điện thoại" value={identifier} onChange={setIdentifier} placeholder="email@... hoặc 0905..." />
      <Input label="Ngày sinh (mật khẩu)" value={dob} onChange={setDob} type="date" />
      {error && <ErrorText>{error}</ErrorText>}
      <Submit loading={loading}>Đăng nhập</Submit>
      <p className="text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link href="/register/student" className="font-medium text-brand hover:underline">
          Đăng ký tân sinh viên
        </Link>
      </p>
    </form>
  );
}

function StudentForm() {
  const afterLogin = useAfterLogin();
  const [code, setCode] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      afterLogin(await authApi.studentLogin(code.trim(), dob));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-500">Mật khẩu là ngày sinh của bạn.</p>
      <Input label="Mã số sinh viên" value={code} onChange={setCode} placeholder="VD: 2021120001" />
      <Input label="Ngày sinh (mật khẩu)" value={dob} onChange={setDob} type="date" />
      {error && <ErrorText>{error}</ErrorText>}
      <Submit loading={loading}>Đăng nhập</Submit>
    </form>
  );
}

function StaffForm() {
  const afterLogin = useAfterLogin();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      afterLogin(await authApi.login(identifier.trim(), password));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (forgot) return <ForgotPasswordForm onBack={() => setForgot(false)} />;

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input label="Email hoặc số điện thoại" value={identifier} onChange={setIdentifier} placeholder="email@gmail.com / 0905xxxxxx" />
      <Input label="Mật khẩu" value={password} onChange={setPassword} type="password" />
      {error && <ErrorText>{error}</ErrorText>}
      <Submit loading={loading}>Đăng nhập</Submit>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={() => setForgot(true)} className="font-medium text-brand hover:underline">
          Quên mật khẩu?
        </button>
        <Link href="/register/landlord" className="font-medium text-brand hover:underline">
          Đăng ký cho thuê
        </Link>
      </div>
    </form>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setMsg(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-500">
        Nhập email đã đăng ký. Hệ thống sẽ gửi <b>mật khẩu tạm</b> vào email của bạn; hãy đổi mật khẩu ngay sau khi đăng nhập.
      </p>
      <Input label="Email đã đăng ký" value={email} onChange={setEmail} type="email" placeholder="email@gmail.com" />
      {error && <ErrorText>{error}</ErrorText>}
      {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
      <Submit loading={loading}>Gửi mật khẩu tạm</Submit>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 hover:text-brand">
        ← Quay lại đăng nhập
      </button>
    </form>
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
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{children}</p>;
}

function Submit({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {loading ? 'Đang xử lý…' : children}
    </button>
  );
}
