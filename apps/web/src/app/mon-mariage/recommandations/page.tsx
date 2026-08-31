import Link from "next/link";
import { redirect } from "next/navigation";

import { VENDOR_PROFESSIONS, VENDOR_TO_TASK_CATEGORY } from "@wedding-univers/config";
import { rankVendorsForCouple, topReasons, type CoupleMatchProfile, type VendorMatchProfile } from "@wedding-univers/matching";
import type { CeremonyType, VendorCategorySlug, WeddingStyle } from "@wedding-univers/types";

import { createClient } from "@/lib/supabase/server";

const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";
const RESULTS_LIMIT = 12;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

interface VendorCard {
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
}

export default async function RecommandationsPage({
  searchParams,
}: PageProps<"/mon-mariage/recommandations">) {
  const params = await searchParams;
  const requestedSlug = firstValue(params.metier);
  const categorySlug: VendorCategorySlug = (VENDOR_PROFESSIONS.find((option) => option.slug === requestedSlug)
    ?.slug ?? VENDOR_PROFESSIONS[0].slug) as VendorCategorySlug;

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

  const { data: wedding } = await supabase
    .from("weddings")
    .select("date, style, ceremony_type, guest_count_estimate")
    .eq("id", membership.wedding_id)
    .maybeSingle();

  const taskCategorySlug = VENDOR_TO_TASK_CATEGORY[categorySlug];
  const { data: taskCategory } = await supabase
    .from("task_categories")
    .select("id")
    .eq("slug", taskCategorySlug)
    .single();

  let budgetForCategory: number | null = null;
  if (taskCategory) {
    const { data: budgetItems } = await supabase
      .from("budget_items")
      .select("planned")
      .eq("wedding_id", membership.wedding_id)
      .eq("category_id", taskCategory.id);
    if (budgetItems && budgetItems.length > 0) {
      budgetForCategory = budgetItems.reduce((sum, item) => sum + Number(item.planned), 0);
    }
  }

  const coupleProfile: CoupleMatchProfile = {
    weddingDate: wedding?.date ?? null,
    budgetForCategory,
    latitude: null,
    longitude: null,
    style: (wedding?.style as WeddingStyle | null) ?? null,
    ceremonyType: (wedding?.ceremony_type as CeremonyType | null) ?? null,
    guestCountEstimate: wedding?.guest_count_estimate ?? null,
    preferenceTags: [],
  };

  const { data: vendorCategory } = await supabase
    .from("vendor_categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  const { data: assignments } = vendorCategory
    ? await supabase.from("vendor_category_assignments").select("vendor_id").eq("category_id", vendorCategory.id)
    : { data: [] as { vendor_id: string }[] };

  const vendorIds = (assignments ?? []).map((row) => row.vendor_id as string);

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, tagline, city, travel_radius_km, experience_years, capacity_min, capacity_max, rating_average")
    .eq("is_published", true)
    .in("id", vendorIds.length > 0 ? vendorIds : [NO_MATCH_ID]);

  const publishedIds = (vendors ?? []).map((vendor) => vendor.id);

  const [{ data: services }, { data: locations }, { data: availability }, { data: portfolioItems }] =
    await Promise.all([
      publishedIds.length
        ? supabase.from("vendor_services").select("vendor_id, price").in("vendor_id", publishedIds)
        : Promise.resolve({ data: [] as { vendor_id: string; price: number }[] }),
      publishedIds.length
        ? supabase.from("vendor_locations").select("vendor_id, latitude, longitude").in("vendor_id", publishedIds)
        : Promise.resolve({ data: [] as { vendor_id: string; latitude: number | null; longitude: number | null }[] }),
      publishedIds.length && wedding?.date
        ? supabase
            .from("vendor_availability")
            .select("vendor_id, is_available")
            .in("vendor_id", publishedIds)
            .eq("date", wedding.date)
        : Promise.resolve({ data: [] as { vendor_id: string; is_available: boolean }[] }),
      publishedIds.length
        ? supabase.from("vendor_portfolio_items").select("vendor_id, style").in("vendor_id", publishedIds)
        : Promise.resolve({ data: [] as { vendor_id: string; style: string | null }[] }),
    ]);

  const pricesByVendor = new Map<string, number[]>();
  for (const service of services ?? []) {
    const list = pricesByVendor.get(service.vendor_id) ?? [];
    list.push(Number(service.price));
    pricesByVendor.set(service.vendor_id, list);
  }

  const coordsByVendor = new Map<string, { latitude: number; longitude: number }>();
  for (const location of locations ?? []) {
    if (!coordsByVendor.has(location.vendor_id) && location.latitude !== null && location.longitude !== null) {
      coordsByVendor.set(location.vendor_id, { latitude: location.latitude, longitude: location.longitude });
    }
  }

  const availabilityByVendor = new Map((availability ?? []).map((row) => [row.vendor_id, row.is_available]));

  const stylesByVendor = new Map<string, WeddingStyle[]>();
  for (const item of portfolioItems ?? []) {
    if (!item.style) continue;
    const list = stylesByVendor.get(item.vendor_id) ?? [];
    if (!list.includes(item.style as WeddingStyle)) list.push(item.style as WeddingStyle);
    stylesByVendor.set(item.vendor_id, list);
  }

  const vendorProfiles: VendorMatchProfile[] = (vendors ?? []).map((vendor) => {
    const prices = pricesByVendor.get(vendor.id) ?? [];
    const coords = coordsByVendor.get(vendor.id);
    return {
      vendorId: vendor.id,
      priceMin: prices.length > 0 ? Math.min(...prices) : null,
      priceMax: prices.length > 0 ? Math.max(...prices) : null,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      travelRadiusKm: vendor.travel_radius_km,
      isAvailableOnDate: availabilityByVendor.get(vendor.id) ?? null,
      styles: stylesByVendor.get(vendor.id) ?? [],
      ceremonyTypes: [],
      capacityMin: vendor.capacity_min,
      capacityMax: vendor.capacity_max,
      experienceYears: vendor.experience_years,
      ratingAverage: vendor.rating_average,
      tags: [],
    };
  });

  const results = rankVendorsForCouple(coupleProfile, vendorProfiles).slice(0, RESULTS_LIMIT);
  const vendorById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor as VendorCard]));

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">💫 Wedding Match</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">Recommandations</h1>
      <p className="mb-8 text-sm text-ink-soft">
        Un score calculé à partir de votre budget, votre date, votre style et vos préférences — jamais un simple
        classement par popularité.
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        {VENDOR_PROFESSIONS.map((option) => (
          <Link
            key={option.slug}
            href={`/mon-mariage/recommandations?metier=${option.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              option.slug === categorySlug
                ? "bg-ink text-ivory"
                : "bg-ivory-deep text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucun prestataire publié dans cette catégorie pour l&apos;instant.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((result) => {
            const vendor = vendorById.get(result.vendorId);
            if (!vendor) return null;
            const reasons = topReasons(result, 3);
            return (
              <li key={vendor.id} className="rounded-lg border border-border bg-white p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Link href={`/prestataires/${vendor.id}`} className="text-sm font-medium text-ink hover:text-gold">
                    {vendor.name}
                  </Link>
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-ink">
                    {result.score}% de compatibilité
                  </span>
                </div>
                {vendor.tagline && <p className="mb-2 text-sm text-ink-soft">{vendor.tagline}</p>}
                {reasons.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {reasons.map((reason) => (
                      <li key={reason.key} className="text-xs text-ink-soft">
                        ✓ {reason.explanation}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
