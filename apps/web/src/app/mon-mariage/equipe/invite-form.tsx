"use client";

import { useActionState } from "react";

import { WEDDING_ROLES } from "@wedding-univers/config";

import { inviteWeddingMemberAction } from "./actions";

const inputClass =
  "rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold";
const labelClass = "text-xs text-ink-soft";
const fieldClass = "flex flex-col gap-1.5";

export function InviteForm({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState(inviteWeddingMemberAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="weddingId" value={weddingId} />
      <p className="text-xs text-ink-soft">
        Invitez un membre déjà inscrit sur Wedding Univers par email.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className={fieldClass}>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
          {state?.errors?.email && <p className="text-sm text-danger">{state.errors.email[0]}</p>}
        </div>

        <div className={fieldClass}>
          <label htmlFor="role" className={labelClass}>
            Rôle
          </label>
          <select id="role" name="role" defaultValue="member" className={inputClass}>
            {WEDDING_ROLES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-6 py-2 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Invitation…" : "Inviter"}
        </button>
      </div>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
