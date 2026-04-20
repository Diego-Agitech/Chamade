"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createExpenseCategory,
  createTodoCategory,
  deleteExpenseCategory,
  deleteTodoCategory,
  toggleExpenseCategoryActive,
  updateExpenseCategory,
  updateTodoCategory,
} from "@/lib/db/settings";

const todoCategorySchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const expenseNatureSchema = z.enum(["OPEX", "CAPEX"]);
const expenseZoneSchema = z.enum(["chamade", "pavillon", "poolhouse", "piscine", "vignes", "jardin", "global"]);

const expenseCategorySchema = z.object({
  name: z.string().min(2),
  nature: expenseNatureSchema,
  zone: expenseZoneSchema,
  icon: z.string().optional(),
  color: z.string().optional(),
  amortizationYears: z.number().int().positive().optional(),
});

function revalidateAllCategoryConsumers() {
  revalidatePath("/settings/categories");
  revalidatePath("/todos");
  revalidatePath("/finances");
}

export async function createTodoCategoryAction(formData: FormData) {
  const parsed = todoCategorySchema.parse({
    name: String(formData.get("name") || ""),
    icon: String(formData.get("icon") || "") || undefined,
    color: String(formData.get("color") || "") || undefined,
  });

  await createTodoCategory(parsed);
  revalidateAllCategoryConsumers();
}

export async function updateTodoCategoryAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") || "");
  const parsed = todoCategorySchema.parse({
    name: String(formData.get("name") || ""),
    icon: String(formData.get("icon") || "") || undefined,
    color: String(formData.get("color") || "") || undefined,
  });

  await updateTodoCategory(categoryId, parsed);
  revalidateAllCategoryConsumers();
}

export async function deleteTodoCategoryAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") || "");
  const replacementCategoryId = String(formData.get("replacementCategoryId") || "") || undefined;

  await deleteTodoCategory({ categoryId, replacementCategoryId });
  revalidateAllCategoryConsumers();
}

export async function createExpenseCategoryAction(formData: FormData) {
  const amortizationRaw = String(formData.get("amortizationYears") || "");
  const parsed = expenseCategorySchema.parse({
    name: String(formData.get("name") || ""),
    nature: String(formData.get("nature") || ""),
    zone: String(formData.get("zone") || "global"),
    icon: String(formData.get("icon") || "") || undefined,
    color: String(formData.get("color") || "") || undefined,
    amortizationYears: amortizationRaw ? Number(amortizationRaw) : undefined,
  });

  await createExpenseCategory(parsed);
  revalidateAllCategoryConsumers();
}

export async function updateExpenseCategoryAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") || "");
  const amortizationRaw = String(formData.get("amortizationYears") || "");
  const parsed = expenseCategorySchema.omit({ nature: true }).parse({
    name: String(formData.get("name") || ""),
    zone: String(formData.get("zone") || "global"),
    icon: String(formData.get("icon") || "") || undefined,
    color: String(formData.get("color") || "") || undefined,
    amortizationYears: amortizationRaw ? Number(amortizationRaw) : undefined,
  });

  await updateExpenseCategory(categoryId, parsed);
  revalidateAllCategoryConsumers();
}

export async function toggleExpenseCategoryActiveAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") || "");
  const isActive = String(formData.get("isActive") || "") === "true";

  await toggleExpenseCategoryActive(categoryId, isActive);
  revalidateAllCategoryConsumers();
}

export async function deleteExpenseCategoryAction(formData: FormData) {
  const categoryId = String(formData.get("categoryId") || "");
  const replacementCategoryId = String(formData.get("replacementCategoryId") || "") || undefined;

  await deleteExpenseCategory({ categoryId, replacementCategoryId });
  revalidateAllCategoryConsumers();
}
