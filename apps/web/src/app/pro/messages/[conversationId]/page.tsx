import { notFound } from "next/navigation";

import { sendMessageAction } from "@/lib/messaging-actions";
import { createClient } from "@/lib/supabase/server";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ProConversationPage({
  params,
}: PageProps<"/pro/messages/[conversationId]">) {
  const { conversationId } = await params;

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
    notFound();
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, wedding_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    notFound();
  }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("partner1_first_name, partner2_first_name")
    .eq("id", conversation.wedding_id)
    .maybeSingle();

  const returnPath = `/pro/messages/${conversationId}`;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_user_id, body, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const unreadFromOthers = (messages ?? []).filter((message) => message.sender_user_id !== user.id && !message.read_at);
  if (unreadFromOthers.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_user_id", user.id)
      .is("read_at", null);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">💬 Conversation</p>
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        {wedding ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}` : "Mariage"}
      </h1>

      <div className="mb-6 flex flex-col gap-3">
        {(messages ?? []).map((message) => {
          const isMine = message.sender_user_id === user.id;
          return (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                isMine ? "self-end bg-ink text-ivory" : "self-start bg-ivory-deep text-ink"
              }`}
            >
              <p>{message.body}</p>
              <p className={`mt-1 text-xs ${isMine ? "text-ivory/70" : "text-ink-soft"}`}>
                {formatDateTime(message.created_at)}
              </p>
            </div>
          );
        })}
        {(messages ?? []).length === 0 && <p className="text-sm text-ink-soft">Aucun message pour l&apos;instant.</p>}
      </div>

      <form action={sendMessageAction} className="flex flex-col gap-2">
        <input type="hidden" name="conversationId" value={conversationId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Votre message..."
          className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="self-start rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft"
        >
          Envoyer
        </button>
      </form>
    </main>
  );
}
