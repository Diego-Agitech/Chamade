import { LoginForm } from "@/components/auth/LoginForm";
import { getLoginProfiles } from "@/lib/db/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const params = await searchParams;
  const showResetSuccess = params.reset === "success";
  const profiles = await getLoginProfiles();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f7f3eb,_#efe6d6_40%,_#e8dcc7)] p-6">
      <div className="w-full max-w-md rounded-xl border border-white/70 bg-white/90 p-8 shadow-lg backdrop-blur">
        <p className="text-center text-sm uppercase tracking-[0.22em] text-zinc-500">Propriété familiale</p>
        <h1 className="mt-2 text-center text-4xl font-semibold tracking-tight text-zinc-900">chamade</h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Connecte-toi pour accéder à l&apos;agenda, aux tâches et aux finances.
        </p>
        {showResetSuccess ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            Mot de passe mis à jour. Tu peux maintenant te connecter.
          </p>
        ) : null}
        <div className="mt-8">
          <LoginForm profiles={profiles} />
        </div>
      </div>
    </main>
  );
}
