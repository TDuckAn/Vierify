"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";

import { createBrowserSupabaseClient } from "./supabase";
import { getApiUrl, trpc } from "./trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getApiUrl(),
          headers: async () => {
            const supabase = createBrowserSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();
            return session ? { Authorization: `Bearer ${session.access_token}` } : {};
          }
        })
      ]
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
