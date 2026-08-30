"use server";

import { redirect } from "next/navigation";

import { createWeddingSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

export type CreateWeddingFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

function readNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readOptionalString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() !== "" ? raw : null;
}

export async function createWeddingAction(
  _state: CreateWeddingFormState,
  formData: FormData,
): Promise<CreateWeddingFormState> {
  const parsed = createWeddingSchema.safeParse({
    partner1FirstName: formData.get("partner1FirstName"),
    partner2FirstName: formData.get("partner2FirstName"),
    date: readOptionalString(formData, "date"),
    isDateFlexible: formData.get("isDateFlexible") === "on",
    location: readOptionalString(formData, "location"),
    isVenueKnown: formData.get("isVenueKnown") === "on",
    guestCountEstimate: readNumber(formData, "guestCountEstimate"),
    budgetTotal: readNumber(formData, "budgetTotal"),
    style: readOptionalString(formData, "style"),
    ambiance: readOptionalString(formData, "ambiance"),
    ceremonyType: readOptionalString(formData, "ceremonyType"),
    budgetTier: readOptionalString(formData, "budgetTier"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: "Configuration Supabase manquante. Voir apps/web/.env.example." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/connexion");
  }

  const { partner1FirstName, partner2FirstName, ...rest } = parsed.data;

  const { error } = await supabase
    .from("weddings")
    .insert({
      created_by: user.id,
      partner1_first_name: partner1FirstName,
      partner2_first_name: partner2FirstName,
      date: rest.date ?? null,
      is_date_flexible: rest.isDateFlexible,
      location: rest.location ?? null,
      is_venue_known: rest.isVenueKnown,
      guest_count_estimate: rest.guestCountEstimate ?? null,
      budget_total: rest.budgetTotal ?? null,
      style: rest.style ?? null,
      ambiance: rest.ambiance ?? null,
      ceremony_type: rest.ceremonyType ?? null,
      budget_tier: rest.budgetTier ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { message: "Impossible de créer le mariage. Réessayez." };
  }

  redirect("/mon-mariage");
}
