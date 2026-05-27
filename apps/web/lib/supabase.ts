import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PublicEnv = {
  publishableKey: string;
  url: string;
};

function getPublicSupabaseEnv(): PublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Public Supabase environment variables are not configured.");
  }

  return { publishableKey, url };
}

export function createBrowserSupabaseClient(): SupabaseClient {
  const { publishableKey, url } = getPublicSupabaseEnv();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });
}

export function createServerSupabaseClient(): SupabaseClient {
  const { publishableKey, url } = getPublicSupabaseEnv();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
