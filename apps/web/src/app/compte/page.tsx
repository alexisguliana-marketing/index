import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { signOutAction } from "./actions";
import { ProfileForm } from "./profile-form";

export default async function ComptePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl italic text-ink">
          Configuration requise
        </h1>
        <p className="text-sm text-ink-soft">
          Aucun projet Supabase n&apos;est encore connecté. Voir{" "}
          <code className="rounded bg-ivory-deep px-1.5 py-0.5">apps/web/.env.example</code>.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-24">
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl italic text-ink">
        Mon compte
      </h1>
      <p className="mb-8 text-sm text-ink-soft">{user.email}</p>

      <ProfileForm initialFullName={profile?.full_name ?? ""} />

      <form action={signOutAction} className="mt-10 border-t border-border pt-6">
        <button type="submit" className="text-sm text-ink-soft underline hover:text-danger">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
