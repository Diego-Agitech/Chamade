# Brief UX — "La Chamade" · chantier de refonte visuelle

## Contexte

L'app est fonctionnelle (Next 15, Tailwind v4, Drizzle/Turso, NextAuth, shadcn + @base-ui). **Le code marche, mais l'identité visuelle est à refaire** : monochrome noir/blanc, typo Geist sans-serif, empty states plats, aucune personnalité. Le brief d'origine demandait une ambiance **"chaleureuse, provençale, élégante — pas de SaaS froid"**. On va la ramener.

**Ne change pas :** l'auth NextAuth, les server actions, le schéma DB, les routes. On travaille uniquement la couche visuelle + micro-UX + quelques manques fonctionnels (charts, vue résumé agenda).

**Respecte la stack :** Tailwind v4 (variables CSS dans `globals.css` via `@theme inline`, **pas** de refonte `tailwind.config.ts`), shadcn + @base-ui/react, lucide-react, date-fns locale fr.

---

## P0 — Identité visuelle (à faire en premier, 1-2h)

### 1. Injecter la palette provençale dans `app/globals.css`

Remplacer les variables monochromes OKLCH par la palette chamade. Garder les mêmes noms de tokens (`--background`, `--foreground`, etc.) pour ne rien casser côté composants.

```css
:root {
  /* Neutres crème & pierre */
  --background: oklch(0.97 0.015 85);        /* crème */
  --foreground: oklch(0.25 0.03 45);          /* terre sombre */
  --card: oklch(0.99 0.01 85);
  --card-foreground: oklch(0.25 0.03 45);
  --popover: oklch(0.99 0.01 85);
  --popover-foreground: oklch(0.25 0.03 45);
  --muted: oklch(0.93 0.02 75);
  --muted-foreground: oklch(0.45 0.02 55);
  --border: oklch(0.88 0.025 70);
  --input: oklch(0.92 0.02 70);

  /* Accents chauds */
  --primary: oklch(0.60 0.15 35);             /* terracotta */
  --primary-foreground: oklch(0.98 0.01 85);
  --secondary: oklch(0.90 0.04 70);           /* sable */
  --secondary-foreground: oklch(0.25 0.03 45);
  --accent: oklch(0.55 0.10 130);             /* olive */
  --accent-foreground: oklch(0.98 0.01 85);
  --ring: oklch(0.60 0.15 35);
  --destructive: oklch(0.55 0.22 25);

  /* Couleurs sémantiques maison (utilisables en bg-chamade-* via @theme) */
  --chamade-cream: oklch(0.97 0.015 85);
  --chamade-sand: oklch(0.90 0.04 75);
  --chamade-terracotta: oklch(0.60 0.15 35);
  --chamade-olive: oklch(0.55 0.10 130);
  --chamade-mediterranean: oklch(0.50 0.10 240);
  --chamade-gold: oklch(0.72 0.13 85);
  --chamade-stone: oklch(0.55 0.02 60);

  /* Charts — variations de la palette chaude (plus de gris !) */
  --chart-1: oklch(0.60 0.15 35);             /* terracotta */
  --chart-2: oklch(0.55 0.10 130);            /* olive */
  --chart-3: oklch(0.50 0.10 240);            /* méditerranée */
  --chart-4: oklch(0.72 0.13 85);             /* doré */
  --chart-5: oklch(0.45 0.08 320);            /* prune (vignes) */

  --radius: 0.75rem;
}

.dark {
  /* Version sombre "soir d'été" */
  --background: oklch(0.18 0.02 40);
  --foreground: oklch(0.92 0.02 80);
  --card: oklch(0.22 0.02 40);
  --card-foreground: oklch(0.92 0.02 80);
  --muted: oklch(0.28 0.02 45);
  --muted-foreground: oklch(0.65 0.02 70);
  --border: oklch(0.30 0.02 45);
  --primary: oklch(0.65 0.15 35);
  --accent: oklch(0.60 0.10 130);
  /* Gardes les mêmes accents saturés */
}
```

Dans le bloc `@theme inline` au-dessus, **ajoute** les tokens chamade :

```css
@theme inline {
  /* ...existant... */
  --color-chamade-cream: var(--chamade-cream);
  --color-chamade-sand: var(--chamade-sand);
  --color-chamade-terracotta: var(--chamade-terracotta);
  --color-chamade-olive: var(--chamade-olive);
  --color-chamade-mediterranean: var(--chamade-mediterranean);
  --color-chamade-gold: var(--chamade-gold);
  --color-chamade-stone: var(--chamade-stone);
}
```

