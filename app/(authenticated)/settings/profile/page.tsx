import { auth } from "@/auth";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
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

export default async function SettingsProfilePage() {
  const session = await auth();
  const memberId = session?.user?.id;
  const member = memberId ? await getMemberSettingsById(memberId) : null;
  const name = member?.name ?? session?.user?.name ?? "";
  const email = member?.email ?? session?.user?.email ?? "";
  const color = member?.color ?? session?.user?.color ?? "#3b82f6";
  const emoji = member?.emoji ?? null;
  const avatarContent = emoji && emoji.trim().length > 0 ? emoji : name.charAt(0).toUpperCase();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <SettingsSectionIntro
        title="Profil"
        description="Modifie ton email et ton avatar. Les autres champs sont en lecture seule."
      />

      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white text-xl font-semibold text-white"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {avatarContent}
        </div>
        <div className="text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">{name}</p>
          <p className="text-zinc-500">Derniere connexion: {formatLastLogin(member?.lastLoginAt ?? null)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm text-zinc-700">
        <p>
          <span className="font-medium">Nom:</span> {name}
        </p>
        <p>
          <span className="font-medium">Couleur d&apos;accent:</span> {color}
        </p>
        <p>
          <span className="font-medium">Derniere connexion:</span> {formatLastLogin(member?.lastLoginAt ?? null)}
        </p>
      </div>

      <ProfileSettingsForm email={email} emoji={emoji} />
    </section>
  );
}
