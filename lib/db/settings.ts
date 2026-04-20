import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { expenseCategories, expenses, members, todoCategories, todos } from "@/lib/db/schema";

export type NotificationSettings = {
  notifyOnNewStay: boolean;
  notifyOnOverlap: boolean;
  notifyOnTodoAssigned: boolean;
  notifyOnNewExpense: boolean;
  notifyMonthlyFinanceReport: boolean;
  notifyWeeklyDigest: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  notifyOnNewStay: true,
  notifyOnOverlap: true,
  notifyOnTodoAssigned: true,
  notifyOnNewExpense: false,
  notifyMonthlyFinanceReport: true,
  notifyWeeklyDigest: true,
};

export type MemberSettings = {
  id: string;
  name: string;
  email: string;
  color: string;
  emoji: string | null;
  lastLoginAt: string | null;
};

export type ExpenseNature = "OPEX" | "CAPEX";

async function requireSessionMember() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function normalizeNotificationSettings(
  row:
    | {
        notifyOnNewStay?: boolean | null;
        notifyOnOverlap?: boolean | null;
        notifyOnTodoAssigned?: boolean | null;
        notifyOnNewExpense?: boolean | null;
        notifyMonthlyFinanceReport?: boolean | null;
        notifyWeeklyDigest?: boolean | null;
      }
    | undefined
): NotificationSettings {
  return {
    notifyOnNewStay: row?.notifyOnNewStay ?? DEFAULT_NOTIFICATION_SETTINGS.notifyOnNewStay,
    notifyOnOverlap: row?.notifyOnOverlap ?? DEFAULT_NOTIFICATION_SETTINGS.notifyOnOverlap,
    notifyOnTodoAssigned: row?.notifyOnTodoAssigned ?? DEFAULT_NOTIFICATION_SETTINGS.notifyOnTodoAssigned,
    notifyOnNewExpense: row?.notifyOnNewExpense ?? DEFAULT_NOTIFICATION_SETTINGS.notifyOnNewExpense,
    notifyMonthlyFinanceReport:
      row?.notifyMonthlyFinanceReport ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMonthlyFinanceReport,
    notifyWeeklyDigest: row?.notifyWeeklyDigest ?? DEFAULT_NOTIFICATION_SETTINGS.notifyWeeklyDigest,
  };
}

export async function getNotificationSettings() {
  const sessionUser = await requireSessionMember();
  const row = await db.query.members.findFirst({
    where: eq(members.id, sessionUser.id),
    columns: {
      notifyOnNewStay: true,
      notifyOnOverlap: true,
      notifyOnTodoAssigned: true,
      notifyOnNewExpense: true,
      notifyMonthlyFinanceReport: true,
      notifyWeeklyDigest: true,
    },
  });

  return normalizeNotificationSettings(row);
}

export async function updateNotificationSettings(input: Partial<NotificationSettings>) {
  const sessionUser = await requireSessionMember();

  await db
    .update(members)
    .set(input)
    .where(eq(members.id, sessionUser.id));

  return getNotificationSettings();
}

export async function getMemberSettingsById(memberId: string): Promise<MemberSettings | null> {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
    columns: {
      id: true,
      name: true,
      email: true,
      color: true,
      emoji: true,
      lastLoginAt: true,
    },
  });

  return member ?? null;
}

export async function getMemberByEmailForSettings(email: string): Promise<{ id: string } | null> {
  const member = await db.query.members.findFirst({
    where: eq(members.email, email),
    columns: { id: true },
  });

  return member ?? null;
}

export async function isEmailUsedByAnotherMember(memberId: string, email: string): Promise<boolean> {
  const existing = await db.query.members.findFirst({
    where: and(eq(members.email, email), ne(members.id, memberId)),
    columns: { id: true },
  });

  return Boolean(existing);
}

export async function updateMemberProfileSettings(input: {
  memberId: string;
  email: string;
  emoji: string | null;
}): Promise<void> {
  await db
    .update(members)
    .set({
      email: input.email,
      emoji: input.emoji,
    })
    .where(eq(members.id, input.memberId));
}

export async function getSettingsCategoriesData() {
  await requireSessionMember();

  const todoRows = await db
    .select({
      id: todoCategories.id,
      name: todoCategories.name,
      icon: todoCategories.icon,
      color: todoCategories.color,
      sortOrder: todoCategories.sortOrder,
      linkedTodos: count(todos.id),
    })
    .from(todoCategories)
    .leftJoin(todos, eq(todos.categoryId, todoCategories.id))
    .groupBy(todoCategories.id)
    .orderBy(asc(todoCategories.sortOrder), asc(todoCategories.name));

  const expenseRows = await db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      nature: expenseCategories.nature,
      zone: expenseCategories.zone,
      icon: expenseCategories.icon,
      color: expenseCategories.color,
      amortizationYears: expenseCategories.amortizationYears,
      isActive: expenseCategories.isActive,
      sortOrder: expenseCategories.sortOrder,
      linkedExpenses: count(expenses.id),
    })
    .from(expenseCategories)
    .leftJoin(expenses, eq(expenses.categoryId, expenseCategories.id))
    .groupBy(expenseCategories.id)
    .orderBy(asc(expenseCategories.nature), asc(expenseCategories.sortOrder), asc(expenseCategories.name));

  return {
    todoCategories: todoRows,
    expenseCategories: expenseRows,
  };
}

