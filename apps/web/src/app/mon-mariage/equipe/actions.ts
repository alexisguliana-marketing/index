"use server";

import { revalidatePath } from "next/cache";

import { inviteWeddingMemberSchema, weddingRoleSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

export type InviteMemberFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

async function isOnlyAdmin(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  weddingId: string,
  memberRole: string,
): Promise<boolean> {
  if (memberRole !== "admin") {
    return false;
  }
  const { count } = await supabase
    .from("wedding_members")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", weddingId)
    .eq("role", "admin");
  return (count ?? 0) <= 1;
}

export async function inviteWeddingMemberAction(
  _state: InviteMemberFormState,
  formData: FormData,
): Promise<InviteMemberFormState> {
  const parsed = inviteWeddingMemberSchema.safeParse({
    weddingId: formData.get("weddingId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: "Configuration Supabase manquante." };
  }

  const { data: foundRaw, error: lookupError } = await supabase
    .rpc("find_invitable_user", { target_email: parsed.data.email })
    .maybeSingle();
  const found = foundRaw as { id: string; full_name: string | null } | null;

  if (lookupError || !found) {
    return {
      message:
        "Aucun compte Wedding Univers n'existe avec cet email. La personne doit d'abord créer un compte, puis vous pourrez l'inviter.",
    };
  }

  const { error: insertError } = await supabase.from("wedding_members").insert({
    wedding_id: parsed.data.weddingId,
    user_id: found.id,
    role: parsed.data.role,
    joined_at: new Date().toISOString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { message: "Cette personne fait déjà partie de l'équipe." };
    }
    return { message: "Impossible d'inviter cette personne. Vérifiez que vous avez les droits nécessaires." };
  }

  revalidatePath("/mon-mariage/equipe");
  revalidatePath("/mon-mariage");
}

export async function updateMemberRoleAction(formData: FormData): Promise<void> {
  const memberId = formData.get("memberId");
  const currentRole = formData.get("currentRole");
  const weddingId = formData.get("weddingId");
  const roleParsed = weddingRoleSchema.safeParse(formData.get("role"));

  if (
    typeof memberId !== "string" ||
    typeof currentRole !== "string" ||
    typeof weddingId !== "string" ||
    !roleParsed.success
  ) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  if (roleParsed.data !== "admin" && (await isOnlyAdmin(supabase, weddingId, currentRole))) {
    return;
  }

  await supabase.from("wedding_members").update({ role: roleParsed.data }).eq("id", memberId);

  revalidatePath("/mon-mariage/equipe");
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const memberId = formData.get("memberId");
  const currentRole = formData.get("currentRole");
  const weddingId = formData.get("weddingId");

  if (typeof memberId !== "string" || typeof currentRole !== "string" || typeof weddingId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  if (await isOnlyAdmin(supabase, weddingId, currentRole)) {
    return;
  }

  await supabase.from("wedding_members").delete().eq("id", memberId);

  revalidatePath("/mon-mariage/equipe");
  revalidatePath("/mon-mariage");
}
