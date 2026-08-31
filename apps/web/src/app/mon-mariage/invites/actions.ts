"use server";

import { revalidatePath } from "next/cache";

import { createGuestSchema, guestRsvpStatusSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

export type CreateGuestFormState =
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

export async function createGuestAction(
  _state: CreateGuestFormState,
  formData: FormData,
): Promise<CreateGuestFormState> {
  const parsed = createGuestSchema.safeParse({
    weddingId: formData.get("weddingId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    group: formData.get("group"),
    email: readOptionalString(formData, "email"),
    phone: readOptionalString(formData, "phone"),
    plusOne: formData.get("plusOne") === "on",
    childrenCount: readNumber(formData, "childrenCount") ?? 0,
    needsAccommodation: formData.get("needsAccommodation") === "on",
    mealPreference: readOptionalString(formData, "mealPreference"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: "Configuration Supabase manquante." };
  }

  const { error } = await supabase.from("guests").insert({
    wedding_id: parsed.data.weddingId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    group: parsed.data.group,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    plus_one: parsed.data.plusOne,
    children_count: parsed.data.childrenCount,
    needs_accommodation: parsed.data.needsAccommodation,
    meal_preference: parsed.data.mealPreference ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { message: "Impossible d'ajouter l'invité. Vérifiez que vous avez les droits nécessaires." };
  }

  revalidatePath("/mon-mariage/invites");
  revalidatePath("/mon-mariage");
}

export async function updateGuestRsvpAction(formData: FormData): Promise<void> {
  const guestId = formData.get("guestId");
  const statusParsed = guestRsvpStatusSchema.safeParse(formData.get("rsvpStatus"));
  if (typeof guestId !== "string" || !statusParsed.success) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("guests").update({ rsvp_status: statusParsed.data }).eq("id", guestId);

  revalidatePath("/mon-mariage/invites");
  revalidatePath("/mon-mariage");
}

export async function deleteGuestAction(formData: FormData): Promise<void> {
  const guestId = formData.get("guestId");
  if (typeof guestId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("guests").delete().eq("id", guestId);

  revalidatePath("/mon-mariage/invites");
  revalidatePath("/mon-mariage");
}
