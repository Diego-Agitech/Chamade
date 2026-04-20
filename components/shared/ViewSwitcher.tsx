import Link from "next/link";
import { cn } from "@/lib/utils";

type ViewOption = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

type ViewSwitcherProps = {
  options: ViewOption[];
  activeId: string;
  className?: string;
};

export function ViewSwitcher({ options, activeId, className }: ViewSwitcherProps) {
  return (
    <nav className={cn("inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1", className)}>
      {options.map((option) => {
        const content = (
          <span
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activeId === option.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            {option.label}
          </span>
        );

        if (option.href) {
          return (
            <Link key={option.id} href={option.href}>
              {content}
            </Link>
          );
        }

        return (
          <button key={option.id} type="button" onClick={option.onClick}>
            {content}
          </button>
        );
      })}
    </nav>
  );
}
