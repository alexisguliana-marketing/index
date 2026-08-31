import Link from "next/link";
import { redirect } from "next/navigation";

import { VENDOR_CONTEXT_TAGS, WEDDING_STYLES } from "@wedding-univers/config";

import { createClient } from "@/lib/supabase/server";

import { deletePortfolioItemAction, uploadPortfolioItemAction } from "./actions";

const PORTFOLIO_BUCKET = "vendor-portfolio";

interface PortfolioItemRow {
  id: string;
  style: string | null;
  mediaId: string;
  storagePath: string;
  serviceName: string | null;
  categoryLabel: string | null;
}

export default async function PortfolioProPage() {
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
    .select("id, name")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    redirect("/pro/profil/creer");
  }

  const [{ data: services }, { data: items }] = await Promise.all([
    supabase.from("vendor_services").select("id, name").eq("vendor_id", vendor.id).order("name"),
    supabase
      .from("vendor_portfolio_items")
      .select("id, style, media_id, service_id, category_id")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
  ]);

  const itemRows = items ?? [];
  const mediaIds = itemRows.map((item) => item.media_id as string);
  const serviceIds = itemRows.map((item) => item.service_id).filter((id): id is string => Boolean(id));
  const categoryIds = itemRows.map((item) => item.category_id).filter((id): id is string => Boolean(id));

  const [{ data: mediaRows }, { data: serviceRows }, { data: categoryRows }] = await Promise.all([
    mediaIds.length ? supabase.from("media").select("id, storage_path").in("id", mediaIds) : Promise.resolve({ data: [] as { id: string; storage_path: string }[] }),
    serviceIds.length ? supabase.from("vendor_services").select("id, name").in("id", serviceIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    categoryIds.length ? supabase.from("vendor_categories").select("id, label").in("id", categoryIds) : Promise.resolve({ data: [] as { id: string; label: string }[] }),
  ]);

  const pathByMediaId = new Map((mediaRows ?? []).map((row) => [row.id, row.storage_path]));
  const serviceNameById = new Map((serviceRows ?? []).map((row) => [row.id, row.name]));
  const categoryLabelById = new Map((categoryRows ?? []).map((row) => [row.id, row.label]));

  const portfolioItems: PortfolioItemRow[] = itemRows.map((item) => ({
    id: item.id,
    style: item.style,
    mediaId: item.media_id as string,
    storagePath: pathByMediaId.get(item.media_id as string) ?? "",
    serviceName: item.service_id ? (serviceNameById.get(item.service_id) ?? null) : null,
    categoryLabel: item.category_id ? (categoryLabelById.get(item.category_id) ?? null) : null,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Espace professionnel</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">Portfolio</h1>
      <p className="mb-10 text-sm text-ink-soft">
        Visible sur votre vitrine publique une fois votre profil publié. <Link href="/pro/profil" className="text-gold hover:underline">Retour au profil →</Link>
      </p>

      <form
        action={uploadPortfolioItemAction}
        encType="multipart/form-data"
        className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-white p-4"
      >
        <input type="hidden" name="vendorId" value={vendor.id} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-xs text-ink-soft">
            Photo (JPG/PNG, 10 Mo max)
          </label>
          <input id="file" name="file" type="file" accept="image/*" required className="text-sm text-ink" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="style" className="text-xs text-ink-soft">
              Style
            </label>
            <select
              id="style"
              name="style"
              defaultValue=""
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            >
              <option value="">Non défini</option>
              {WEDDING_STYLES.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contextSlug" className="text-xs text-ink-soft">
              Contexte
            </label>
            <select
              id="contextSlug"
              name="contextSlug"
              defaultValue=""
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            >
              <option value="">Non défini</option>
              {VENDOR_CONTEXT_TAGS.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="serviceId" className="text-xs text-ink-soft">
              Prestation liée
            </label>
            <select
              id="serviceId"
              name="serviceId"
              defaultValue=""
              className="rounded-md border border-border bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-gold"
            >
              <option value="">Aucune</option>
              {(services ?? []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft"
        >
          Ajouter au portfolio
        </button>
      </form>

      {portfolioItems.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucune photo pour l&apos;instant.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {portfolioItems.map((item) => {
            const publicUrl = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(item.storagePath).data.publicUrl;
            return (
              <li key={item.id} className="overflow-hidden rounded-lg border border-border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicUrl} alt="" className="aspect-square w-full object-cover" />
                <div className="p-2">
                  <p className="text-xs text-ink-soft">
                    {[item.categoryLabel, item.serviceName].filter(Boolean).join(" · ") || "Sans tag"}
                  </p>
                  <form action={deletePortfolioItemAction} className="mt-1">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <button type="submit" className="text-xs text-danger hover:underline">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
