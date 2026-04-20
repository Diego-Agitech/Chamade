import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { SettingsSectionIntro } from "@/components/settings/SettingsSectionIntro";

export default function SettingsPasswordPage() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <SettingsSectionIntro title="Sécurité" description="Change ton mot de passe quand tu veux." />
      <div className="mt-6 max-w-md">
        <ChangePasswordForm />
      </div>
    </section>
  );
}
