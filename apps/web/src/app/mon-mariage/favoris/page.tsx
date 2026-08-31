import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

interface FavoriteVendorRow {
  favoriteId: string;
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
}

export default async function FavorisPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl italic text-ink">
          Configuration requise
        </h1>
        <p className="text-sm text-ink-soft">
          Aucun projet Supabase n&apos;est encore connecté. Voir{" "}
          <code className="rounded bg-ivory-deep px-1.5 py-0.5">apps/web/.env.example</code>.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/mon-mariage/creer");
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select("id, vendor_id, created_at")
    .eq("wedding_id", membership.wedding_id)
    .not("vendor_id", "is", null)
    .order("created_at", { ascending: false });

  const vendorIds = (favorites ?? []).map((row) => row.vendor_id as string);
  const { data: vendors } = vendorIds.length
    ? await supabase.from("vendors").select("id, name, tagline, city").in("id", vendorIds)
    : { data: [] as { id: string; name: string; tagline: string | null; city: string | null }[] };
  const vendorById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor]));

  const rows: FavoriteVendorRow[] = (favorites ?? [])
    .map((favorite) => {
      const vendor = vendorById.get(favorite.vendor_id as string);
      return vendor ? { favoriteId: favorite.id, ...vendor } : null;
    })
    .filter((row): row is FavoriteVendorRow => row !== null);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">★ Favoris</p>
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        Prestataires favoris
      </h1>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Aucun favori pour l&apos;instant.{" "}
          <Link href="/prestataires" className="text-gold hover:underline">
            Explorer les prestataires →
          </Link>
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((vendor) => (
            <li key={vendor.favoriteId} className="rounded-lg border border-border bg-white p-5">
              <Link href={`/prestataires/${vendor.id}`} className="text-sm font-medium text-ink hover:text-gold">
                {vendor.name}
              </Link>
              {vendor.tagline && <p className="mt-1 text-sm text-ink-soft">{vendor.tagline}</p>}
              <p className="mt-2 text-xs text-ink-soft">{vendor.city ?? "Ville non renseignée"}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
