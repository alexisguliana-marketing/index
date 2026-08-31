"use client";

import { useActionState } from "react";

import { signInAction } from "../actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-ink-soft">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold"
        />
        {state?.errors?.email && <p className="text-sm text-danger">{state.errors.email[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-ink-soft">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
