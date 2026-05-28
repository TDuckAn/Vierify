"use client";

import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@vierify/api-client";

export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();

export function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "http://localhost:3001/trpc";
  return apiUrl.endsWith("/trpc") ? apiUrl : `${apiUrl.replace(/\/$/, "")}/trpc`;
}
