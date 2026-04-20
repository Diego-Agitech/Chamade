"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/settings/profile", label: "Profil" },
  { href: "/settings/session", label: "Session" },
  { href: "/settings/password", label: "Sécurité" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/categories", label: "Catégories" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Paramètres</h1>
        <p className="mt-1 text-sm text-zinc-600">Profil, sécurité, notifications et catégories dans un même espace cohérent.</p>
      </section>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === tab.href ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
