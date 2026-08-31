import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-12">
      <Link href="/" className="font-[family-name:var(--font-display)] text-lg italic text-ink">
        Wedding Univers
      </Link>
      <nav className="flex items-center gap-6 text-sm text-ink-soft">
        {user ? (
          <>
            <Link href="/mon-mariage" className="hover:text-gold">
              Mon mariage
            </Link>
            <Link href="/mon-mariage/taches" className="hover:text-gold">
              Tâches
            </Link>
            <Link href="/mon-mariage/budget" className="hover:text-gold">
              Budget
            </Link>
            <Link href="/compte" className="hover:text-gold">
              Mon compte
            </Link>
          </>
        ) : (
          <>
            <Link href="/connexion" className="hover:text-gold">
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="rounded-full bg-ink px-4 py-2 text-xs font-medium tracking-wide text-ivory transition hover:bg-ink-soft"
            >
              Créer un compte
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
