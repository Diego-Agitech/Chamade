"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard#contacts-cles", label: "Contacts clé" },
  { href: "/agenda", label: "Agenda" },
  { href: "/todos", label: "Todos" },
  { href: "/finances", label: "Finances" },
  { href: "/settings/profile", label: "Paramètres" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900",
              active && "bg-zinc-900 text-white hover:text-white"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
