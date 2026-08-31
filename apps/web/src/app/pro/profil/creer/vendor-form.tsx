"use client";

import { useActionState } from "react";

import { VENDOR_PROFESSIONS } from "@wedding-univers/config";

import { createVendorAction } from "./actions";

const inputClass =
  "rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold";
const labelClass = "text-sm text-ink-soft";
const fieldClass = "flex flex-col gap-1.5";

export function VendorForm() {
  const [state, action, pending] = useActionState(createVendorAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className={fieldClass}>
        <label htmlFor="name" className={labelClass}>
          Nom de votre activité
        </label>
        <input id="name" name="name" type="text" required placeholder="Atelier Fleur & Co" className={inputClass} />
        {state?.errors?.name && <p className="text-sm text-danger">{state.errors.name[0]}</p>}
      </div>

      <div className={fieldClass}>
        <label htmlFor="tagline" className={labelClass}>
          Phrase d&apos;accroche
        </label>
        <input
          id="tagline"
          name="tagline"
          type="text"
          placeholder="Fleuriste artisanale en Normandie"
          className={inputClass}
        />
      </div>

      <div className={fieldClass}>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" name="description" rows={4} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="city" className={labelClass}>
            Ville
          </label>
          <input id="city" name="city" type="text" className={inputClass} />
        </div>
        <div className={fieldClass}>
          <label htmlFor="travelRadiusKm" className={labelClass}>
            Zone de déplacement (km)
          </label>
          <input id="travelRadiusKm" name="travelRadiusKm" type="number" min={0} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={fieldClass}>
          <label htmlFor="experienceYears" className={labelClass}>
            Années d&apos;expérience
          </label>
          <input id="experienceYears" name="experienceYears" type="number" min={0} className={inputClass} />
        </div>
        <div className={fieldClass}>
          <label htmlFor="capacityMin" className={labelClass}>
            Capacité min (invités)
          </label>
          <input id="capacityMin" name="capacityMin" type="number" min={0} className={inputClass} />
        </div>
        <div className={fieldClass}>
          <label htmlFor="capacityMax" className={labelClass}>
            Capacité max (invités)
          </label>
          <input id="capacityMax" name="capacityMax" type="number" min={0} className={inputClass} />
        </div>
      </div>

      <div className={fieldClass}>
        <span className={labelClass}>Métiers</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VENDOR_PROFESSIONS.map((option) => (
            <label key={option.slug} className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="categorySlugs" value={option.slug} className="h-4 w-4" />
              {option.label}
            </label>
          ))}
        </div>
        {state?.errors?.categorySlugs && <p className="text-sm text-danger">{state.errors.categorySlugs[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-full bg-ink px-8 py-3 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer mon profil"}
      </button>
    </form>
  );
}
