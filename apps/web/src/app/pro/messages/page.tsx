import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface ConversationRow {
  id: string;
  weddingLabel: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

export default async function ProMessagesPage() {
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

  const { data: vendor } = await supabase.from("vendors").select("id").eq("owner_user_id", user.id).maybeSingle();

  if (!vendor) {
    redirect("/pro/profil/creer");
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, wedding_id, created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const conversationRows = conversations ?? [];
  const weddingIds = conversationRows.map((row) => row.wedding_id as string);
  const conversationIds = conversationRows.map((row) => row.id as string);

  const [{ data: weddings }, { data: messages }] = await Promise.all([
    weddingIds.length
      ? supabase.from("weddings").select("id, partner1_first_name, partner2_first_name").in("id", weddingIds)
      : Promise.resolve({ data: [] as { id: string; partner1_first_name: string; partner2_first_name: string }[] }),
    conversationIds.length
      ? supabase
          .from("messages")
          .select("conversation_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { conversation_id: string; body: string; created_at: string }[] }),
  ]);

  const weddingLabelById = new Map(
    (weddings ?? []).map((wedding) => [wedding.id, `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`]),
  );
  const lastMessageByConversation = new Map<string, { body: string; created_at: string }>();
  for (const message of messages ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message);
    }
  }

  const rows: ConversationRow[] = conversationRows.map((row) => {
    const last = lastMessageByConversation.get(row.id);
    return {
      id: row.id,
      weddingLabel: weddingLabelById.get(row.wedding_id as string) ?? "Mariage",
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.created_at ?? row.created_at,
    };
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">Espace professionnel</p>
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-3xl italic text-ink">Conversations</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucune conversation pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/pro/messages/${row.id}`}
                className="block rounded-lg border border-border bg-white p-4 transition hover:border-gold"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{row.weddingLabel}</span>
                  <span className="text-xs text-ink-soft">{formatDateTime(row.lastMessageAt)}</span>
                </div>
                <p className="truncate text-sm text-ink-soft">{row.lastMessage ?? "Aucun message pour l'instant."}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
