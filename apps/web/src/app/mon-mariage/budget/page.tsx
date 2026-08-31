import { redirect } from "next/navigation";

import { hasPermission } from "@wedding-univers/config";
import type { WeddingRole } from "@wedding-univers/types";

import { createClient } from "@/lib/supabase/server";

import { deleteBudgetItemAction, updateBudgetItemAction } from "./actions";
import { NewBudgetItemForm } from "./new-budget-item-form";

function formatEuros(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ivory-deep">
      <div
        className={`h-full rounded-full ${percent > 100 ? "bg-danger" : "bg-gold"}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

interface BudgetItemRow {
  id: string;
  label: string;
  planned: number;
  spent: number;
  category: { slug: string; label: string } | null;
}

function BudgetItemCard({ item, canManage }: { item: BudgetItemRow; canManage: boolean }) {
  const remaining = item.planned - item.spent;

  return (
    <li className="rounded-lg border border-border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{item.label}</p>
        {item.category && (
          <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-ink-soft">{item.category.label}</span>
        )}
      </div>

      {canManage ? (
        <form action={updateBudgetItemAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="itemId" value={item.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`planned-${item.id}`} className="text-xs text-ink-soft">
              Prévu (€)
            </label>
            <input
              id={`planned-${item.id}`}
              name="planned"
              type="number"
              min={0}
              step="0.01"
              defaultValue={item.planned}
              className="w-28 rounded-md border border-border px-2 py-1 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`spent-${item.id}`} className="text-xs text-ink-soft">
              Dépensé (€)
            </label>
            <input
              id={`spent-${item.id}`}
              name="spent"
              type="number"
              min={0}
              step="0.01"
              defaultValue={item.spent}
              className="w-28 rounded-md border border-border px-2 py-1 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <button type="submit" className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-ink transition hover:border-gold">
            Enregistrer
          </button>
        </form>
      ) : (
        <p className="text-sm text-ink-soft">
          {formatEuros(item.planned)} prévu · {formatEuros(item.spent)} dépensé
        </p>
      )}

      <p className={`mt-2 text-xs ${remaining < 0 ? "text-danger" : "text-ink-soft"}`}>
        {remaining < 0
          ? `Dépassement de ${formatEuros(Math.abs(remaining))}`
          : `Reste ${formatEuros(remaining)} sur ce poste`}
      </p>

      {canManage && (
        <form action={deleteBudgetItemAction} className="mt-2">
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="text-xs text-danger hover:underline">
            Supprimer
          </button>
        </form>
      )}
    </li>
  );
}

export default async function BudgetPage() {
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
  const canManage = hasPermission(role, "budget.manage");

  const { data: summary } = await supabase
    .from("budget_summary")
    .select("total, spent, committed, remaining, percent_used")
    .eq("wedding_id", membership.wedding_id)
    .maybeSingle();

  const { data: items } = await supabase
    .from("budget_items")
    .select("id, label, planned, spent, category:task_categories(slug, label)")
    .eq("wedding_id", membership.wedding_id)
    .order("label", { ascending: true });

  const rows = (items ?? []) as unknown as BudgetItemRow[];
  const totalPlanned = rows.reduce((sum, item) => sum + item.planned, 0);
  const totalSpent = rows.reduce((sum, item) => sum + item.spent, 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">💰 Budget</p>
      <h1 className="mb-10 font-[family-name:var(--font-display)] text-3xl italic text-ink">Budget du mariage</h1>

      <div className="mb-8 rounded-lg border border-border bg-white p-5">
        {summary?.total ? (
          <>
            <p className="mb-3 text-2xl font-medium text-ink">
              {formatEuros(summary.spent)} <span className="text-base text-ink-soft">/ {formatEuros(summary.total)}</span>
            </p>
            <ProgressBar percent={summary.percent_used ?? 0} />
            <p className="mt-2 text-xs text-ink-soft">
              Reste {formatEuros(summary.remaining)} · {formatEuros(summary.committed)} engagés (postes prévus non
              encore payés)
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            Budget global non défini. Les postes ci-dessous restent gérables indépendamment.
          </p>
        )}
        {rows.length > 0 && (
          <p className="mt-3 text-xs text-ink-soft">
            {rows.length} poste{rows.length > 1 ? "s" : ""} · {formatEuros(totalPlanned)} prévus au total ·{" "}
            {formatEuros(totalSpent)} dépensés au total
          </p>
        )}
      </div>

      {canManage && (
        <div className="mb-8">
          <NewBudgetItemForm weddingId={membership.wedding_id} />
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((item) => (
          <BudgetItemCard key={item.id} item={item} canManage={canManage} />
        ))}
      </ul>

      {rows.length === 0 && <p className="text-sm text-ink-soft">Aucun poste budgétaire pour l&apos;instant.</p>}
    </main>
  );
}
