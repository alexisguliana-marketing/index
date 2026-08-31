"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

async function getCoupleWeddingId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
): Promise<string | null> {
  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", userId)
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return membership?.wedding_id ?? null;
}

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const isFavorited = formData.get("isFavorited") === "true";
  if (typeof vendorId !== "string") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const weddingId = await getCoupleWeddingId(supabase, user.id);
  if (!weddingId) {
    return;
  }

  if (isFavorited) {
    await supabase.from("favorites").delete().eq("wedding_id", weddingId).eq("vendor_id", vendorId);
  } else {
    await supabase.from("favorites").insert({ wedding_id: weddingId, vendor_id: vendorId });
  }

  revalidatePath(`/prestataires/${vendorId}`);
  revalidatePath("/mon-mariage/favoris");
}

export async function contactVendorAction(formData: FormData): Promise<void> {
  const vendorId = formData.get("vendorId");
  const body = formData.get("message");
  if (typeof vendorId !== "string" || typeof body !== "string" || body.trim() === "") {
    return;
  }

  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/connexion");
  }

  const weddingId = await getCoupleWeddingId(supabase, user.id);
  if (!weddingId) {
    return;
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ wedding_id: weddingId, vendor_id: vendorId })
      .select("id")
      .single();
    if (error || !created) {
      return;
    }
    conversationId = created.id;
  }

  await supabase
    .from("conversation_members")
    .insert({ conversation_id: conversationId, user_id: user.id, participant_type: "couple" })
    .select()
    .maybeSingle();

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    body: body.trim(),
  });

  redirect(`/mon-mariage/messages/${conversationId}`);
}
