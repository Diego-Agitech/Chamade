import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-chamade-sand/60 text-chamade-stone",
        warm: "bg-chamade-terracotta/15 text-chamade-terracotta",
        olive: "bg-chamade-olive/15 text-chamade-olive",
        gold: "bg-chamade-gold/25 text-[color:oklch(0.45_0.10_80)]",
        sea: "bg-chamade-mediterranean/15 text-chamade-mediterranean",
        success: "bg-emerald-100 text-emerald-800",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

/**
 * Badge sémantique utilisé pour priorités, statuts, catégories, filtres.
 *
 * @example
 *   <Badge tone="warm">Haute priorité</Badge>
 *   <Badge tone="olive">En cours</Badge>
 */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}

export { badgeVariants };
