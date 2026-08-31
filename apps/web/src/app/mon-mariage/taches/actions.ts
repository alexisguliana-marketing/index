"use server";

import { revalidatePath } from "next/cache";

import { generateDefaultChecklist } from "@wedding-univers/config";
import { createTaskSchema, taskStatusSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

export type CreateTaskFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

function readOptionalString(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() !== "" ? raw : null;
}

export async function createTaskAction(
  _state: CreateTaskFormState,
  formData: FormData,
): Promise<CreateTaskFormState> {
  const parsed = createTaskSchema.safeParse({
    weddingId: formData.get("weddingId"),
    title: formData.get("title"),
    category: formData.get("category"),
    dueDate: readOptionalString(formData, "dueDate"),
    priority: formData.get("priority"),
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

  const { error } = await supabase.from("tasks").insert({
    wedding_id: parsed.data.weddingId,
    title: parsed.data.title,
    category_id: category.id,
    due_date: parsed.data.dueDate ?? null,
    priority: parsed.data.priority,
  });

  if (error) {
    return { message: "Impossible de créer la tâche. Vérifiez que vous avez les droits nécessaires." };
  }

  revalidatePath("/mon-mariage/taches");
  revalidatePath("/mon-mariage");
}

export async function updateTaskStatusAction(formData: FormData): Promise<void> {
  const taskId = formData.get("taskId");
  const statusParsed = taskStatusSchema.safeParse(formData.get("status"));
  if (typeof taskId !== "string" || !statusParsed.success) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("tasks").update({ status: statusParsed.data }).eq("id", taskId);

  revalidatePath("/mon-mariage/taches");
  revalidatePath("/mon-mariage");
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const taskId = formData.get("taskId");
  if (typeof taskId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  await supabase.from("tasks").delete().eq("id", taskId);

  revalidatePath("/mon-mariage/taches");
  revalidatePath("/mon-mariage");
}

export async function generateChecklistAction(formData: FormData): Promise<void> {
  const weddingId = formData.get("weddingId");
  if (typeof weddingId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const { data: wedding } = await supabase.from("weddings").select("date").eq("id", weddingId).single();
  if (!wedding?.date) {
    return;
  }

  const { data: categories } = await supabase.from("task_categories").select("id, slug");
  if (!categories || categories.length === 0) {
    return;
  }
  const categoryIdBySlug = new Map(categories.map((row) => [row.slug, row.id as string]));

  const { data: existingTasks } = await supabase.from("tasks").select("title").eq("wedding_id", weddingId);
  const existingTitles = new Set((existingTasks ?? []).map((row) => row.title));

  const items = generateDefaultChecklist(new Date(wedding.date)).filter(
    (item) => !existingTitles.has(item.title) && categoryIdBySlug.has(item.category),
  );

  if (items.length === 0) {
    return;
  }

  await supabase.from("tasks").insert(
    items.map((item) => ({
      wedding_id: weddingId,
      title: item.title,
      category_id: categoryIdBySlug.get(item.category),
      due_date: item.suggestedDueDate,
      priority: item.priority,
    })),
  );

  revalidatePath("/mon-mariage/taches");
  revalidatePath("/mon-mariage");
}
