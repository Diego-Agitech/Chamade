import Link from "next/link";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getValidPasswordResetToken } from "@/lib/db/auth";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) {
    notFound();
  }

  const validToken = await getValidPasswordResetToken(token);
  const isTokenValid = Boolean(validToken);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-3xl font-semibold text-zinc-900">Réinitialiser le mot de passe</h1>
        {!isTokenValid ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Ce lien est invalide ou expiré.
            </p>
            <Link href="/forgot-password" className="text-sm text-zinc-700 underline underline-offset-2">
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <ResetPasswordForm token={token} />
          </div>
        )}
      </div>
    </main>
  );
}
