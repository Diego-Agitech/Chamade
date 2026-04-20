import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { compensationPayments, expenseCategories, expenses, members, revenues } from "@/lib/db/schema";

type FinanceTab = "dashboard" | "opex" | "capex" | "revenues" | "reporting";

async function requireSessionMember() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

function yearRange(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export async function getFinancesPageData(year = new Date().getFullYear(), tab: FinanceTab = "dashboard") {
  await requireSessionMember();

  const { start, end } = yearRange(year);
  const { start: prevStart, end: prevEnd } = yearRange(year - 1);

  const expenseTotals = await db
    .select({
      opex: sql<number>`sum(case when ${expenses.nature} = 'OPEX' then ${expenses.amount} else 0 end)`,
      capex: sql<number>`sum(case when ${expenses.nature} = 'CAPEX' then ${expenses.amount} else 0 end)`,
    })
    .from(expenses)
    .where(and(gte(expenses.date, start), lte(expenses.date, end)));

  const previousOpexTotals = await db
    .select({
      opex: sql<number>`sum(case when ${expenses.nature} = 'OPEX' then ${expenses.amount} else 0 end)`,
    })
    .from(expenses)
    .where(and(gte(expenses.date, prevStart), lte(expenses.date, prevEnd)));

  const revenueTotals = await db
    .select({
      net: sql<number>`sum(${revenues.netAmount})`,
      rental: sql<number>`sum(case when ${revenues.source} = 'rental' then ${revenues.netAmount} else 0 end)`,
      vignes: sql<number>`sum(case when ${revenues.source} = 'vignes' then ${revenues.netAmount} else 0 end)`,
      divers: sql<number>`sum(case when ${revenues.source} = 'divers' then ${revenues.netAmount} else 0 end)`,
    })
    .from(revenues)
    .where(and(gte(revenues.date, start), lte(revenues.date, end)));

  const activeCategories = await db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      nature: expenseCategories.nature,
      zone: expenseCategories.zone,
      amortizationYears: expenseCategories.amortizationYears,
      color: expenseCategories.color,
    })
    .from(expenseCategories)
    .where(eq(expenseCategories.isActive, true))
    .orderBy(asc(expenseCategories.sortOrder), asc(expenseCategories.name));

  const allMembers = await db
    .select({
      id: members.id,
      name: members.name,
      color: members.color,
    })
    .from(members)
    .orderBy(asc(members.name));

  const expensesRows = await db
    .select({
      id: expenses.id,
      nature: expenses.nature,
      date: expenses.date,
      description: expenses.description,
      amount: expenses.amount,
      vendor: expenses.vendor,
      isRecurring: expenses.isRecurring,
      recurrenceFrequency: expenses.recurrenceFrequency,
      categoryName: expenseCategories.name,
      categoryZone: expenseCategories.zone,
      categoryColor: expenseCategories.color,
      paidByName: members.name,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(members, eq(expenses.paidBy, members.id))
    .where(and(gte(expenses.date, start), lte(expenses.date, end)))
    .orderBy(desc(expenses.date), desc(expenses.createdAt));

  const revenueRows = await db
    .select({
      id: revenues.id,
      source: revenues.source,
      subcategory: revenues.subcategory,
      date: revenues.date,
      description: revenues.description,
      payerName: revenues.payerName,
      grossAmount: revenues.grossAmount,
      deductions: revenues.deductions,
      netAmount: revenues.netAmount,
      receivedByName: members.name,
    })
    .from(revenues)
    .leftJoin(members, eq(revenues.receivedBy, members.id))
    .where(and(gte(revenues.date, start), lte(revenues.date, end)))
    .orderBy(desc(revenues.date), desc(revenues.createdAt));

  const compensationRows = await db
    .select({
      id: compensationPayments.id,
      date: compensationPayments.date,
      amount: compensationPayments.amount,
      notes: compensationPayments.notes,
      fromMemberId: compensationPayments.fromMemberId,
      toMemberId: compensationPayments.toMemberId,
    })
    .from(compensationPayments)
    .where(and(gte(compensationPayments.date, start), lte(compensationPayments.date, end)))
    .orderBy(desc(compensationPayments.date), desc(compensationPayments.createdAt));

  const memberExpenseRows = await db
    .select({
      memberId: members.id,
      memberName: members.name,
      paid: sql<number>`sum(coalesce(${expenses.amount},0))`,
    })
    .from(members)
    .leftJoin(expenses, eq(expenses.paidBy, members.id))
    .where(and(gte(expenses.date, start), lte(expenses.date, end)))
    .groupBy(members.id, members.name);

  const memberRevenueRows = await db
    .select({
      memberId: members.id,
      received: sql<number>`sum(coalesce(${revenues.netAmount},0))`,
    })
    .from(members)
    .leftJoin(revenues, eq(revenues.receivedBy, members.id))
    .where(and(gte(revenues.date, start), lte(revenues.date, end)))
    .groupBy(members.id);

  const paidByMember = new Map(memberExpenseRows.map((row) => [row.memberId, row.paid ?? 0]));
  const receivedByMember = new Map(memberRevenueRows.map((row) => [row.memberId, row.received ?? 0]));
  const compensationOut = new Map<string, number>();
  const compensationIn = new Map<string, number>();

  for (const payment of compensationRows) {
    compensationOut.set(payment.fromMemberId, (compensationOut.get(payment.fromMemberId) ?? 0) + payment.amount);
    compensationIn.set(payment.toMemberId, (compensationIn.get(payment.toMemberId) ?? 0) + payment.amount);
  }

  const memberBalances = allMembers.map((member) => {
    const paid = paidByMember.get(member.id) ?? 0;
    const received = receivedByMember.get(member.id) ?? 0;
    const compOut = compensationOut.get(member.id) ?? 0;
    const compIn = compensationIn.get(member.id) ?? 0;
    return {
      memberId: member.id,
      memberName: member.name,
      memberColor: member.color,
      paid,
      received,
      compensationOut: compOut,
      compensationIn: compIn,
      netBalance: paid - received - compOut + compIn,
    };
  });

  const creditors = memberBalances
    .filter((row) => row.netBalance > 0)
    .map((row) => ({ ...row, remaining: row.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = memberBalances
    .filter((row) => row.netBalance < 0)
    .map((row) => ({ ...row, remaining: Math.abs(row.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlementSuggestions: Array<{ fromMemberName: string; toMemberName: string; amount: number }> = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    if (amount > 0.005) {
      settlementSuggestions.push({
        fromMemberName: debtor.memberName,
        toMemberName: creditor.memberName,
        amount: Number(amount.toFixed(2)),
      });
    }
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining <= 0.005) i += 1;
    if (creditor.remaining <= 0.005) j += 1;
  }

  return {
    year,
    tab,
    kpis: {
      opex: expenseTotals[0]?.opex ?? 0,
      capex: expenseTotals[0]?.capex ?? 0,
      revenuesNet: revenueTotals[0]?.net ?? 0,
      revenuesBySource: {
        rental: revenueTotals[0]?.rental ?? 0,
        vignes: revenueTotals[0]?.vignes ?? 0,
        divers: revenueTotals[0]?.divers ?? 0,
      },
      opexPreviousYear: previousOpexTotals[0]?.opex ?? 0,
    },
    categories: activeCategories,
    members: allMembers,
    expenses: expensesRows,
    revenues: revenueRows,
    compensations: compensationRows.map((row) => ({
      ...row,
      fromMemberName: allMembers.find((member) => member.id === row.fromMemberId)?.name ?? "N/A",
      toMemberName: allMembers.find((member) => member.id === row.toMemberId)?.name ?? "N/A",
    })),
    memberBalances,
    settlementSuggestions,
  };
}

export async function createExpense(input: {
  nature: "OPEX" | "CAPEX";
  categoryId: string;
  amount: number;
  description: string;
  vendor?: string;
  date: string;
  paidBy?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: "monthly" | "quarterly" | "yearly";
}) {
  await requireSessionMember();
  await db.insert(expenses).values({
    nature: input.nature,
    categoryId: input.categoryId,
    amount: input.amount,
    description: input.description,
    vendor: input.vendor || null,
    date: input.date,
    paidBy: input.paidBy || null,
    isRecurring: input.isRecurring ?? false,
    recurrenceFrequency: input.isRecurring ? input.recurrenceFrequency || null : null,
  });
}

export async function createRevenue(input: {
  source: "rental" | "vignes" | "divers";
  subcategory?: string;
  grossAmount: number;
  deductions?: number;
  description: string;
  date: string;
  payerName?: string;
  receivedBy?: string;
}) {
  await requireSessionMember();
  const deductions = input.deductions ?? 0;
  const netAmount = input.grossAmount - deductions;

  await db.insert(revenues).values({
    source: input.source,
    subcategory: input.subcategory || null,
    grossAmount: input.grossAmount,
    deductions,
    netAmount,
    description: input.description,
    date: input.date,
    payerName: input.payerName || null,
    receivedBy: input.receivedBy || null,
  });
}

export async function createCompensationPayment(input: {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  notes?: string;
}) {
  await requireSessionMember();
  if (input.fromMemberId === input.toMemberId) {
    throw new Error("Le payeur et le bénéficiaire doivent être différents.");
  }
  await db.insert(compensationPayments).values({
    fromMemberId: input.fromMemberId,
    toMemberId: input.toMemberId,
    amount: input.amount,
    date: input.date,
    notes: input.notes || null,
  });
}

export async function getFinanceReportingData(year = new Date().getFullYear()) {
  await requireSessionMember();
  const { start, end } = yearRange(year);

  const expensesRows = await db
    .select({
      id: expenses.id,
      nature: expenses.nature,
      date: expenses.date,
      description: expenses.description,
      amount: expenses.amount,
      categoryName: expenseCategories.name,
      paidByName: members.name,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(members, eq(expenses.paidBy, members.id))
    .where(and(gte(expenses.date, start), lte(expenses.date, end)))
    .orderBy(desc(expenses.date));

  const revenuesRows = await db
    .select({
      id: revenues.id,
      source: revenues.source,
      date: revenues.date,
      description: revenues.description,
      netAmount: revenues.netAmount,
      payerName: revenues.payerName,
      receivedByName: members.name,
    })
    .from(revenues)
    .leftJoin(members, eq(revenues.receivedBy, members.id))
    .where(and(gte(revenues.date, start), lte(revenues.date, end)))
    .orderBy(desc(revenues.date));

  const compensationRows = await db
    .select({
      id: compensationPayments.id,
      date: compensationPayments.date,
      amount: compensationPayments.amount,
      fromMemberId: compensationPayments.fromMemberId,
      toMemberId: compensationPayments.toMemberId,
      notes: compensationPayments.notes,
    })
    .from(compensationPayments)
    .where(and(gte(compensationPayments.date, start), lte(compensationPayments.date, end)))
    .orderBy(desc(compensationPayments.date));

  const allMembers = await db.select({ id: members.id, name: members.name }).from(members).orderBy(asc(members.name));

  const opexTotal = expensesRows.filter((row) => row.nature === "OPEX").reduce((acc, row) => acc + row.amount, 0);
  const capexTotal = expensesRows.filter((row) => row.nature === "CAPEX").reduce((acc, row) => acc + row.amount, 0);
  const revenuesTotal = revenuesRows.reduce((acc, row) => acc + row.netAmount, 0);
  const netResult = revenuesTotal - (opexTotal + capexTotal);

  const monthlyMap = new Map<string, { month: string; opex: number; capex: number; revenues: number }>();
  for (let monthIdx = 1; monthIdx <= 12; monthIdx += 1) {
    const month = `${year}-${String(monthIdx).padStart(2, "0")}`;
    monthlyMap.set(month, { month, opex: 0, capex: 0, revenues: 0 });
  }
  for (const row of expensesRows) {
    const key = row.date.slice(0, 7);
    const current = monthlyMap.get(key);
    if (!current) continue;
    if (row.nature === "OPEX") current.opex += row.amount;
    else current.capex += row.amount;
  }
  for (const row of revenuesRows) {
    const key = row.date.slice(0, 7);
    const current = monthlyMap.get(key);
    if (!current) continue;
    current.revenues += row.netAmount;
  }

  const memberDistribution = allMembers.map((member) => {
    const paid = expensesRows.filter((row) => row.paidByName === member.name).reduce((acc, row) => acc + row.amount, 0);
    const received = revenuesRows.filter((row) => row.receivedByName === member.name).reduce((acc, row) => acc + row.netAmount, 0);
    return {
      memberId: member.id,
      memberName: member.name,
      paid,
      received,
      net: paid - received,
    };
  });

  return {
    year,
    summary: {
      opexTotal,
      capexTotal,
      revenuesTotal,
      netResult,
    },
    monthly: Array.from(monthlyMap.values()),
    memberDistribution,
    expenses: expensesRows,
    revenues: revenuesRows,
    compensations: compensationRows.map((row) => ({
      ...row,
      fromMemberName: allMembers.find((member) => member.id === row.fromMemberId)?.name ?? "N/A",
      toMemberName: allMembers.find((member) => member.id === row.toMemberId)?.name ?? "N/A",
    })),
  };
}

export async function getFinanceReportingSummaryForCron(year = new Date().getFullYear(), month: string) {
  const start = `${month}-01`;
  const end = `${month}-31`;
  const expenseRows = await db
    .select({
      nature: expenses.nature,
      amount: expenses.amount,
    })
    .from(expenses)
    .where(and(gte(expenses.date, start), lte(expenses.date, end)));

  const revenueRows = await db
    .select({
      amount: revenues.netAmount,
    })
    .from(revenues)
    .where(and(gte(revenues.date, start), lte(revenues.date, end)));

  const opex = expenseRows.filter((row) => row.nature === "OPEX").reduce((acc, row) => acc + row.amount, 0);
  const capex = expenseRows.filter((row) => row.nature === "CAPEX").reduce((acc, row) => acc + row.amount, 0);
  const revenuesTotal = revenueRows.reduce((acc, row) => acc + row.amount, 0);

  return {
    year,
    month,
    opex,
    capex,
    revenues: revenuesTotal,
    net: revenuesTotal - (opex + capex),
  };
}