### 2. Typographie — ajouter Fraunces pour les titres

Dans `app/layout.tsx` :

```tsx
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

// dans <html className={...}>, ajoute ${fraunces.variable}
```

Puis dans `globals.css`, supprime la ligne `--font-heading: var(--font-sans);` (qui force Geist sur les titres) et laisse la variable définie par next/font.

Dans `app/globals.css` `@layer base`, ajoute :

```css
h1, h2, h3 {
  @apply font-serif tracking-tight;
  font-family: var(--font-heading);
}
```

Puis dans `tailwind` config ou `@theme` : `--font-serif: var(--font-heading);`

### 3. Texture de fond subtile

Dans `body` (globals.css) :

```css
body {
  @apply bg-background text-foreground;
  background-image:
    radial-gradient(at 15% 10%, oklch(0.60 0.15 35 / 0.06) 0px, transparent 50%),
    radial-gradient(at 85% 90%, oklch(0.55 0.10 130 / 0.06) 0px, transparent 50%);
}
```

---

## P1 — Micro-UX & composants réutilisables (2-3h)

### 4. Installer et brancher `sonner` (toasts)

```bash
npm install sonner
```

Dans `app/layout.tsx` :

```tsx
import { Toaster } from "sonner";
// dans <body>, après {children} :
<Toaster position="bottom-right" richColors closeButton />
```

Dans chaque server action succès, depuis le composant client qui l'appelle :
```tsx
import { toast } from "sonner";
toast.success("Séjour ajouté");
toast.error("Oups, une erreur est survenue");
```

### 5. Créer `components/ui/empty-state.tsx`

Pour remplacer tous les "Aucun X" plats :

```tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-chamade-sand bg-chamade-cream/40 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chamade-sand text-chamade-olive">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-serif text-xl italic text-chamade-stone">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

Remplace tous les empty states existants (au minimum dashboard, agenda, todos, revenues) avec des copy chaleureux :
- Agenda vide : *"Le mas attend sa prochaine visite 🌿"*
- Todos vide : *"Tout est en ordre — rien à faire ici."*
- Revenus vide : *"Aucun revenu saisi cette année."*

### 6. Créer `components/ui/badge.tsx` pour priorités/statuts

```tsx
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-chamade-sand/60 text-chamade-stone",
  warm: "bg-chamade-terracotta/15 text-chamade-terracotta",
  olive: "bg-chamade-olive/15 text-chamade-olive",
  gold: "bg-chamade-gold/20 text-chamade-stone",
  sea: "bg-chamade-mediterranean/15 text-chamade-mediterranean",
  success: "bg-emerald-100 text-emerald-800",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

Dans `app/(authenticated)/todos/page.tsx` (ligne ~232), remplace l'affichage texte de priorité par :

```tsx
<Badge tone={priority === "high" ? "warm" : priority === "medium" ? "gold" : "neutral"}>
  {priority === "high" ? "Haute" : priority === "medium" ? "Moyenne" : "Basse"}
</Badge>
```

### 7. Bouton de submit avec état de chargement

Dans `components/ui/button.tsx`, ajoute une variante / prop `loading` qui affiche un `Loader2` de lucide. Puis utilise `useFormStatus()` dans les forms pour passer `loading={pending}`.

### 8. Focus rings & skip link (accessibilité)

Dans `globals.css` `@layer base` :

```css
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-chamade-terracotta;
}
```

Dans `components/shared/AppHeader.tsx` en tout premier :

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded-md bg-chamade-terracotta px-3 py-1.5 text-sm text-white"
>
  Aller au contenu
