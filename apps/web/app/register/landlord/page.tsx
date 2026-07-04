'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, type LoginResult } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { Card } from '@/components/ui';

export default function LandlordRegisterPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const afterLogin = (res: LoginResult) => {
    signIn(res.tokens.accessToken, res.user, res.tokens.refreshToken);
    // Chủ trọ mới → tới trang quản lý để bổ sung hồ sơ (SĐT) trước khi đăng tin.
    router.push(res.user.role === 'ADMIN' ? '/admin' : '/landlord');
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-center text-2xl font-extrabold text-slate-800">Đăng ký chủ trọ</h1>
      <p className="mb-6 mt-1 text-center text-sm text-slate-500">
        Đăng ký một chạm bằng Google — không cần điền họ tên hay mật khẩu
      </p>
      <Card className="p-6">
        <div className="space-y-3 text-center">
          <GoogleLoginButton onSuccess={afterLogin} />
          <div className="rounded-lg bg-slate-50 p-3 text-left text-sm text-slate-600">
            <p className="font-medium text-slate-700">Sau khi đăng nhập:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Bổ sung Số điện thoại + địa chỉ trong hồ sơ.</li>
              <li>Chờ Ban quản trị duyệt tài khoản.</li>
              <li>Được duyệt xong là có thể đăng tin cho thuê.</li>
            </ol>
          </div>
          <p className="text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-brand hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
