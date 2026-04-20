type SettingsSectionIntroProps = {
  title: string;
  description: string;
};

export function SettingsSectionIntro({ title, description }: SettingsSectionIntroProps) {
  return (
    <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
    </div>
  );
}
