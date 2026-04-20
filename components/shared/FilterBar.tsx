import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <section className={cn("rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}
