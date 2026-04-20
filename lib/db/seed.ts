import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/hash";
import { db } from "@/lib/db";
import { expenseCategories, members, todoCategories } from "@/lib/db/schema";

const INITIAL_PASSWORD = "mimi&abo";

const FAMILY_MEMBERS = [
  { name: "ChrisPadi SCI", email: "chrispadi@chamade.fr", color: "#334155", emoji: "🏢" },
  { name: "Abo", email: "abo@chamade.fr", color: "#d97706", emoji: "🧡" },
  { name: "Mimi", email: "mimi@chamade.fr", color: "#ec4899", emoji: "🩷" },
  { name: "Christina", email: "christina@chamade.fr", color: "#8b5cf6", emoji: "💜" },
  { name: "Pascaline", email: "pascaline@chamade.fr", color: "#10b981", emoji: "💚" },
  { name: "Diego", email: "diego@chamade.fr", color: "#3b82f6", emoji: "💙" },
  { name: "Isabelle", email: "isabelle@chamade.fr", color: "#06b6d4", emoji: "🩵" },
] as const;

const TODO_CATEGORY_SEED = [
  { name: "Piscine", icon: "Waves", color: "#0ea5e9", sortOrder: 1 },
  { name: "Maison Chamade", icon: "Home", color: "#f97316", sortOrder: 2 },
  { name: "Maison Pavillon", icon: "House", color: "#f59e0b", sortOrder: 3 },
  { name: "Maison Poolhouse", icon: "Building2", color: "#14b8a6", sortOrder: 4 },
  { name: "Vignes", icon: "Grape", color: "#7c3aed", sortOrder: 5 },
  { name: "Jardin", icon: "TreePine", color: "#22c55e", sortOrder: 6 },
] as const;

type ExpenseCategorySeed = {
  name: string;
  nature: "OPEX" | "CAPEX";
  zone: "chamade" | "pavillon" | "poolhouse" | "piscine" | "vignes" | "jardin" | "global";
  icon: string;
  color: string;
  amortizationYears?: number;
};

const EXPENSE_CATEGORY_SEED: ExpenseCategorySeed[] = [
  { name: "Énergie", nature: "OPEX", zone: "global", icon: "Zap", color: "#f59e0b" },
  { name: "Eau", nature: "OPEX", zone: "global", icon: "Droplets", color: "#06b6d4" },
  { name: "Internet & télécoms", nature: "OPEX", zone: "global", icon: "Wifi", color: "#3b82f6" },
  { name: "Entretien piscine", nature: "OPEX", zone: "piscine", icon: "Waves", color: "#0ea5e9" },
  { name: "Entretien jardin", nature: "OPEX", zone: "jardin", icon: "Flower2", color: "#22c55e" },
  { name: "Entretien maison", nature: "OPEX", zone: "global", icon: "Hammer", color: "#f97316" },
  { name: "Assurances", nature: "OPEX", zone: "global", icon: "Shield", color: "#6366f1" },
  { name: "Taxes & impôts", nature: "OPEX", zone: "global", icon: "Landmark", color: "#ef4444" },
  {
    name: "Fournitures & consommables",
    nature: "OPEX",
    zone: "global",
    icon: "Package",
    color: "#a855f7",
  },
  { name: "Gestion locative", nature: "OPEX", zone: "global", icon: "KeyRound", color: "#eab308" },
  { name: "Entretien vignes", nature: "OPEX", zone: "vignes", icon: "Grape", color: "#7c3aed" },
  { name: "Autres charges", nature: "OPEX", zone: "global", icon: "CircleEllipsis", color: "#6b7280" },
  {
    name: "Travaux — Chamade",
    nature: "CAPEX",
    zone: "chamade",
    icon: "HardHat",
    color: "#f97316",
    amortizationYears: 15,
  },
  {
    name: "Travaux — Pavillon",
    nature: "CAPEX",
    zone: "pavillon",
    icon: "HousePlus",
    color: "#f59e0b",
    amortizationYears: 15,
  },
  {
    name: "Travaux — Poolhouse",
    nature: "CAPEX",
    zone: "poolhouse",
    icon: "Building2",
    color: "#14b8a6",
    amortizationYears: 15,
  },
  {
    name: "Rénovation piscine",
    nature: "CAPEX",
    zone: "piscine",
    icon: "WavesLadder",
    color: "#0ea5e9",
    amortizationYears: 10,
  },
  {
    name: "Équipements techniques",
    nature: "CAPEX",
    zone: "global",
    icon: "Wrench",
    color: "#3b82f6",
    amortizationYears: 10,
  },
  {
    name: "Gros électroménager",
    nature: "CAPEX",
    zone: "global",
    icon: "Refrigerator",
    color: "#6366f1",
    amortizationYears: 7,
  },
  {
    name: "Mobilier durable",
    nature: "CAPEX",
    zone: "global",
    icon: "Sofa",
    color: "#a855f7",
    amortizationYears: 10,
  },
  {
    name: "Aménagements paysagers",
    nature: "CAPEX",
    zone: "jardin",
    icon: "Trees",
    color: "#22c55e",
    amortizationYears: 15,
  },
  {
    name: "Vignes — plantation & équipement",
    nature: "CAPEX",
    zone: "vignes",
    icon: "Vine",
    color: "#7c3aed",
    amortizationYears: 20,
  },
  {
    name: "Domotique & sécurité",
    nature: "CAPEX",
    zone: "global",
    icon: "ShieldCheck",
    color: "#10b981",
    amortizationYears: 7,
  },
  {
    name: "Autres investissements",
    nature: "CAPEX",
    zone: "global",
    icon: "CircleEllipsis",
    color: "#6b7280",
    amortizationYears: 10,
  },
];

async function seedMembers() {
  const passwordHash = await hashPassword(INITIAL_PASSWORD);

  for (const member of FAMILY_MEMBERS) {
    const existing = await db.query.members.findFirst({
      where: eq(members.email, member.email),
    });

    if (existing) {
      await db
        .update(members)
        .set({
          name: member.name,
          color: member.color,
          emoji: member.emoji,
          passwordHash,
          mustChangePassword: false,
        })
        .where(eq(members.id, existing.id));
      continue;
    }

    await db.insert(members).values({
      ...member,
      passwordHash,
      mustChangePassword: false,
    });
  }
}

async function seedTodoCategories() {
  for (const category of TODO_CATEGORY_SEED) {
    await db
      .insert(todoCategories)
      .values(category)
      .onConflictDoUpdate({
        target: todoCategories.name,
        set: {
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
        },
      });
  }
}

async function seedExpenseCategories() {
  for (const [index, category] of EXPENSE_CATEGORY_SEED.entries()) {
    await db
      .insert(expenseCategories)
      .values({
        ...category,
        sortOrder: index + 1,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: expenseCategories.name,
        set: {
          nature: category.nature,
          zone: category.zone,
          icon: category.icon,
          color: category.color,
          amortizationYears: category.amortizationYears ?? null,
          sortOrder: index + 1,
          isActive: true,
        },
      });
  }
}

async function main() {
  await seedMembers();
  await seedTodoCategories();
  await seedExpenseCategories();
  console.log("Seed completed.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
