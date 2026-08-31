import { redirect } from "next/navigation";

import { hasPermission, WEDDING_ROLES } from "@wedding-univers/config";
import type { WeddingRole } from "@wedding-univers/types";

import { createClient } from "@/lib/supabase/server";

import { InviteForm } from "./invite-form";
import { removeMemberAction, updateMemberRoleAction } from "./actions";

function roleLabel(role: WeddingRole): string {
  return WEDDING_ROLES.find((option) => option.slug === role)?.label ?? role;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

interface MemberRow {
  id: string;
  user_id: string;
  role: WeddingRole;
  joined_at: string | null;
  fullName: string | null;
}

function MemberCard({
  member,
  weddingId,
  currentUserId,
  isOnlyAdmin,
  canManage,
  canRemove,
}: {
  member: MemberRow;
  weddingId: string;
  currentUserId: string;
  isOnlyAdmin: boolean;
  canManage: boolean;
  canRemove: boolean;
}) {
  const isSelf = member.user_id === currentUserId;
  const removalLocked = member.role === "admin" && isOnlyAdmin;
  const canRemoveThisRow = (canRemove || isSelf) && !removalLocked;

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {member.fullName ?? "Utilisateur"} {isSelf && <span className="text-xs text-ink-soft">(vous)</span>}
        </p>
        <span className="text-xs text-ink-soft">Membre depuis le {formatDate(member.joined_at)}</span>
      </div>

      {canManage ? (
        <form action={updateMemberRoleAction} className="flex items-center gap-2">
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="currentRole" value={member.role} />
          <input type="hidden" name="weddingId" value={weddingId} />
          <select
            name="role"
            defaultValue={member.role}
            disabled={removalLocked}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs text-ink outline-none focus:border-gold disabled:opacity-50"
          >
            {WEDDING_ROLES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="text-xs font-medium text-gold hover:underline">
            Enregistrer
          </button>
        </form>
      ) : (
        <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-ink-soft">{roleLabel(member.role)}</span>
      )}

      {canRemoveThisRow && (
        <form action={removeMemberAction} className="mt-2">
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="currentRole" value={member.role} />
          <input type="hidden" name="weddingId" value={weddingId} />
          <button type="submit" className="text-xs text-danger hover:underline">
            {isSelf ? "Quitter ce mariage" : "Retirer de l'équipe"}
          </button>
        </form>
      )}
      {removalLocked && (
        <p className="mt-2 text-xs text-ink-soft">
          Seul(e) administrateur(trice) restant(e) — impossible de changer son rôle ou de le/la retirer.
        </p>
      )}
    </li>
  );
}

export default async function EquipePage() {
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
  const canManage = hasPermission(role, "members.invite");
  const canRemove = hasPermission(role, "members.remove");

  const { data: members } = await supabase
    .from("wedding_members")
    .select("id, user_id, role, joined_at")
    .eq("wedding_id", membership.wedding_id)
    .order("joined_at", { ascending: true });

  const memberRows = members ?? [];
  const userIds = memberRows.map((member) => member.user_id);

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const rows: MemberRow[] = memberRows.map((member) => ({
    id: member.id,
    user_id: member.user_id,
    role: member.role as WeddingRole,
    joined_at: member.joined_at,
    fullName: nameById.get(member.user_id) ?? null,
  }));

  const adminCount = rows.filter((member) => member.role === "admin").length;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">🤝 Équipe</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        Collaborateurs du mariage
      </h1>
      <p className="mb-10 text-sm text-ink-soft">
        {rows.length} membre{rows.length > 1 ? "s" : ""} — chaque rôle donne des droits différents (tâches, budget,
        invités).
      </p>

      {canManage && (
        <div className="mb-8">
          <InviteForm weddingId={membership.wedding_id} />
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            weddingId={membership.wedding_id}
            currentUserId={user.id}
            isOnlyAdmin={member.role === "admin" && adminCount <= 1}
            canManage={canManage}
            canRemove={canRemove}
          />
        ))}
      </ul>
    </main>
  );
}
