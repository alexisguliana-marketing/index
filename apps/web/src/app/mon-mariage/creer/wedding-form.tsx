"use client";

import { useActionState } from "react";

import { BUDGET_TIERS, CEREMONY_TYPES, WEDDING_STYLES } from "@wedding-univers/config";

import { createWeddingAction } from "./actions";

const inputClass =
  "rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold";
const labelClass = "text-sm text-ink-soft";
const fieldClass = "flex flex-col gap-1.5";

export function WeddingForm() {
  const [state, action, pending] = useActionState(createWeddingAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="partner1FirstName" className={labelClass}>
            Votre prénom
          </label>
          <input id="partner1FirstName" name="partner1FirstName" type="text" required className={inputClass} />
          {state?.errors?.partner1FirstName && (
            <p className="text-sm text-danger">{state.errors.partner1FirstName[0]}</p>
          )}
        </div>

        <div className={fieldClass}>
          <label htmlFor="partner2FirstName" className={labelClass}>
            Prénom de votre partenaire
          </label>
          <input id="partner2FirstName" name="partner2FirstName" type="text" required className={inputClass} />
          {state?.errors?.partner2FirstName && (
            <p className="text-sm text-danger">{state.errors.partner2FirstName[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="date" className={labelClass}>
            Date du mariage
          </label>
          <input id="date" name="date" type="date" className={inputClass} />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="isDateFlexible" className="h-4 w-4" />
          Notre date est flexible
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="location" className={labelClass}>
            Région ou ville
          </label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Caen / Normandie"
            className={inputClass}
          />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="isVenueKnown" className="h-4 w-4" />
          Nous avons déjà notre lieu de réception
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="guestCountEstimate" className={labelClass}>
            Nombre d&apos;invités (estimation)
          </label>
          <input
            id="guestCountEstimate"
            name="guestCountEstimate"
            type="number"
            min={0}
            className={inputClass}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="budgetTotal" className={labelClass}>
            Budget global (€)
          </label>
          <input id="budgetTotal" name="budgetTotal" type="number" min={0} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="style" className={labelClass}>
            Style
          </label>
          <select id="style" name="style" defaultValue="" className={inputClass}>
            <option value="">Non défini</option>
            {WEDDING_STYLES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="ceremonyType" className={labelClass}>
            Type de cérémonie
          </label>
          <select id="ceremonyType" name="ceremonyType" defaultValue="" className={inputClass}>
            <option value="">Non défini</option>
            {CEREMONY_TYPES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="ambiance" className={labelClass}>
            Ambiance souhaitée
          </label>
          <input
            id="ambiance"
            name="ambiance"
            type="text"
            placeholder="Chaleureuse et festive"
            className={inputClass}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="budgetTier" className={labelClass}>
            Niveau de gamme
          </label>
          <select id="budgetTier" name="budgetTier" defaultValue="" className={inputClass}>
            <option value="">Non défini</option>
            {BUDGET_TIERS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer mon mariage"}
      </button>
    </form>
  );
}