</a>
```

Et sur `<main>` du layout : `id="main-content"`.

---

## P2 — Écrans à retravailler (4-6h)

### 9. Dashboard — cartes KPI colorées

`app/(authenticated)/dashboard/page.tsx`

Les 4 KPI cards doivent avoir des accents colorés selon le signal :

- **Todos en retard** → `bg-chamade-terracotta/10 border-l-4 border-l-chamade-terracotta`
- **Séjours à venir** → `bg-chamade-mediterranean/10 border-l-4 border-l-chamade-mediterranean`
- **Solde financier** → `bg-chamade-olive/10 border-l-4 border-l-chamade-olive` si positif, `terracotta` si négatif
- **Todos ouvertes** → `bg-chamade-gold/10 border-l-4 border-l-chamade-gold`

Valeur en `font-serif text-4xl`, label en `text-xs uppercase tracking-wider text-muted-foreground`.

### 10. Agenda — ajouter la vue "Résumé"

`components/agenda/AgendaClient.tsx` a déjà un toggle année/filtre. Ajoute un deuxième switch **"Calendrier / Résumé"** en haut.

**Vue Résumé** (nouveau composant `AgendaSummary.tsx`) :

- **5 KPI cards** en haut (même style que dashboard) : Nuitées totales · Nuitées famille vs location · Nombre de locations · Revenus locatifs nets · Taux d'occupation (%)
- **Heatmap annuelle** : grille 53 colonnes (semaines) × 7 lignes (jours), chaque case colorée par l'occupant (couleur du membre ou `chamade-gold` pour location). Cellules vides = `chamade-cream`. Utiliser un simple `<div className="grid grid-cols-[repeat(53,1fr)] gap-0.5">`.
- **Prochains séjours** (10 max) : liste chronologique cards, avatar coloré + dates + durée + badge location si applicable
- **Derniers séjours passés** (10 max)
- **Statistiques par membre** : mini-tableau (jours passés dans l'année par membre)

### 11. Finances — Recharts pour le reporting

```bash
npm install recharts
```

Dans `app/(authenticated)/finances/reporting/` ou tab Reporting :
- **Courbe 12 mois** : OPEX en `--chart-1`, CAPEX en `--chart-4`, Revenus en `--chart-2` (un `ComposedChart`)
- **Donut OPEX vs CAPEX vs Revenus**
- **Bar chart empilé** revenus par source (rental / vignes / divers)
- **Pie chart** répartition OPEX par catégorie

Wrapper les graphs dans des cards `bg-card rounded-xl border p-6` avec titre serif.

### 12. Mobile — bottom nav

Dans `components/shared/AppHeader.tsx`, **supprime** la deuxième `MainNav` qui apparaît sous le header en mobile. Crée à la place un composant `components/shared/BottomNav.tsx` :

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CheckSquare, TrendingUp, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/todos", label: "Tâches", icon: CheckSquare },
  { href: "/finances", label: "Finances", icon: TrendingUp },
  { href: "/settings", label: "Profil", icon: Settings },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 px-2 py-1.5 backdrop-blur md:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
              active
                ? "text-chamade-terracotta"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

Monter dans le layout auth et ajouter `pb-20 md:pb-0` sur `<main>`.

### 13. Forms — React Hook Form + Zod + feedback inline

Les packages sont déjà installés (`react-hook-form`, `@hookform/resolvers`, `zod`).

Pour chaque form (stay creation, todo, expense, revenue) :
1. Extraire le schéma Zod
2. `useForm({ resolver: zodResolver(schema) })`
3. Messages d'erreur inline sous chaque champ (`text-xs text-destructive mt-1`)
4. Bouton submit désactivé pendant `isSubmitting`
5. Toast succès/erreur à la fin

Créer un wrapper `components/ui/form-field.tsx` :

```tsx
export function FormField({
  label, error, hint, children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-chamade-olive">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
```

---

## Do / Don't

**Do**
- Garde NextAuth tel quel (même si le brief original disait "pas d'auth", on ne régresse pas)
- Utilise lucide-react partout où il y a un emoji pour les icônes structurelles (garde les emojis pour les avatars membres uniquement)
- Toutes les cards finances : `bg-card rounded-2xl border p-6 shadow-sm`
- Les titres de section : `<h2 className="font-serif text-2xl text-foreground">`

**Don't**
- Ne réintroduis pas `bg-zinc-*`, `text-zinc-*`, `border-zinc-*` → remplace par `bg-muted`, `text-muted-foreground`, `border-border` ou les `chamade-*`
- Ne change pas la structure des server actions ni le schéma Drizzle
- Ne touche pas au système d'auth
- N'ajoute pas de tests unitaires (projet familial, vitesse > coverage)

---

## Ordre suggéré

1. P0 #1-3 (palette + typo + texture) → **effet visible immédiat sur toute l'app**
2. P1 #4-8 (toasts, empty state, badge, focus) → **confort d'usage**
3. P2 #9 (dashboard KPIs) — validation rapide que la palette fonctionne
4. P2 #10 (agenda résumé) — gros morceau mais très visible
5. P2 #11 (charts finances)
6. P2 #12-13 (mobile + forms)

Commence par P0 seulement, montre un screenshot du dashboard avant d'attaquer P1.
