import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface ConversationRow {
  id: string;
  vendorId: string;
  vendorName: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

export default async function MessagesPage() {
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

  const { data: membership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/mon-mariage/creer");
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, vendor_id, created_at")
    .eq("wedding_id", membership.wedding_id)
    .order("created_at", { ascending: false });

  const conversationRows = conversations ?? [];
  const vendorIds = conversationRows.map((row) => row.vendor_id as string);
  const conversationIds = conversationRows.map((row) => row.id as string);

  const [{ data: vendors }, { data: messages }] = await Promise.all([
    vendorIds.length
      ? supabase.from("vendors").select("id, name").in("id", vendorIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    conversationIds.length
      ? supabase
          .from("messages")
          .select("conversation_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { conversation_id: string; body: string; created_at: string }[] }),
  ]);

  const vendorNameById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.name]));
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
      vendorId: row.vendor_id as string,
      vendorName: vendorNameById.get(row.vendor_id as string) ?? "Prestataire",
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.created_at ?? row.created_at,
    };
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">💬 Messages</p>
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-3xl italic text-ink">Conversations</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Aucune conversation pour l&apos;instant.{" "}
          <Link href="/prestataires" className="text-gold hover:underline">
            Contacter un prestataire →
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/mon-mariage/messages/${row.id}`}
                className="block rounded-lg border border-border bg-white p-4 transition hover:border-gold"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{row.vendorName}</span>
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
