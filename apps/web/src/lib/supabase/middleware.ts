import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "./env";

const PROTECTED_PATHS = ["/compte", "/mon-mariage"];

/**
 * Refreshes the Supabase auth session on every request and redirects
 * unauthenticated users away from protected paths. Must run in `proxy.ts`
 * — this is the only place cookie writes reliably reach the browser
 * (Server Components can't set cookies).
 *
 * No-ops when Supabase isn't configured yet (no live project provisioned —
 * see PROJECT_STATUS.md): there is nothing to refresh, and protected pages
 * fall back to showing a setup message instead of a redirect loop.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !user) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
