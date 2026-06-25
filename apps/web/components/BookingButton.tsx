'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { bookingsApi, type BookingResult } from '@/lib/api/bookings';
import { getAccessToken } from '@/lib/auth-token';

/**
 * Nút "Đăng ký giữ chỗ" (DAL-11).
 * Ghi nhận booking in-app rồi hiện deep-link Zalo/SĐT để SV liên hệ chủ trọ.
 */
export function BookingButton({
  accommodationId,
  disabled,
}: {
  accommodationId: string;
  disabled?: boolean;
}) {
  const [result, setResult] = useState<BookingResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Bạn cần đăng nhập sinh viên để giữ chỗ');
      }
      return bookingsApi.create(accommodationId, undefined, token);
    },
    onSuccess: (data) => setResult(data),
  });

  if (result) {
    const { contact } = result;
    return (
      <div className="mt-5 space-y-2 rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="font-semibold text-green-700">✅ Đã ghi nhận giữ chỗ!</p>
        <p className="text-sm text-slate-600">Liên hệ chủ trọ để được tư vấn:</p>
        <div className="flex gap-2">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex-1 rounded-lg bg-brand py-2 text-center text-sm font-semibold text-white"
            >
              📞 Gọi {contact.phone}
            </a>
          )}
          {contact.zalo && (
            <a
              href={contact.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-blue-500 py-2 text-center text-sm font-semibold text-white"
            >
              💬 Zalo
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={disabled || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="w-full rounded-lg bg-brand py-3 font-semibold text-white disabled:opacity-60"
      >
        {mutation.isPending ? 'Đang xử lý…' : 'Đăng ký giữ chỗ'}
      </button>
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}
    </div>
  );
}
