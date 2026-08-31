import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  task_created: "Nouvelle tâche",
  task_overdue: "Tâche en retard",
  invitation_received: "Invitation reçue",
  member_joined: "Nouveau membre de l'équipe",
  new_message: "Nouveau message",
  vendor_reply: "Réponse d'un prestataire",
  new_favorite: "Nouveau favori",
  recommendation: "Nouvelle recommandation",
  project_activity: "Activité du projet",
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function notificationLink(type: string, payload: Record<string, unknown>): string | null {
  if (type === "new_message" && typeof payload.conversationId === "string") {
    return `/mon-mariage/messages/${payload.conversationId}`;
  }
  if (type === "member_joined") {
    return "/mon-mariage/equipe";
  }
  return null;
}

export default async function NotificationsPage() {
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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = notifications ?? [];
  const unreadCount = rows.filter((row) => !row.read_at).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">🔔 Notifications</p>
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl italic text-ink">Notifications</h1>
        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="text-xs font-medium text-gold hover:underline">
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">Aucune notification pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((notification) => {
            const label = TYPE_LABELS[notification.type] ?? notification.type;
            const href = notificationLink(notification.type, notification.payload as Record<string, unknown>);
            const isUnread = !notification.read_at;
            return (
              <li
                key={notification.id}
                className={`flex items-center justify-between gap-3 rounded-lg border border-border p-4 ${
                  isUnread ? "bg-gold/10" : "bg-white"
                }`}
              >
                <div>
                  {href ? (
                    <Link href={href} className="text-sm font-medium text-ink hover:text-gold">
                      {label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-ink">{label}</span>
                  )}
                  <p className="mt-0.5 text-xs text-ink-soft">{formatDateTime(notification.created_at)}</p>
                </div>
                {isUnread && (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button type="submit" className="text-xs text-ink-soft hover:text-gold">
                      Marquer comme lu
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
