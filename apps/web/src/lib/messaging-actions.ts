"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function sendMessageAction(formData: FormData): Promise<void> {
  const conversationId = formData.get("conversationId");
  const body = formData.get("body");
  const returnPath = formData.get("returnPath");

  if (typeof conversationId !== "string" || typeof body !== "string" || body.trim() === "") {
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

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    body: body.trim(),
  });

  if (typeof returnPath === "string") {
    revalidatePath(returnPath);
  }
}

/**
 * Lets a wedding member who wasn't the one who started a conversation join
 * it themselves — `conversation_members` RLS only allows inserting your own
 * row (§23), so this can't happen automatically on page view; the vendor
 * side never needs this (auto-joined by the `on_conversation_created`
 * trigger, one owner per vendor).
 */
export async function joinConversationAction(formData: FormData): Promise<void> {
  const conversationId = formData.get("conversationId");
  const returnPath = formData.get("returnPath");
  if (typeof conversationId !== "string") {
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

  const { data: conversation } = await supabase
    .from("conversations")
    .select("wedding_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    return;
  }

  const { data: membership } = await supabase
    .from("wedding_members")
    .select("id")
    .eq("wedding_id", conversation.wedding_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return;
  }

  await supabase
    .from("conversation_members")
    .insert({ conversation_id: conversationId, user_id: user.id, participant_type: "couple" })
    .select()
    .maybeSingle();

  if (typeof returnPath === "string") {
    revalidatePath(returnPath);
  }
}
