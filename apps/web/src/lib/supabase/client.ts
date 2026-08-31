import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "./env";

/**
 * Supabase client for use in Client Components. Returns `null` when no
 * Supabase project is configured yet — see `hasSupabaseEnv`.
 */
export function createClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
