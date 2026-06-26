'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { MobileNavProvider } from '@/lib/mobile-nav';

/**
 * Providers — bọc TanStack Query (server state) + AuthProvider (phiên đăng nhập).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MobileNavProvider>{children}</MobileNavProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
