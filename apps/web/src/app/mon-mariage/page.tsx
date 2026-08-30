import { redirect } from "next/navigation";

import { BUDGET_TIERS, CEREMONY_TYPES, WEDDING_STYLES } from "@wedding-univers/config";

import { createClient } from "@/lib/supabase/server";

function findLabel(options: { slug: string; label: string }[], slug: string | null): string | null {
  if (!slug) return null;
  return options.find((option) => option.slug === slug)?.label ?? null;
}

function formatDate(value: string | null): string {
  if (!value) return "Date non définie";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatEuros(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

interface WeddingRow {
  partner1_first_name: string;
  partner2_first_name: string;
  date: string | null;
  is_date_flexible: boolean;
  location: string | null;
  is_venue_known: boolean;
  guest_count_estimate: number | null;
  budget_total: number | null;
  style: string | null;
  ambiance: string | null;
  ceremony_type: string | null;
  budget_tier: string | null;
  created_at: string;
}

function computeProfileCompleteness(wedding: WeddingRow): { filled: number; total: number; percent: number } {
  const fields = [
    wedding.date,
    wedding.location,
    wedding.guest_count_estimate,
    wedding.budget_total,
    wedding.style,
    wedding.ambiance,
    wedding.ceremony_type,
    wedding.budget_tier,
  ];
  const filled = fields.filter((value) => value !== null && value !== "").length;
  return { filled, total: fields.length, percent: Math.round((filled / fields.length) * 100) };
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ivory-deep">
      <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h2 className="mb-4 text-sm font-medium text-ink-soft">{title}</h2>
      {children}
    </div>
  );
}

export default async function MonMariagePage() {
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
    .select("wedding_id, weddings(*)")
    .eq("user_id", user.id)
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const wedding = membership?.weddings as WeddingRow | undefined;

  if (!wedding || !membership) {
    redirect("/mon-mariage/creer");
  }

  const { data: budget } = await supabase
    .from("budget_summary")
    .select("total, spent, remaining, percent_used")
    .eq("wedding_id", membership.wedding_id)
    .maybeSingle();

  const { data: upcomingTasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, status")
    .eq("wedding_id", membership.wedding_id)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(4);

  const completeness = computeProfileCompleteness(wedding);

  const details: { label: string; value: string }[] = [
    {
      label: "Invités",
      value: wedding.guest_count_estimate !== null ? `${wedding.guest_count_estimate} personnes` : "Non défini",
    },
    { label: "Style", value: findLabel(WEDDING_STYLES, wedding.style) ?? "Non défini" },
    { label: "Ambiance", value: wedding.ambiance ?? "Non définie" },
    { label: "Cérémonie", value: findLabel(CEREMONY_TYPES, wedding.ceremony_type) ?? "Non définie" },
    { label: "Niveau de gamme", value: findLabel(BUDGET_TIERS, wedding.budget_tier) ?? "Non défini" },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">💍 Mon mariage</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">
        {wedding.partner1_first_name} &amp; {wedding.partner2_first_name}
      </h1>
      <p className="mb-10 text-sm text-ink-soft">
        📅 {formatDate(wedding.date)}
        {wedding.is_date_flexible ? " (flexible)" : ""}
        {" · "}📍 {wedding.location ?? "Lieu non défini"}
        {wedding.is_venue_known ? " (réservé)" : ""}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="Complétude du profil">
          <p className="mb-3 text-2xl font-medium text-ink">{completeness.percent}%</p>
          <ProgressBar percent={completeness.percent} />
          <p className="mt-2 text-xs text-ink-soft">
            {completeness.filled} sur {completeness.total} informations renseignées
          </p>
        </Card>

        <Card title="Budget">
          {budget?.total ? (
            <>
              <p className="mb-3 text-2xl font-medium text-ink">
                {formatEuros(budget.spent)} <span className="text-base text-ink-soft">/ {formatEuros(budget.total)}</span>
              </p>
              <ProgressBar percent={Math.min(100, budget.percent_used ?? 0)} />
              <p className="mt-2 text-xs text-ink-soft">Reste {formatEuros(budget.remaining)}</p>
            </>
          ) : (
            <p className="text-sm text-ink-soft">Budget global non défini.</p>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Détails du mariage">
          <dl className="divide-y divide-border">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <dt className="text-sm text-ink-soft">{detail.label}</dt>
                <dd className="text-sm font-medium text-ink">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="Prochaines tâches">
          {upcomingTasks && upcomingTasks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{task.title}</span>
                  <span className="text-xs text-ink-soft">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                      : "Sans échéance"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Aucune tâche en attente.</p>
          )}
          <a href="/mon-mariage/taches" className="mt-3 inline-block text-xs font-medium text-gold hover:underline">
            Voir toutes les tâches →
          </a>
        </Card>

        <Card title="Recommandations">
          <p className="text-sm text-ink-soft">
            La découverte de prestataires arrive bientôt.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Activité">
          <ul className="text-sm text-ink-soft">
            <li>Mariage créé le {formatDate(wedding.created_at)}</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
