"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const PORTFOLIO_BUCKET = "vendor-portfolio";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const WEDDING_STYLE_SLUGS = new Set([
  "rustic",
  "classic",
  "boho",
  "luxury",
  "urban",
  "beach",
  "vintage",
  "modern",
  "other",
]);

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase()
    .slice(-100);
}

export async function uploadPortfolioItemAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const file = formData.get("file");
  const style = formData.get("style");
  const serviceId = formData.get("serviceId");
  const contextSlug = formData.get("contextSlug");

  if (typeof vendorId !== "string" || !(file instanceof File) || file.size === 0) {
    return;
  }
  if (!file.type.startsWith("image/") || file.size > MAX_FILE_SIZE_BYTES) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const path = `${vendorId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) {
    return;
  }

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .insert({
      kind: "photo",
      storage_path: path,
      uploaded_by_user_id: user.id,
      vendor_id: vendorId,
    })
    .select("id")
    .single();

  if (mediaError || !media) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
    return;
  }

  let categoryId: string | null = null;
  if (typeof contextSlug === "string" && contextSlug !== "") {
    const { data: category } = await supabase
      .from("vendor_categories")
      .select("id")
      .eq("slug", contextSlug)
      .single();
    categoryId = category?.id ?? null;
  }

  await supabase.from("vendor_portfolio_items").insert({
    vendor_id: vendorId,
    media_id: media.id,
    style: typeof style === "string" && WEDDING_STYLE_SLUGS.has(style) ? style : null,
    service_id: typeof serviceId === "string" && serviceId !== "" ? serviceId : null,
    category_id: categoryId,
  });

  revalidatePath("/pro/portfolio");
  revalidatePath(`/prestataires/${vendorId}`);
}

export async function deletePortfolioItemAction(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");
  const vendorId = formData.get("vendorId");
  if (typeof itemId !== "string" || typeof vendorId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const { data: item } = await supabase
    .from("vendor_portfolio_items")
    .select("media_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return;
  }

  const { data: media } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", item.media_id)
    .maybeSingle();

  if (media) {
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([media.storage_path]);
  }

  // Cascades to delete the vendor_portfolio_items row (media_id references
  // media(id) on delete cascade).
  await supabase.from("media").delete().eq("id", item.media_id);

  revalidatePath("/pro/portfolio");
  revalidatePath(`/prestataires/${vendorId}`);
}
