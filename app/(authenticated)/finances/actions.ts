"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCompensationPayment, createExpense, createRevenue } from "@/lib/db/finances";

const expenseSchema = z.object({
  nature: z.enum(["OPEX", "CAPEX"]),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(2),
  vendor: z.string().optional(),
  date: z.string().min(1),
  paidBy: z.string().optional(),
  isRecurring: z.boolean(),
  recurrenceFrequency: z.enum(["monthly", "quarterly", "yearly"]).optional(),
});

const revenueSchema = z.object({
  source: z.enum(["rental", "vignes", "divers"]),
  subcategory: z.string().optional(),
  grossAmount: z.number().nonnegative(),
  deductions: z.number().nonnegative().optional(),
  description: z.string().min(2),
  date: z.string().min(1),
  payerName: z.string().optional(),
  receivedBy: z.string().optional(),
});

const compensationSchema = z.object({
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export async function createExpenseAction(formData: FormData) {
  const parsed = expenseSchema.parse({
    nature: String(formData.get("nature")),
    categoryId: String(formData.get("categoryId")),
    amount: Number(formData.get("amount")),
    description: String(formData.get("description")),
    vendor: String(formData.get("vendor") || "") || undefined,
    date: String(formData.get("date")),
    paidBy: String(formData.get("paidBy") || "") || undefined,
    isRecurring: String(formData.get("isRecurring") || "") === "on",
    recurrenceFrequency: String(formData.get("recurrenceFrequency") || "") || undefined,
  });

  await createExpense(parsed);
  revalidatePath("/finances");
}

export async function createRevenueAction(formData: FormData) {
  const parsed = revenueSchema.parse({
    source: String(formData.get("source")),
    subcategory: String(formData.get("subcategory") || "") || undefined,
    grossAmount: Number(formData.get("grossAmount")),
    deductions: formData.get("deductions") ? Number(formData.get("deductions")) : undefined,
    description: String(formData.get("description")),
    date: String(formData.get("date")),
    payerName: String(formData.get("payerName") || "") || undefined,
    receivedBy: String(formData.get("receivedBy") || "") || undefined,
  });

  await createRevenue(parsed);
  revalidatePath("/finances");
}

export async function createCompensationPaymentAction(formData: FormData) {
  const parsed = compensationSchema.parse({
    fromMemberId: String(formData.get("fromMemberId")),
    toMemberId: String(formData.get("toMemberId")),
    amount: Number(formData.get("amount")),
    date: String(formData.get("date")),
    notes: String(formData.get("notes") || "") || undefined,
  });

  await createCompensationPayment(parsed);
  revalidatePath("/finances");
}
