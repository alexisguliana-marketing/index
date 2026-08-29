import Link from "next/link";

import { SignupForm } from "./signup-form";

export default function InscriptionPage() {
  return (
    <div>
      <h1 className="mb-6 text-center font-[family-name:var(--font-display)] text-2xl italic text-ink">
        Créer un compte
      </h1>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-soft">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-ink underline hover:text-gold">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
