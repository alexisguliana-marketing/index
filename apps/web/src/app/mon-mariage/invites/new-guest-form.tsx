"use client";

import { useActionState } from "react";

import { GUEST_GROUPS } from "@wedding-univers/config";

import { createGuestAction } from "./actions";

const inputClass =
  "rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold";
const labelClass = "text-xs text-ink-soft";
const fieldClass = "flex flex-col gap-1.5";

export function NewGuestForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState(createGuestAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="weddingId" value={weddingId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="firstName" className={labelClass}>
            Prénom
          </label>
          <input id="firstName" name="firstName" type="text" required className={inputClass} />
          {state?.errors?.firstName && <p className="text-sm text-danger">{state.errors.firstName[0]}</p>}
        </div>
        <div className={fieldClass}>
          <label htmlFor="lastName" className={labelClass}>
            Nom
          </label>
          <input id="lastName" name="lastName" type="text" required className={inputClass} />
          {state?.errors?.lastName && <p className="text-sm text-danger">{state.errors.lastName[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={fieldClass}>
          <label htmlFor="group" className={labelClass}>
            Groupe
          </label>
          <select id="group" name="group" defaultValue="friends" className={inputClass}>
            {GUEST_GROUPS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
          {state?.errors?.email && <p className="text-sm text-danger">{state.errors.email[0]}</p>}
        </div>
        <div className={fieldClass}>
          <label htmlFor="phone" className={labelClass}>
            Téléphone
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={fieldClass}>
          <label htmlFor="childrenCount" className={labelClass}>
            Enfants
          </label>
          <input id="childrenCount" name="childrenCount" type="number" min={0} defaultValue={0} className={inputClass} />
        </div>
        <div className={fieldClass}>
          <label htmlFor="mealPreference" className={labelClass}>
            Préférence repas
          </label>
          <input id="mealPreference" name="mealPreference" type="text" placeholder="Végétarien" className={inputClass} />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="plusOne" className="h-4 w-4" />
            Accompagnant
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="needsAccommodation" className="h-4 w-4" />
            Hébergement
          </label>
        </div>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Ajout…" : "Ajouter l'invité"}
      </button>
    </form>
  );
}
