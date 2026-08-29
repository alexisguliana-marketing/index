import Link from "next/link";

export default function VerifiezVotreEmailPage() {
  return (
    <div className="text-center">
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl italic text-ink">
        Vérifiez votre boîte mail
      </h1>
      <p className="text-sm text-ink-soft">
        Un email de confirmation vous a été envoyé. Cliquez sur le lien qu&apos;il contient pour
        activer votre compte.
      </p>
      <Link href="/connexion" className="mt-6 inline-block text-sm text-ink underline hover:text-gold">
        Retour à la connexion
      </Link>
    </div>
  );
}
