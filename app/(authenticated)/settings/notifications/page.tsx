import { NotificationSettingsForm } from "@/components/settings/NotificationSettingsForm";
import { SettingsSectionIntro } from "@/components/settings/SettingsSectionIntro";
import { getNotificationSettings } from "@/lib/db/settings";

export default async function SettingsNotificationsPage() {
  const settings = await getNotificationSettings();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <SettingsSectionIntro
        title="Notifications"
        description="Choisis les événements qui déclenchent un email puis valide la chaîne d'envoi avec un test."
      />
      <div className="mt-6">
        <NotificationSettingsForm initialSettings={settings} />
      </div>
    </section>
  );
}
