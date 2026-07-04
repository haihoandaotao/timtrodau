'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/lib/api/notifications';

/** Chuông thông báo: badge số chưa đọc + panel danh sách. */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30000, // tự cập nhật mỗi 30s
  });
  const list = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(1),
    enabled: open,
  });
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Đóng panel khi bấm ra ngoài.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const count = unread.data?.count ?? 0;
  const items = list.data?.data ?? [];

  const openPanel = () => {
    setOpen((v) => !v);
    if (!open && count > 0) markAll.mutate();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={openPanel}
        aria-label="Thông báo"
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-800">Thông báo</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {list.isLoading && <p className="px-4 py-6 text-center text-sm text-slate-400">Đang tải…</p>}
            {list.data && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Chưa có thông báo nào.</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (n.link) router.push(n.link);
                }}
                className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${
                  n.isRead ? '' : 'bg-brand-50/40'
                }`}
              >
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                <p className="mt-1 text-[10px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
