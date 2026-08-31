"use server";

import { revalidatePath } from "next/cache";

import { createVendorServiceSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

function readNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function togglePublishedAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const nextValue = formData.get("nextValue");
  if (typeof vendorId !== "string" || (nextValue !== "true" && nextValue !== "false")) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("vendors").update({ is_published: nextValue === "true" }).eq("id", vendorId);

  revalidatePath("/pro/profil");
}

export async function addVendorCategoryAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const categorySlug = formData.get("categorySlug");
  if (typeof vendorId !== "string" || typeof categorySlug !== "string" || categorySlug === "") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const { data: category } = await supabase
    .from("vendor_categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!category) {
    return;
  }

  await supabase
    .from("vendor_category_assignments")
    .insert({ vendor_id: vendorId, category_id: category.id })
    .select()
    .maybeSingle();

  revalidatePath("/pro/profil");
}

export async function removeVendorCategoryAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const categoryId = formData.get("categoryId");
  if (typeof vendorId !== "string" || typeof categoryId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase
    .from("vendor_category_assignments")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("category_id", categoryId);

  revalidatePath("/pro/profil");
}

export async function createVendorServiceAction(formData: FormData): Promise<void> {
  const parsed = createVendorServiceSchema.safeParse({
    vendorId: formData.get("vendorId"),
    name: formData.get("name"),
    price: readNumber(formData, "price"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("vendor_services").insert({
    vendor_id: parsed.data.vendorId,
    name: parsed.data.name,
    price: parsed.data.price,
  });

  revalidatePath("/pro/profil");
}

export async function deleteVendorServiceAction(formData: FormData): Promise<void> {
  const serviceId = formData.get("serviceId");
  if (typeof serviceId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("vendor_services").delete().eq("id", serviceId);

  revalidatePath("/pro/profil");
}

export async function createVendorLocationAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const city = formData.get("city");
  const region = formData.get("region");

  if (typeof vendorId !== "string" || typeof city !== "string" || city.trim() === "") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("vendor_locations").insert({
    vendor_id: vendorId,
    city: city.trim(),
    region: typeof region === "string" && region.trim() !== "" ? region.trim() : null,
  });

  revalidatePath("/pro/profil");
}

export async function deleteVendorLocationAction(formData: FormData): Promise<void> {
  const locationId = formData.get("locationId");
  if (typeof locationId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("vendor_locations").delete().eq("id", locationId);

  revalidatePath("/pro/profil");
}

export async function addAvailabilityAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const date = formData.get("date");
  const isAvailable = formData.get("isAvailable");

  if (typeof vendorId !== "string" || typeof date !== "string" || date === "") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase
    .from("vendor_availability")
    .upsert(
      { vendor_id: vendorId, date, is_available: isAvailable === "true" },
      { onConflict: "vendor_id,date" },
    );

  revalidatePath("/pro/profil");
}

export async function removeAvailabilityAction(formData: FormData): Promise<void> {
  const availabilityId = formData.get("availabilityId");
  if (typeof availabilityId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("vendor_availability").delete().eq("id", availabilityId);

  revalidatePath("/pro/profil");
}
