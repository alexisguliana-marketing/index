"use client";

import { useActionState } from "react";

import { TASK_CATEGORIES } from "@wedding-univers/config";

import { createBudgetItemAction } from "./actions";

const inputClass =
  "rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold";
const labelClass = "text-xs text-ink-soft";
const fieldClass = "flex flex-col gap-1.5";

export function NewBudgetItemForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState(createBudgetItemAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="weddingId" value={weddingId} />

      <div className={fieldClass}>
        <label htmlFor="label" className={labelClass}>
          Nouveau poste
        </label>
        <input id="label" name="label" type="text" required placeholder="Traiteur" className={inputClass} />
        {state?.errors?.label && <p className="text-sm text-danger">{state.errors.label[0]}</p>}
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
          <label htmlFor="planned" className={labelClass}>
            Prévu (€)
          </label>
          <input id="planned" name="planned" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
        </div>

        <div className={fieldClass}>
          <label htmlFor="spent" className={labelClass}>
            Déjà dépensé (€)
          </label>
          <input id="spent" name="spent" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
        </div>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Ajout…" : "Ajouter le poste"}
      </button>
    </form>
  );
}
