'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { favoritesApi } from '@/lib/api/favorites';
import { useAuth } from '@/lib/auth-context';
import { RoomCard } from '@/components/RoomCard';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['favorites', 'list'],
    queryFn: favoritesApi.list,
    enabled: !!user,
  });

  if (!loading && (!user || user.role !== 'STUDENT')) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center text-slate-500">
        Vui lòng đăng nhập bằng tài khoản sinh viên để xem phòng đã lưu.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-slate-800">Phòng đã lưu</h1>
      {isLoading && <p className="text-slate-500">Đang tải…</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data?.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
      {data && data.length === 0 && (
        <p className="text-slate-500">
          Chưa lưu phòng nào.{' '}
          <Link href="/search" className="text-brand hover:underline">
            Tìm phòng
          </Link>
        </p>
      )}
    </main>
  );
}
