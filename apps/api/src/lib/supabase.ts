import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseServerEnv = {
  serviceRoleKey: string;
  url: string;
};

export function getSupabaseServerEnv(): SupabaseServerEnv {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return { serviceRoleKey, url };
}

let supabaseAdmin: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  const { serviceRoleKey, url } = getSupabaseServerEnv();

  supabaseAdmin ??= createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdmin;
}
