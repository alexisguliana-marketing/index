import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { VendorForm } from "./vendor-form";

export default async function CreerProfilProPage() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: existing } = await supabase
        .from("vendors")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (existing) {
        redirect("/pro/profil");
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Espace professionnel</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        Créer mon profil professionnel
      </h1>
      <p className="mb-10 text-sm text-ink-soft">
        Votre vitrine sera visible des couples une fois publiée — vous gardez la main sur la publication.
      </p>
      <VendorForm />
    </main>
  );
}
