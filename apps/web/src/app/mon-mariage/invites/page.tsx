import { redirect } from "next/navigation";

import { hasPermission } from "@wedding-univers/config";
import type { GuestGroup, GuestRsvpStatus, WeddingRole } from "@wedding-univers/types";

import { createClient } from "@/lib/supabase/server";

import { deleteGuestAction, updateGuestRsvpAction } from "./actions";
import { NewGuestForm } from "./new-guest-form";

const GROUP_LABELS: Record<GuestGroup, string> = {
  family: "Famille",
  friends: "Amis",
  colleagues: "Collègues",
  witnesses: "Témoins",
  other: "Autres",
};

const RSVP_LABELS: Record<GuestRsvpStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  declined: "Décliné",
};

const RSVP_CLASSES: Record<GuestRsvpStatus, string> = {
  pending: "bg-ivory-deep text-ink-soft",
  confirmed: "bg-gold/20 text-ink",
  declined: "bg-danger/10 text-danger",
};

interface GuestRow {
  id: string;
  first_name: string;
  last_name: string;
  group: GuestGroup;
  email: string | null;
  phone: string | null;
  rsvp_status: GuestRsvpStatus;
  plus_one: boolean;
  children_count: number;
  needs_accommodation: boolean;
  meal_preference: string | null;
}

function GuestCard({ guest, canManage }: { guest: GuestRow; canManage: boolean }) {
  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {guest.first_name} {guest.last_name}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-ink-soft">
            {GROUP_LABELS[guest.group]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${RSVP_CLASSES[guest.rsvp_status]}`}>
            {RSVP_LABELS[guest.rsvp_status]}
          </span>
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        {[
          guest.email,
          guest.phone,
          guest.plus_one ? "+1 accompagnant" : null,
          guest.children_count > 0 ? `${guest.children_count} enfant(s)` : null,
          guest.needs_accommodation ? "hébergement" : null,
          guest.meal_preference,
        ]
          .filter(Boolean)
          .join(" · ") || "Aucun détail renseigné"}
      </p>

      {canManage && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {guest.rsvp_status === "pending" ? (
            <>
              <form action={updateGuestRsvpAction}>
                <input type="hidden" name="guestId" value={guest.id} />
                <input type="hidden" name="rsvpStatus" value="confirmed" />
                <button type="submit" className="text-xs font-medium text-gold hover:underline">
                  Confirmer
                </button>
              </form>
              <form action={updateGuestRsvpAction}>
                <input type="hidden" name="guestId" value={guest.id} />
                <input type="hidden" name="rsvpStatus" value="declined" />
                <button type="submit" className="text-xs text-danger hover:underline">
                  Décliner
                </button>
              </form>
            </>
          ) : (
            <form action={updateGuestRsvpAction}>
              <input type="hidden" name="guestId" value={guest.id} />
              <input type="hidden" name="rsvpStatus" value="pending" />
              <button type="submit" className="text-xs font-medium text-ink-soft hover:underline">
                Remettre en attente
              </button>
            </form>
          )}
          <form action={deleteGuestAction}>
            <input type="hidden" name="guestId" value={guest.id} />
            <button type="submit" className="text-xs text-danger hover:underline">
              Supprimer
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default async function InvitesPage() {
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
    .select("wedding_id, role")
    .eq("user_id", user.id)
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/mon-mariage/creer");
  }

  const role = membership.role as WeddingRole;
  const canManage = hasPermission(role, "guests.manage");

  const { data: guests } = await supabase
    .from("guests")
    .select(
      "id, first_name, last_name, group, email, phone, rsvp_status, plus_one, children_count, needs_accommodation, meal_preference",
    )
    .eq("wedding_id", membership.wedding_id)
    .order("last_name", { ascending: true });

  const rows = (guests ?? []) as GuestRow[];
  const confirmedCount = rows.filter((guest) => guest.rsvp_status === "confirmed").length;
  const pendingCount = rows.filter((guest) => guest.rsvp_status === "pending").length;
  const declinedCount = rows.filter((guest) => guest.rsvp_status === "declined").length;
  const attendingTotal =
    rows.filter((guest) => guest.rsvp_status !== "declined").length +
    rows.reduce((sum, guest) => sum + (guest.rsvp_status !== "declined" ? guest.children_count : 0), 0) +
    rows.filter((guest) => guest.rsvp_status !== "declined" && guest.plus_one).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">🎉 Invités</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">Liste des invités</h1>
      <p className="mb-10 text-sm text-ink-soft">
        {rows.length > 0
          ? `${rows.length} invités enregistrés · ${confirmedCount} confirmés · ${pendingCount} en attente · ${declinedCount} déclinés · ${attendingTotal} personnes attendues au total (accompagnants et enfants compris)`
          : "Aucun invité pour l'instant."}
      </p>

      {canManage && (
        <div className="mb-8">
          <NewGuestForm weddingId={membership.wedding_id} />
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((guest) => (
          <GuestCard key={guest.id} guest={guest} canManage={canManage} />
        ))}
      </ul>

      {rows.length === 0 && <p className="text-sm text-ink-soft">Aucun invité pour l&apos;instant.</p>}
    </main>
  );
}
