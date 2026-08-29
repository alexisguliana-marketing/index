export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-12">
      <p className="mb-6 text-xs tracking-[0.3em] text-ink-soft uppercase">
        L&apos;écosystème du mariage
      </p>
      <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl italic leading-tight text-ink sm:text-6xl">
        Wedding Univers
      </h1>
      <p className="mt-6 max-w-xl text-base text-ink-soft sm:text-lg">
        La plateforme qui réunit tout l&apos;univers du mariage — votre projet, votre
        budget, vos invités, et les meilleurs prestataires, au même endroit.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <a
          href="#"
          className="rounded-full bg-ink px-8 py-3 text-sm font-medium tracking-wide text-ivory transition hover:bg-ink-soft"
        >
          Créer mon mariage
        </a>
        <a
          href="#"
          className="rounded-full border border-border px-8 py-3 text-sm font-medium tracking-wide text-ink transition hover:border-gold hover:text-gold"
        >
          Découvrir les prestataires
        </a>
      </div>
    </main>
  );
}
