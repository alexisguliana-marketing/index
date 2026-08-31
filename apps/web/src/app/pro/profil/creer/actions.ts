"use server";

import { redirect } from "next/navigation";

import { createVendorSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

export type CreateVendorFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

function readOptionalString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() !== "" ? raw : null;
}

function readNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function createVendorAction(
  _state: CreateVendorFormState,
  formData: FormData,
): Promise<CreateVendorFormState> {
  const parsed = createVendorSchema.safeParse({
    name: formData.get("name"),
    tagline: readOptionalString(formData, "tagline"),
    description: readOptionalString(formData, "description"),
    city: readOptionalString(formData, "city"),
    travelRadiusKm: readNumber(formData, "travelRadiusKm"),
    experienceYears: readNumber(formData, "experienceYears"),
    capacityMin: readNumber(formData, "capacityMin"),
    capacityMax: readNumber(formData, "capacityMax"),
    categorySlugs: formData.getAll("categorySlugs"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: "Configuration Supabase manquante." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/connexion");
  }

  const { data: vendor, error } = await supabase
    .from("vendors")
    .insert({
      owner_user_id: user.id,
      name: parsed.data.name,
      tagline: parsed.data.tagline ?? null,
      description: parsed.data.description ?? null,
      city: parsed.data.city ?? null,
      travel_radius_km: parsed.data.travelRadiusKm ?? null,
      experience_years: parsed.data.experienceYears ?? null,
      capacity_min: parsed.data.capacityMin ?? null,
      capacity_max: parsed.data.capacityMax ?? null,
    })
    .select("id")
    .single();

  if (error || !vendor) {
    return { message: "Impossible de créer le profil professionnel. Réessayez." };
  }

  const { data: categories } = await supabase
    .from("vendor_categories")
    .select("id, slug")
    .in("slug", parsed.data.categorySlugs);

  if (categories && categories.length > 0) {
    await supabase
      .from("vendor_category_assignments")
      .insert(categories.map((category) => ({ vendor_id: vendor.id, category_id: category.id })));
  }

  redirect("/pro/profil");
}
