import { ResetPasswordForm } from "./reset-password-form";

export default function ReinitialiserMotDePassePage() {
  return (
    <div>
      <h1 className="mb-6 text-center font-[family-name:var(--font-display)] text-2xl italic text-ink">
        Nouveau mot de passe
      </h1>
      <ResetPasswordForm />
    </div>
  );
}
