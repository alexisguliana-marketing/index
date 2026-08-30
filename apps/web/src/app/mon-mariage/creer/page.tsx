import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { WeddingForm } from "./wedding-form";

export default async function CreerMonMariagePage() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: membership } = await supabase
        .from("wedding_members")
        .select("wedding_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership) {
        redirect("/mon-mariage");
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Nouveau projet</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        Mon mariage
      </h1>
      <p className="mb-10 text-sm text-ink-soft">
        Quelques informations pour démarrer — tout pourra être ajusté plus tard.
      </p>
      <WeddingForm />
    </main>
  );
}
