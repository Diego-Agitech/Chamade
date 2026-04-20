import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-3xl font-semibold text-zinc-900">Mot de passe oublié</h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Saisis ton email, on t&apos;enverra un lien de réinitialisation.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
