import Link from "next/link";

import { VENDOR_PROFESSIONS } from "@wedding-univers/config";
import { vendorSearchFiltersSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

interface VendorCard {
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
  rating_average: number | null;
  rating_count: number;
}

export default async function PrestatairesPage({ searchParams }: PageProps<"/prestataires">) {
  const params = await searchParams;

  const raw = {
    categorySlug: firstValue(params.categorie) || undefined,
    city: firstValue(params.ville) || undefined,
    maxPrice: firstValue(params.prixMax) ? Number(firstValue(params.prixMax)) : undefined,
    minRating: firstValue(params.noteMin) ? Number(firstValue(params.noteMin)) : undefined,
    availableOn: firstValue(params.date) || undefined,
  };
  const parsedFilters = vendorSearchFiltersSchema.safeParse(raw);
  const filters = parsedFilters.success ? parsedFilters.data : {};

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

  let query = supabase
    .from("vendors")
    .select("id, name, tagline, city, rating_average, rating_count")
    .eq("is_published", true);

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.minRating !== undefined) {
    query = query.gte("rating_average", filters.minRating);
  }

  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from("vendor_categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .single();
    const { data: assignments } = category
      ? await supabase.from("vendor_category_assignments").select("vendor_id").eq("category_id", category.id)
      : { data: [] as { vendor_id: string }[] };
    const ids = (assignments ?? []).map((row) => row.vendor_id as string);
    query = query.in("id", ids.length > 0 ? ids : [NO_MATCH_ID]);
  }

  if (filters.maxPrice !== undefined) {
    const { data: services } = await supabase.from("vendor_services").select("vendor_id").lte("price", filters.maxPrice);
    const ids = [...new Set((services ?? []).map((row) => row.vendor_id as string))];
    query = query.in("id", ids.length > 0 ? ids : [NO_MATCH_ID]);
  }

  if (filters.availableOn) {
    const { data: unavailable } = await supabase
      .from("vendor_availability")
      .select("vendor_id")
      .eq("date", filters.availableOn)
      .eq("is_available", false);
    const excludeIds = (unavailable ?? []).map((row) => row.vendor_id as string);
    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }
  }

  const { data: vendors } = await query
    .order("rating_average", { ascending: false, nullsFirst: false })
    .limit(30);

  const results = (vendors ?? []) as VendorCard[];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">🔍 Prestataires</p>
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        Trouver un prestataire
      </h1>

      <form className="mb-10 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categorie" className="text-xs text-ink-soft">
            Métier
          </label>
          <select
            id="categorie"
            name="categorie"
            defaultValue={filters.categorySlug ?? ""}
            className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
          >
            <option value="">Tous</option>
            {VENDOR_PROFESSIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ville" className="text-xs text-ink-soft">
            Ville
          </label>
          <input
            id="ville"
            name="ville"
            type="text"
            defaultValue={filters.city ?? ""}
            className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prixMax" className="text-xs text-ink-soft">
            Prix max (€)
          </label>
          <input
            id="prixMax"
            name="prixMax"
            type="number"
            min={0}
            defaultValue={filters.maxPrice ?? ""}
            className="w-28 rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="noteMin" className="text-xs text-ink-soft">
            Note min
          </label>
          <select
            id="noteMin"
            name="noteMin"
            defaultValue={filters.minRating?.toString() ?? ""}
            className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
          >
            <option value="">Toutes</option>
            {[3, 4, 4.5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}+
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-xs text-ink-soft">
            Disponible le
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={filters.availableOn ?? ""}
            className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft"
        >
          Rechercher
        </button>
      </form>

      {results.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucun prestataire ne correspond à ces critères pour l&apos;instant.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((vendor) => (
            <li key={vendor.id} className="rounded-lg border border-border bg-white p-5">
              <Link href={`/prestataires/${vendor.id}`} className="text-sm font-medium text-ink hover:text-gold">
                {vendor.name}
              </Link>
              {vendor.tagline && <p className="mt-1 text-sm text-ink-soft">{vendor.tagline}</p>}
              <p className="mt-2 text-xs text-ink-soft">
                {vendor.city ?? "Ville non renseignée"}
                {vendor.rating_average !== null && ` · ${vendor.rating_average}★ (${vendor.rating_count} avis)`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
