import { redirect } from "next/navigation";

import { VENDOR_PROFESSIONS } from "@wedding-univers/config";

import { createClient } from "@/lib/supabase/server";

import {
  addAvailabilityAction,
  addVendorCategoryAction,
  createVendorLocationAction,
  createVendorServiceAction,
  deleteVendorLocationAction,
  deleteVendorServiceAction,
  removeAvailabilityAction,
  removeVendorCategoryAction,
  togglePublishedAction,
} from "./actions";

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

export default async function ProfilProPage() {
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

  const { data: vendor } = await supabase
    .from("vendors")
    .select(
      "id, name, tagline, description, city, travel_radius_km, experience_years, capacity_min, capacity_max, is_published",
    )
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    redirect("/pro/profil/creer");
  }

  const [{ data: assignments }, { data: services }, { data: locations }, { data: availability }] = await Promise.all([
    supabase.from("vendor_category_assignments").select("category_id").eq("vendor_id", vendor.id),
    supabase.from("vendor_services").select("id, name, price").eq("vendor_id", vendor.id).order("name"),
    supabase.from("vendor_locations").select("id, city, region").eq("vendor_id", vendor.id).order("city"),
    supabase
      .from("vendor_availability")
      .select("id, date, is_available")
      .eq("vendor_id", vendor.id)
      .order("date", { ascending: true }),
  ]);

  const assignedIds = new Set((assignments ?? []).map((row) => row.category_id as string));

  const { data: categoryRows } = await supabase
    .from("vendor_categories")
    .select("id, slug, label")
    .in("slug", VENDOR_PROFESSIONS.map((profession) => profession.slug));

  const categoriesById = new Map((categoryRows ?? []).map((row) => [row.id as string, row]));
  const assignedCategoryDetails = [...assignedIds]
    .map((id) => categoriesById.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const availableProfessions = VENDOR_PROFESSIONS.filter((profession) => {
    const match = (categoryRows ?? []).find((row) => row.slug === profession.slug);
    return match ? !assignedIds.has(match.id as string) : true;
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Espace professionnel</p>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl italic text-ink">{vendor.name}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            vendor.is_published ? "bg-gold/20 text-ink" : "bg-ivory-deep text-ink-soft"
          }`}
        >
          {vendor.is_published ? "Publié" : "Brouillon"}
        </span>
      </div>
      {vendor.tagline && <p className="mb-6 text-sm text-ink-soft">{vendor.tagline}</p>}

      <form action={togglePublishedAction} className="mb-8">
        <input type="hidden" name="vendorId" value={vendor.id} />
        <input type="hidden" name="nextValue" value={(!vendor.is_published).toString()} />
        <button
          type="submit"
          className="rounded-full border border-border px-5 py-2 text-sm font-medium text-ink transition hover:border-gold"
        >
          {vendor.is_published ? "Repasser en brouillon" : "Publier ma vitrine"}
        </button>
        {!vendor.is_published && (
          <p className="mt-2 text-xs text-ink-soft">
            Votre profil n&apos;est visible que par vous tant qu&apos;il n&apos;est pas publié.
          </p>
        )}
      </form>

      <div className="grid grid-cols-1 gap-4">
        <Card title="Profil">
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between py-2.5 first:pt-0">
              <dt className="text-sm text-ink-soft">Ville</dt>
              <dd className="text-sm font-medium text-ink">{vendor.city ?? "Non définie"}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
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
          {vendor.description && <p className="mt-3 text-sm text-ink-soft">{vendor.description}</p>}
        </Card>

        <Card title="Métiers">
          <div className="mb-3 flex flex-wrap gap-2">
            {assignedCategoryDetails.map((category) => (
              <form key={category.id} action={removeVendorCategoryAction} className="inline-flex">
                <input type="hidden" name="vendorId" value={vendor.id} />
                <input type="hidden" name="categoryId" value={category.id} />
                <button
                  type="submit"
                  className="rounded-full bg-ivory-deep px-3 py-1 text-xs text-ink-soft transition hover:bg-danger/10 hover:text-danger"
                  title="Retirer"
                >
                  {category.label} ✕
                </button>
              </form>
            ))}
            {assignedCategoryDetails.length === 0 && <p className="text-sm text-ink-soft">Aucun métier associé.</p>}
          </div>
          {availableProfessions.length > 0 && (
            <form action={addVendorCategoryAction} className="flex items-center gap-2">
              <input type="hidden" name="vendorId" value={vendor.id} />
              <select
                name="categorySlug"
                defaultValue=""
                className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
              >
                <option value="" disabled>
                  Ajouter un métier
                </option>
                {availableProfessions.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="text-xs font-medium text-gold hover:underline">
                Ajouter
              </button>
            </form>
          )}
        </Card>

        <Card title="Prestations">
          <ul className="mb-3 flex flex-col gap-2">
            {(services ?? []).map((service) => (
              <li key={service.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{service.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-ink-soft">{formatEuros(service.price)}</span>
                  <form action={deleteVendorServiceAction}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <button type="submit" className="text-xs text-danger hover:underline">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {(services ?? []).length === 0 && <p className="text-sm text-ink-soft">Aucune prestation pour l&apos;instant.</p>}
          </ul>
          <form action={createVendorServiceAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="vendorId" value={vendor.id} />
            <input
              name="name"
              type="text"
              required
              placeholder="Nom de la prestation"
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            />
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="Prix (€)"
              className="w-32 rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            />
            <button type="submit" className="text-xs font-medium text-gold hover:underline">
              Ajouter
            </button>
          </form>
        </Card>

        <Card title="Zone d'intervention">
          <ul className="mb-3 flex flex-col gap-2">
            {(locations ?? []).map((location) => (
              <li key={location.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">
                  {location.city}
                  {location.region ? ` (${location.region})` : ""}
                </span>
                <form action={deleteVendorLocationAction}>
                  <input type="hidden" name="locationId" value={location.id} />
                  <button type="submit" className="text-xs text-danger hover:underline">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
            {(locations ?? []).length === 0 && <p className="text-sm text-ink-soft">Aucune zone pour l&apos;instant.</p>}
          </ul>
          <form action={createVendorLocationAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="vendorId" value={vendor.id} />
            <input
              name="city"
              type="text"
              required
              placeholder="Ville"
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            />
            <input
              name="region"
              type="text"
              placeholder="Région (optionnel)"
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            />
            <button type="submit" className="text-xs font-medium text-gold hover:underline">
              Ajouter
            </button>
          </form>
        </Card>

        <Card title="Disponibilités">
          <ul className="mb-3 flex flex-col gap-2">
            {(availability ?? []).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{formatDate(entry.date)}</span>
                <div className="flex items-center gap-3">
                  <span className={entry.is_available ? "text-gold" : "text-danger"}>
                    {entry.is_available ? "Disponible" : "Indisponible"}
                  </span>
                  <form action={removeAvailabilityAction}>
                    <input type="hidden" name="availabilityId" value={entry.id} />
                    <button type="submit" className="text-xs text-danger hover:underline">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {(availability ?? []).length === 0 && (
              <p className="text-sm text-ink-soft">Aucune date renseignée — toutes les dates sont considérées inconnues.</p>
            )}
          </ul>
          <form action={addAvailabilityAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="vendorId" value={vendor.id} />
            <input
              name="date"
              type="date"
              required
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            />
            <select
              name="isAvailable"
              defaultValue="false"
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            >
              <option value="false">Indisponible (déjà réservé)</option>
              <option value="true">Disponible</option>
            </select>
            <button type="submit" className="text-xs font-medium text-gold hover:underline">
              Ajouter
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
