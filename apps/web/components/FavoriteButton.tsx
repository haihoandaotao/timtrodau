'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/lib/api/favorites';
import { useAuth } from '@/lib/auth-context';

/** Nút lưu/bỏ lưu phòng yêu thích (chỉ hiển thị cho sinh viên đã đăng nhập). */
export function FavoriteButton({ accommodationId }: { accommodationId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ids = useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: favoritesApi.ids,
    enabled: !!user && user.role === 'STUDENT',
  });

  const saved = ids.data?.includes(accommodationId) ?? false;
  const toggle = useMutation({
    mutationFn: () => (saved ? favoritesApi.remove(accommodationId) : favoritesApi.add(accommodationId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (!user || user.role !== 'STUDENT') return null;

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
        saved ? 'border-brand bg-brand-50 text-brand' : 'border-slate-300 text-slate-600 hover:border-brand'
      }`}
    >
      {saved ? '❤️ Đã lưu' : '🤍 Lưu phòng'}
    </button>
  );
}
