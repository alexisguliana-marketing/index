"use server";

import { redirect } from "next/navigation";

import { updateProfileSchema } from "@wedding-univers/validation";

import { createClient } from "@/lib/supabase/server";

import type { AuthFormState } from "../(auth)/actions";

export async function updateProfileAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = updateProfileSchema.safeParse({ fullName: formData.get("fullName") });
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

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) {
    return { message: "Impossible de mettre à jour le profil. Réessayez." };
  }

  return { message: "Profil mis à jour." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}
