import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export default function MotDePasseOubliePage() {
  return (
    <div>
      <h1 className="mb-2 text-center font-[family-name:var(--font-display)] text-2xl italic text-ink">
        Mot de passe oublié
      </h1>
      <p className="mb-6 text-center text-sm text-ink-soft">
        Indiquez votre email, nous vous enverrons un lien de réinitialisation.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/connexion" className="text-ink underline hover:text-gold">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
