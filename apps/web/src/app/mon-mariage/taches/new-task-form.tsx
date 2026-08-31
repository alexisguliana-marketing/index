"use client";

import { useActionState } from "react";

import { TASK_CATEGORIES } from "@wedding-univers/config";

import { createTaskAction } from "./actions";

const inputClass =
  "rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold";
const labelClass = "text-xs text-ink-soft";
const fieldClass = "flex flex-col gap-1.5";

export function NewTaskForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState(createTaskAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="weddingId" value={weddingId} />

      <div className={fieldClass}>
        <label htmlFor="title" className={labelClass}>
          Nouvelle tâche
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Réserver le lieu de réception"
          className={inputClass}
        />
        {state?.errors?.title && <p className="text-sm text-danger">{state.errors.title[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={fieldClass}>
          <label htmlFor="category" className={labelClass}>
            Catégorie
          </label>
          <select id="category" name="category" defaultValue="other" className={inputClass}>
            {TASK_CATEGORIES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="dueDate" className={labelClass}>
            Échéance
          </label>
          <input id="dueDate" name="dueDate" type="date" className={inputClass} />
        </div>

        <div className={fieldClass}>
          <label htmlFor="priority" className={labelClass}>
            Priorité
          </label>
          <select id="priority" name="priority" defaultValue="medium" className={inputClass}>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </div>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Ajout…" : "Ajouter la tâche"}
      </button>
    </form>
  );
}
