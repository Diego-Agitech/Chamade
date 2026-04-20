import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { SettingsSectionIntro } from "@/components/settings/SettingsSectionIntro";
import { getMemberSettingsById } from "@/lib/db/settings";

function formatLastLogin(lastLoginAt: string | null): string {
  if (!lastLoginAt) {
    return "Aucune connexion enregistrée";
  }

  const date = new Date(lastLoginAt);
  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function SettingsSessionPage() {
  const session = await auth();
  const memberId = session?.user?.id;
  const member = memberId ? await getMemberSettingsById(memberId) : null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <SettingsSectionIntro title="Session" description="Gère ta session active et déconnecte-toi si besoin." />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p>
          <span className="font-medium">Dernière connexion:</span> {formatLastLogin(member?.lastLoginAt ?? null)}
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="mt-6 max-w-md"
      >
        <Button type="submit" variant="outline" className="h-10 w-full">
          Déconnexion
        </Button>
      </form>
    </section>
  );
}
