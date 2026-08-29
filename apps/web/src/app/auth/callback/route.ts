import { NextResponse } from "next/server";

import { safeRedirectTarget } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE callback for Supabase Auth email links (signup confirmation,
 * password recovery). Exchanges the one-time `code` for a session, then
 * redirects to `next` (defaults to /compte).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectTarget(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/connexion`);
}
