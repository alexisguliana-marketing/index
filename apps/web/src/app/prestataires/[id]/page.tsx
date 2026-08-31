import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { contactVendorAction, toggleFavoriteAction } from "./actions";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let weddingId: string | null = null;
  let isFavorited = false;
  if (user) {
    const { data: membership } = await supabase
      .from("wedding_members")
      .select("wedding_id")
      .eq("user_id", user.id)
      .order("invited_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    weddingId = membership?.wedding_id ?? null;

    if (weddingId) {
      const { data: favorite } = await supabase
        .from("favorites")
        .select("id")
        .eq("wedding_id", weddingId)
        .eq("vendor_id", id)
        .maybeSingle();
      isFavorited = Boolean(favorite);
    }
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

  const { data: portfolioItems } = await supabase
    .from("vendor_portfolio_items")
    .select("id, media_id")
    .eq("vendor_id", id)
    .order("created_at", { ascending: false })
    .limit(12);

  const mediaIds = (portfolioItems ?? []).map((item) => item.media_id as string);
  const { data: mediaRows } = mediaIds.length
    ? await supabase.from("media").select("id, storage_path").in("id", mediaIds)
    : { data: [] as { id: string; storage_path: string }[] };
  const pathByMediaId = new Map((mediaRows ?? []).map((row) => [row.id, row.storage_path]));
  const portfolioUrls = (portfolioItems ?? [])
    .map((item) => pathByMediaId.get(item.media_id as string))
    .filter((path): path is string => Boolean(path))
    .map((path) => supabase.storage.from("vendor-portfolio").getPublicUrl(path).data.publicUrl);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Prestataire</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">{vendor.name}</h1>
      {vendor.tagline && <p className="mb-2 text-sm text-ink-soft">{vendor.tagline}</p>}
      <p className="mb-6 text-sm text-ink-soft">
        {vendor.city ?? "Ville non renseignée"}
        {vendor.rating_average !== null && ` · ${vendor.rating_average}★ (${vendor.rating_count} avis)`}
      </p>

      {weddingId ? (
        <div className="mb-10 flex flex-col gap-4 rounded-lg border border-border bg-white p-4">
          <form action={toggleFavoriteAction}>
            <input type="hidden" name="vendorId" value={vendor.id} />
            <input type="hidden" name="isFavorited" value={isFavorited.toString()} />
            <button
              type="submit"
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                isFavorited ? "bg-gold/20 text-ink" : "border border-border text-ink-soft hover:border-gold"
              }`}
            >
              {isFavorited ? "★ Dans mes favoris" : "☆ Ajouter aux favoris"}
            </button>
          </form>

          <form action={contactVendorAction} className="flex flex-col gap-2">
            <input type="hidden" name="vendorId" value={vendor.id} />
            <label htmlFor="message" className="text-xs text-ink-soft">
              Contacter {vendor.name}
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              required
              placeholder="Bonjour, votre profil nous intéresse pour notre mariage..."
              className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="self-start rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft"
            >
              Envoyer
            </button>
          </form>
        </div>
      ) : (
        !user && (
          <p className="mb-10 text-xs text-ink-soft">
            <a href="/connexion" className="text-gold hover:underline">
              Connectez-vous
            </a>{" "}
            pour ajouter ce prestataire à vos favoris ou le contacter.
          </p>
        )
      )}

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

        {portfolioUrls.length > 0 && (
          <Card title="Portfolio">
            <ul className="grid grid-cols-3 gap-2">
              {portfolioUrls.map((url) => (
                <li key={url} className="overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="aspect-square w-full object-cover" />
                </li>
              ))}
            </ul>
          </Card>
        )}

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
