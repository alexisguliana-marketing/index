import Link from "next/link";

import { LoginForm } from "./login-form";

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const redirectParam = params.redirect;
  const redirectTo = typeof redirectParam === "string" ? redirectParam : "/compte";

  return (
    <div>
      <h1 className="mb-6 text-center font-[family-name:var(--font-display)] text-2xl italic text-ink">
        Connexion
      </h1>
      <LoginForm redirectTo={redirectTo} />
      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ink-soft">
        <Link href="/mot-de-passe-oublie" className="hover:text-gold">
          Mot de passe oublié ?
        </Link>
        <p>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-ink underline hover:text-gold">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