async function nextTodoSortOrder() {
  const rows = await db.select({ max: sql<number>`coalesce(max(${todoCategories.sortOrder}), -1)` }).from(todoCategories);
  return (rows[0]?.max ?? -1) + 1;
}

async function nextExpenseSortOrder(nature: ExpenseNature) {
  const rows = await db
    .select({ max: sql<number>`coalesce(max(${expenseCategories.sortOrder}), -1)` })
    .from(expenseCategories)
    .where(eq(expenseCategories.nature, nature));
  return (rows[0]?.max ?? -1) + 1;
}

export async function createTodoCategory(input: { name: string; icon?: string; color?: string }) {
  await requireSessionMember();
  const sortOrder = await nextTodoSortOrder();

  await db.insert(todoCategories).values({
    name: input.name,
    icon: input.icon || null,
    color: input.color || null,
    sortOrder,
  });
}

export async function updateTodoCategory(
  categoryId: string,
  input: { name: string; icon?: string; color?: string }
) {
  await requireSessionMember();

  await db
    .update(todoCategories)
    .set({
      name: input.name,
      icon: input.icon || null,
      color: input.color || null,
    })
    .where(eq(todoCategories.id, categoryId));
}

export async function deleteTodoCategory(input: { categoryId: string; replacementCategoryId?: string }) {
  await requireSessionMember();

  const linked = await db.select({ total: count(todos.id) }).from(todos).where(eq(todos.categoryId, input.categoryId));
  const linkedTotal = linked[0]?.total ?? 0;

  if (linkedTotal > 0) {
    if (!input.replacementCategoryId) {
      throw new Error("Migration required");
    }
    if (input.replacementCategoryId === input.categoryId) {
      throw new Error("Invalid replacement");
    }

    const replacement = await db
      .select({ id: todoCategories.id })
      .from(todoCategories)
      .where(eq(todoCategories.id, input.replacementCategoryId));

    if (replacement.length === 0) {
      throw new Error("Replacement not found");
    }

    await db
      .update(todos)
      .set({ categoryId: input.replacementCategoryId })
      .where(eq(todos.categoryId, input.categoryId));
  }

  await db.delete(todoCategories).where(eq(todoCategories.id, input.categoryId));
}

export async function createExpenseCategory(input: {
  name: string;
  nature: ExpenseNature;
  zone?: "chamade" | "pavillon" | "poolhouse" | "piscine" | "vignes" | "jardin" | "global";
  icon?: string;
  color?: string;
  amortizationYears?: number;
  isActive?: boolean;
}) {
  await requireSessionMember();
  const sortOrder = await nextExpenseSortOrder(input.nature);

  await db.insert(expenseCategories).values({
    name: input.name,
    nature: input.nature,
    zone: input.zone || "global",
    icon: input.icon || null,
    color: input.color || null,
    amortizationYears: input.amortizationYears ?? null,
    sortOrder,
    isActive: input.isActive ?? true,
  });
}

export async function updateExpenseCategory(
  categoryId: string,
  input: {
    name: string;
    zone?: "chamade" | "pavillon" | "poolhouse" | "piscine" | "vignes" | "jardin" | "global";
    icon?: string;
    color?: string;
    amortizationYears?: number;
  }
) {
  await requireSessionMember();

  await db
    .update(expenseCategories)
    .set({
      name: input.name,
      zone: input.zone || "global",
      icon: input.icon || null,
      color: input.color || null,
      amortizationYears: input.amortizationYears ?? null,
    })
    .where(eq(expenseCategories.id, categoryId));
}

export async function toggleExpenseCategoryActive(categoryId: string, isActive: boolean) {
  await requireSessionMember();

  await db
    .update(expenseCategories)
    .set({ isActive })
    .where(eq(expenseCategories.id, categoryId));
}

export async function deleteExpenseCategory(input: { categoryId: string; replacementCategoryId?: string }) {
  await requireSessionMember();

  const category = await db
    .select({
      id: expenseCategories.id,
      nature: expenseCategories.nature,
    })
    .from(expenseCategories)
    .where(eq(expenseCategories.id, input.categoryId));

  if (category.length === 0) {
    throw new Error("Category not found");
  }

  const linked = await db.select({ total: count(expenses.id) }).from(expenses).where(eq(expenses.categoryId, input.categoryId));
  const linkedTotal = linked[0]?.total ?? 0;

  if (linkedTotal > 0) {
    if (!input.replacementCategoryId) {
      throw new Error("Migration required");
    }
    if (input.replacementCategoryId === input.categoryId) {
      throw new Error("Invalid replacement");
    }

    const replacement = await db
      .select({ id: expenseCategories.id })
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.id, input.replacementCategoryId),
          eq(expenseCategories.nature, category[0].nature),
          ne(expenseCategories.id, input.categoryId)
        )
      );

    if (replacement.length === 0) {
      throw new Error("Replacement must match nature");
    }

    await db
      .update(expenses)
      .set({ categoryId: input.replacementCategoryId, nature: category[0].nature })
      .where(eq(expenses.categoryId, input.categoryId));
  }

  await db.delete(expenseCategories).where(eq(expenseCategories.id, input.categoryId));
}
