import { redirect } from "next/navigation";

import { BUDGET_TIERS, CEREMONY_TYPES, WEDDING_STYLES } from "@wedding-univers/config";

import { createClient } from "@/lib/supabase/server";

function findLabel(options: { slug: string; label: string }[], slug: string | null): string | null {
  if (!slug) return null;
  return options.find((option) => option.slug === slug)?.label ?? null;
}

function formatDate(value: string | null): string {
  if (!value) return "Non définie";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatEuros(value: number | null): string {
  if (value === null) return "Non défini";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

export default async function MonMariagePage() {
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
    .select("wedding_id, weddings(*)")
    .eq("user_id", user.id)
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const wedding = membership?.weddings as
    | {
        partner1_first_name: string;
        partner2_first_name: string;
        date: string | null;
        is_date_flexible: boolean;
        location: string | null;
        is_venue_known: boolean;
        guest_count_estimate: number | null;
        budget_total: number | null;
        style: string | null;
        ambiance: string | null;
        ceremony_type: string | null;
        budget_tier: string | null;
      }
    | undefined;

  if (!wedding) {
    redirect("/mon-mariage/creer");
  }

  const details: { label: string; value: string }[] = [
    { label: "Date", value: `${formatDate(wedding.date)}${wedding.is_date_flexible ? " (flexible)" : ""}` },
    {
      label: "Lieu",
      value: wedding.location
        ? `${wedding.location}${wedding.is_venue_known ? " — lieu réservé" : ""}`
        : "Non défini",
    },
    {
      label: "Invités",
      value: wedding.guest_count_estimate !== null ? `${wedding.guest_count_estimate} personnes` : "Non défini",
    },
    { label: "Budget", value: formatEuros(wedding.budget_total) },
    { label: "Style", value: findLabel(WEDDING_STYLES, wedding.style) ?? "Non défini" },
    { label: "Ambiance", value: wedding.ambiance ?? "Non définie" },
    { label: "Cérémonie", value: findLabel(CEREMONY_TYPES, wedding.ceremony_type) ?? "Non définie" },
    { label: "Niveau de gamme", value: findLabel(BUDGET_TIERS, wedding.budget_tier) ?? "Non défini" },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Mon projet</p>
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        {wedding.partner1_first_name} &amp; {wedding.partner2_first_name}
      </h1>
      <dl className="divide-y divide-border rounded-lg border border-border bg-white">
        {details.map((detail) => (
          <div key={detail.label} className="flex items-center justify-between px-5 py-4">
            <dt className="text-sm text-ink-soft">{detail.label}</dt>
            <dd className="text-sm font-medium text-ink">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
