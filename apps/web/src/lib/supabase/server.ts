import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "./env";

/**
 * Supabase client for use in Server Components, Route Handlers and Server
 * Actions. Never use this (or the service role key) in a Client Component —
 * only `NEXT_PUBLIC_*` values are safe to reach the browser.
 *
 * Returns `null` when no Supabase project is configured yet — callers must
 * handle that (treat as logged-out / show a setup message) rather than
 * crash. See `hasSupabaseEnv`.
 */
export async function createClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the middleware refreshes the
          // session instead, so this can be safely ignored here.
        }
      },
    },
  });
}
