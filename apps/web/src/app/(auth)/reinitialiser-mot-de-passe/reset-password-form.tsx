"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "../actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-ink-soft">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
        {state?.errors?.password && <p className="text-sm text-danger">{state.errors.password[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}
