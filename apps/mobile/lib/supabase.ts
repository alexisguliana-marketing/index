import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

/**
 * No live Supabase project has been provisioned yet (see PROJECT_STATUS.md).
 * Until EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set,
 * Supabase-backed screens degrade gracefully instead of crashing — mirrors
 * apps/web/src/lib/supabase/env.ts (same reasoning, RN/Expo equivalent).
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

/**
 * Session persistence uses AsyncStorage (there's no cookie/server-render
 * split on mobile like `@supabase/ssr` — one client, used everywhere).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) {
    return null;
  }
  if (!client) {
    client = createSupabaseClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
