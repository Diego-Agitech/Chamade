import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Un état vide chaleureux — à utiliser dès qu'une liste/section n'a rien à afficher.
 *
 * @example
 *   <EmptyState
 *     icon={Calendar}
 *     title="Le mas attend sa prochaine visite 🌿"
 *     description="Ajoute un séjour pour le marquer dans l'agenda."
 *     action={<Button>+ Nouveau séjour</Button>}
 *   />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-chamade-sand bg-chamade-cream/40 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chamade-sand text-chamade-olive">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <p className="font-serif text-xl italic text-chamade-stone">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
