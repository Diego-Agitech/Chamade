import { and, count, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { expenses, members, revenues, stays, todos } from "@/lib/db/schema";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
}

function yearBounds(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export async function getDashboardData(year = new Date().getFullYear()) {
  await requireSession();
  const { start, end } = yearBounds(year);
  const today = new Date().toISOString().slice(0, 10);

  const [
    [totalTodos],
    [openTodos],
    [overdueTodos],
    [yearStays],
    [rentalStays],
    upcomingStays,
    upcomingTodos,
    totalExpenseAmount,
    totalRevenueAmount,
  ] = await Promise.all([
    db.select({ total: count(todos.id) }).from(todos),
    db.select({ total: count(todos.id) }).from(todos).where(eq(todos.isDone, false)),
    db
      .select({ total: count(todos.id) })
      .from(todos)
      .where(and(eq(todos.isDone, false), lte(todos.dueDate, today))),
    db
      .select({ total: count(stays.id) })
      .from(stays)
      .where(and(gte(stays.startDate, start), lte(stays.startDate, end))),
    db
      .select({ total: count(stays.id) })
      .from(stays)
      .where(and(gte(stays.startDate, start), lte(stays.startDate, end), eq(stays.isRental, true))),
    db
      .select({
        id: stays.id,
        startDate: stays.startDate,
        endDate: stays.endDate,
        isRental: stays.isRental,
        guestName: stays.rentalGuestName,
        memberName: members.name,
      })
      .from(stays)
      .leftJoin(members, eq(stays.memberId, members.id))
      .where(gte(stays.startDate, today))
      .limit(6),
    db
      .select({
        id: todos.id,
        title: todos.title,
        dueDate: todos.dueDate,
        priority: todos.priority,
        assignedName: members.name,
      })
      .from(todos)
      .leftJoin(members, eq(todos.assignedTo, members.id))
      .where(eq(todos.isDone, false))
      .limit(8),
    db
      .select({
        total: expenses.amount,
      })
      .from(expenses)
      .where(and(gte(expenses.date, start), lte(expenses.date, end))),
    db
      .select({
        total: revenues.netAmount,
      })
      .from(revenues)
      .where(and(gte(revenues.date, start), lte(revenues.date, end))),
  ]);

  const expenseSum = totalExpenseAmount.reduce((acc, row) => acc + row.total, 0);
  const revenueSum = totalRevenueAmount.reduce((acc, row) => acc + row.total, 0);

  return {
    year,
    kpis: {
      todosTotal: totalTodos?.total ?? 0,
      todosOpen: openTodos?.total ?? 0,
      todosOverdue: overdueTodos?.total ?? 0,
      staysTotal: yearStays?.total ?? 0,
      staysRental: rentalStays?.total ?? 0,
      financeNet: revenueSum - expenseSum,
    },
    upcomingStays,
    upcomingTodos,
  };
}
