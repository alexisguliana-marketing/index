import { redirect } from "next/navigation";

import { hasPermission } from "@wedding-univers/config";
import type { TaskPriority, TaskStatus, WeddingRole } from "@wedding-univers/types";

import { createClient } from "@/lib/supabase/server";

import { deleteTaskAction, generateChecklistAction, updateTaskStatusAction } from "./actions";
import { NewTaskForm } from "./new-task-form";

function formatDate(value: string | null): string {
  if (!value) return "Sans échéance";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const PRIORITY_LABELS: Record<TaskPriority, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: "bg-ivory-deep text-ink-soft",
  medium: "bg-gold/20 text-ink",
  high: "bg-danger/10 text-danger",
};

const STATUS_COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "À faire" },
  { status: "in_progress", title: "En cours" },
  { status: "done", title: "Terminé" },
];

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: { slug: string; label: string } | null;
}

function TaskCard({ task, canManage }: { task: TaskRow; canManage: boolean }) {
  const nextStatus: Partial<Record<TaskStatus, { status: TaskStatus; label: string }>> = {
    todo: { status: "in_progress", label: "Démarrer" },
    in_progress: { status: "done", label: "Terminer" },
    done: { status: "todo", label: "Rouvrir" },
  };
  const next = nextStatus[task.status];

  return (
    <li className="rounded-lg border border-border bg-white p-3">
      <p className="text-sm font-medium text-ink">{task.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {task.category && (
          <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-xs text-ink-soft">{task.category.label}</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_CLASSES[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className="text-xs text-ink-soft">{formatDate(task.due_date)}</span>
      </div>

      {canManage && (
        <div className="mt-2 flex items-center gap-3">
          {next && (
            <form action={updateTaskStatusAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="status" value={next.status} />
              <button type="submit" className="text-xs font-medium text-gold hover:underline">
                {next.label}
              </button>
            </form>
          )}
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <button type="submit" className="text-xs text-danger hover:underline">
              Supprimer
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default async function TachesPage() {
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
  const canManage = hasPermission(role, "tasks.manage");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("date")
    .eq("id", membership.wedding_id)
    .maybeSingle();
  const weddingDate = wedding?.date ?? null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status, category:task_categories(slug, label)")
    .eq("wedding_id", membership.wedding_id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const rows = (tasks ?? []) as unknown as TaskRow[];
  const doneCount = rows.filter((task) => task.status === "done").length;
  const progressPercent = rows.length > 0 ? Math.round((doneCount / rows.length) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">
      <p className="mb-2 text-xs tracking-[0.3em] text-ink-soft uppercase">📋 Organisation</p>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl italic text-ink">Tâches &amp; planning</h1>
      <p className="mb-10 text-sm text-ink-soft">
        {rows.length > 0
          ? `${doneCount} sur ${rows.length} tâches terminées (${progressPercent}%)`
          : "Aucune tâche pour l'instant."}
      </p>

      {canManage && (
        <div className="mb-8 flex flex-col gap-4">
          <NewTaskForm weddingId={membership.wedding_id} />

          <form action={generateChecklistAction} className="flex items-center gap-3">
            <input type="hidden" name="weddingId" value={membership.wedding_id} />
            <button
              type="submit"
              disabled={!weddingDate}
              className="rounded-full border border-border px-5 py-2 text-sm font-medium text-ink transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Générer la checklist par défaut
            </button>
            {!weddingDate && (
              <p className="text-xs text-ink-soft">Définissez une date de mariage pour générer la checklist.</p>
            )}
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_COLUMNS.map((column) => (
          <div key={column.status}>
            <h2 className="mb-3 text-sm font-medium text-ink-soft">
              {column.title} ({rows.filter((task) => task.status === column.status).length})
            </h2>
            <ul className="flex flex-col gap-2">
              {rows
                .filter((task) => task.status === column.status)
                .map((task) => (
                  <TaskCard key={task.id} task={task} canManage={canManage} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
