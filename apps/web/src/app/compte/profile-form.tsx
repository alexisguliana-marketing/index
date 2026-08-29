"use client";

import { useActionState } from "react";

import { updateProfileAction } from "./actions";

export function ProfileForm({ initialFullName }: { initialFullName: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm text-ink-soft">
          Prénom(s)
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={initialFullName}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
        {state?.errors?.fullName && <p className="text-sm text-danger">{state.errors.fullName[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-ink-soft">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
