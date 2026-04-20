import { cn } from "@/lib/utils";

type KpiItem = {
  title: string;
  value: string;
  subtitle?: string;
  href?: string;
};

type KpiGridProps = {
  items: KpiItem[];
  className?: string;
};

export function KpiGrid({ items, className }: KpiGridProps) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((item) => (
        <article key={item.title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{item.title}</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{item.value}</p>
          {item.subtitle ? <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p> : null}
        </article>
      ))}
    </div>
  );
}
