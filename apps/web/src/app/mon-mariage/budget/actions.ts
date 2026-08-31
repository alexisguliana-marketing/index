"use server";

import { revalidatePath } from "next/cache";

import { createBudgetItemSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

export type CreateBudgetItemFormState =
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

export async function createBudgetItemAction(
  _state: CreateBudgetItemFormState,
  formData: FormData,
): Promise<CreateBudgetItemFormState> {
  const parsed = createBudgetItemSchema.safeParse({
    weddingId: formData.get("weddingId"),
    category: formData.get("category"),
    label: formData.get("label"),
    planned: readNumber(formData, "planned") ?? 0,
    spent: readNumber(formData, "spent") ?? 0,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: "Configuration Supabase manquante." };
  }

  const { data: category } = await supabase
    .from("task_categories")
    .select("id")
    .eq("slug", parsed.data.category)
    .single();

  if (!category) {
    return { message: "Catégorie inconnue." };
  }

  const { error } = await supabase.from("budget_items").insert({
    wedding_id: parsed.data.weddingId,
    category_id: category.id,
    label: parsed.data.label,
    planned: parsed.data.planned,
    spent: parsed.data.spent,
  });

  if (error) {
    return { message: "Impossible de créer le poste budgétaire. Vérifiez que vous avez les droits nécessaires." };
  }

  revalidatePath("/mon-mariage/budget");
  revalidatePath("/mon-mariage");
}

export async function updateBudgetItemAction(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");
  const planned = readNumber(formData, "planned");
  const spent = readNumber(formData, "spent");

  if (typeof itemId !== "string" || planned === null || spent === null || planned < 0 || spent < 0) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("budget_items").update({ planned, spent }).eq("id", itemId);

  revalidatePath("/mon-mariage/budget");
  revalidatePath("/mon-mariage");
}

export async function deleteBudgetItemAction(formData: FormData): Promise<void> {
  const itemId = formData.get("itemId");
  if (typeof itemId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("budget_items").delete().eq("id", itemId);

  revalidatePath("/mon-mariage/budget");
  revalidatePath("/mon-mariage");
}
