import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@vierify/api-client";

export function getApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    return "http://localhost:3001/trpc";
  }

  return apiUrl.endsWith("/trpc") ? apiUrl : `${apiUrl.replace(/\/$/, "")}/trpc`;
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getApiUrl()
    })
  ]
});
