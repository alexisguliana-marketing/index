import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <Link
        href="/"
        className="mb-10 font-[family-name:var(--font-display)] text-2xl italic text-ink"
      >
        Wedding Univers
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
