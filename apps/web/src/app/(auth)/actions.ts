"use server";

import { redirect } from "next/navigation";

import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@wedding-univers/validation";

import { getSiteUrl } from "@/lib/supabase/env";
import { safeRedirectTarget } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Configuration Supabase manquante. Voir apps/web/.env.example pour connecter un projet.";

export async function signUpAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: SUPABASE_NOT_CONFIGURED_MESSAGE };
  }

  const { fullName, email, password } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/mon-mariage/creer`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { message: "Un compte existe déjà avec cette adresse email." };
    }
    return { message: "Impossible de créer le compte. Réessayez dans un instant." };
  }

  if (data.session) {
    redirect("/mon-mariage/creer");
  }

  redirect("/verifiez-votre-email");
}

export async function signInAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: SUPABASE_NOT_CONFIGURED_MESSAGE };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { message: "Email ou mot de passe incorrect." };
  }

  redirect(safeRedirectTarget(formData.get("redirect")));
}

export async function requestPasswordResetAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: SUPABASE_NOT_CONFIGURED_MESSAGE };
  }

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });

  // Same message whether or not the address has an account, to avoid
  // leaking which emails are registered.
  return {
    message: "Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.",
  };
}

export async function resetPasswordAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { message: SUPABASE_NOT_CONFIGURED_MESSAGE };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { message: "Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré." };
  }

  redirect("/compte");
}
