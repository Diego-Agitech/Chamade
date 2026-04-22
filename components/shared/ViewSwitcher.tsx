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
    <nav
      className={cn(
        "flex w-full min-w-0 items-center gap-2 overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200 bg-white p-1 whitespace-nowrap",
        className
      )}
    >
      {options.map((option) => {
        const content = (
          <span
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activeId === option.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            {option.label}
          </span>
        );

        if (option.href) {
          return (
            <Link key={option.id} href={option.href} className="shrink-0">
              {content}
            </Link>
          );
        }

        return (
          <button key={option.id} type="button" onClick={option.onClick} className="shrink-0">
            {content}
          </button>
        );
      })}
    </nav>
  );
}
