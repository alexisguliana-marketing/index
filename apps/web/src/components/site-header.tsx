import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let unreadNotifications = 0;
  if (supabase && user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadNotifications = count ?? 0;
  }

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-12">
      <Link href="/" className="font-[family-name:var(--font-display)] text-lg italic text-ink">
        Wedding Univers
      </Link>
      <nav className="flex items-center gap-6 text-sm text-ink-soft">
        <Link href="/prestataires" className="hover:text-gold">
          Prestataires
        </Link>
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
            <Link href="/mon-mariage/invites" className="hover:text-gold">
              Invités
            </Link>
            <Link href="/mon-mariage/equipe" className="hover:text-gold">
              Équipe
            </Link>
            <Link href="/mon-mariage/recommandations" className="hover:text-gold">
              Recommandations
            </Link>
            <Link href="/mon-mariage/favoris" className="hover:text-gold">
              Favoris
            </Link>
            <Link href="/mon-mariage/messages" className="hover:text-gold">
              Messages
            </Link>
            <Link href="/notifications" className="hover:text-gold">
              🔔{unreadNotifications > 0 && ` ${unreadNotifications}`}
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
