import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function formatEuros(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h2 className="mb-4 text-sm font-medium text-ink-soft">{title}</h2>
      {children}
    </div>
  );
}

export default async function PrestataireDetailPage({ params }: PageProps<"/prestataires/[id]">) {
  const { id } = await params;

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

  const { data: vendor } = await supabase
    .from("vendors")
    .select(
      "id, name, tagline, description, city, travel_radius_km, experience_years, capacity_min, capacity_max, rating_average, rating_count",
    )
    .eq("id", id)
    .maybeSingle();

  if (!vendor) {
    notFound();
  }

  const [{ data: assignments }, { data: services }, { data: locations }, { data: availability }] = await Promise.all([
    supabase.from("vendor_category_assignments").select("category_id").eq("vendor_id", id),
    supabase.from("vendor_services").select("id, name, description, price").eq("vendor_id", id).order("name"),
    supabase.from("vendor_locations").select("id, city, region").eq("vendor_id", id).order("city"),
    supabase
      .from("vendor_availability")
      .select("id, date")
      .eq("vendor_id", id)
      .eq("is_available", false)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(10),
  ]);

  const categoryIds = (assignments ?? []).map((row) => row.category_id as string);
  const { data: categories } = categoryIds.length
    ? await supabase.from("vendor_categories").select("id, label").in("id", categoryIds)
    : { data: [] as { id: string; label: string }[] };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Prestataire</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">{vendor.name}</h1>
      {vendor.tagline && <p className="mb-2 text-sm text-ink-soft">{vendor.tagline}</p>}
      <p className="mb-10 text-sm text-ink-soft">
        {vendor.city ?? "Ville non renseignée"}
        {vendor.rating_average !== null && ` · ${vendor.rating_average}★ (${vendor.rating_count} avis)`}
      </p>

      <div className="grid grid-cols-1 gap-4">
        <Card title="Profil">
          {vendor.description && <p className="mb-4 text-sm text-ink-soft">{vendor.description}</p>}
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between py-2.5 first:pt-0">
              <dt className="text-sm text-ink-soft">Zone de déplacement</dt>
              <dd className="text-sm font-medium text-ink">
                {vendor.travel_radius_km !== null ? `${vendor.travel_radius_km} km` : "Non définie"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-ink-soft">Expérience</dt>
              <dd className="text-sm font-medium text-ink">
                {vendor.experience_years !== null ? `${vendor.experience_years} ans` : "Non définie"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5 last:pb-0">
              <dt className="text-sm text-ink-soft">Capacité</dt>
              <dd className="text-sm font-medium text-ink">
                {vendor.capacity_min !== null || vendor.capacity_max !== null
                  ? `${vendor.capacity_min ?? "?"} – ${vendor.capacity_max ?? "?"} invités`
                  : "Non définie"}
              </dd>
            </div>
          </dl>
          {(categories ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(categories ?? []).map((category) => (
                <span key={category.id} className="rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-ink-soft">
                  {category.label}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Prestations">
          {(services ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">Aucune prestation renseignée.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(services ?? []).map((service) => (
                <li key={service.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{service.name}</span>
                  <span className="text-ink-soft">{formatEuros(service.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Zone d'intervention">
          {(locations ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">Aucune zone renseignée.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {(locations ?? []).map((location) => (
                <li key={location.id} className="text-sm text-ink">
                  {location.city}
                  {location.region ? ` (${location.region})` : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {(availability ?? []).length > 0 && (
          <Card title="Prochaines indisponibilités">
            <ul className="flex flex-col gap-1.5">
              {(availability ?? []).map((entry) => (
                <li key={entry.id} className="text-sm text-ink-soft">
                  {formatDate(entry.date)}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </main>
  );
}
