import { and, asc, count, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { members, todoCategories, todos } from "@/lib/db/schema";

export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "todo" | "in_progress" | "done";

function isMissingTodoStatusColumnError(error: unknown) {
  const chunks: string[] = [];

  const pushText = (value: unknown) => {
    if (typeof value === "string") {
      chunks.push(value.toLowerCase());
    }
  };

  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (value instanceof Error) {
      pushText(value.message);
      walk((value as { cause?: unknown }).cause);
    }

    const record = value as Record<string, unknown>;
    pushText(record.message);

    if (record.proto && typeof record.proto === "object") {
      const proto = record.proto as Record<string, unknown>;
      pushText(proto.message);
    }

    walk(record.cause);
  };

  walk(error);
  const fullMessage = chunks.join(" ");
  return fullMessage.includes("no such column") && fullMessage.includes("todos.status");
}

async function requireSessionMember() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getTodosPageData(
  selectedCategoryId?: string,
  filters?: { assignedTo?: string; status?: "all" | "open" | "done" | "overdue" }
) {
  await requireSessionMember();

  const categories = await db
    .select({
      id: todoCategories.id,
      name: todoCategories.name,
      icon: todoCategories.icon,
      color: todoCategories.color,
      sortOrder: todoCategories.sortOrder,
    })
    .from(todoCategories)
    .orderBy(asc(todoCategories.sortOrder), asc(todoCategories.name));

  const categoryIds = categories.map((category) => category.id);
  const categoryCounts = categoryIds.length
    ? await db
        .select({
          categoryId: todos.categoryId,
          total: count(todos.id),
          open: sql<number>`sum(case when ${todos.isDone} = 0 then 1 else 0 end)`,
        })
        .from(todos)
        .where(inArray(todos.categoryId, categoryIds))
        .groupBy(todos.categoryId)
    : [];

  const countsByCategory = new Map(
    categoryCounts
      .filter((row) => row.categoryId)
      .map((row) => [row.categoryId as string, { total: row.total, open: row.open ?? 0 }])
  );

  const selected = selectedCategoryId ?? categories[0]?.id;
  const activeStatus = filters?.status ?? "all";
  const today = new Date().toISOString().slice(0, 10);
  const todoFilters = [
    selected ? eq(todos.categoryId, selected) : undefined,
    filters?.assignedTo ? eq(todos.assignedTo, filters.assignedTo) : undefined,
    activeStatus === "open" ? eq(todos.isDone, false) : undefined,
    activeStatus === "done" ? eq(todos.isDone, true) : undefined,
    activeStatus === "overdue" ? and(eq(todos.isDone, false), isNotNull(todos.dueDate), lt(todos.dueDate, today)) : undefined,
  ].filter((condition) => Boolean(condition));

  const fetchTodosWithStatus = async () =>
    db
      .select({
        id: todos.id,
        title: todos.title,
        description: todos.description,
        isDone: todos.isDone,
        status: sql<TodoStatus>`coalesce(${todos.status}, 'todo')`,
        priority: todos.priority,
        dueDate: todos.dueDate,
        assignedTo: todos.assignedTo,
        assignedName: members.name,
        assignedColor: members.color,
        createdAt: todos.createdAt,
      })
      .from(todos)
      .leftJoin(members, eq(todos.assignedTo, members.id))
      .where(todoFilters.length > 0 ? and(...todoFilters) : undefined)
      .orderBy(
        asc(todos.isDone),
        sql`case ${todos.priority} when 'high' then 0 when 'medium' then 1 else 2 end`,
        asc(todos.dueDate),
        desc(todos.createdAt)
      );

  const fetchTodosLegacy = async () =>
    db
      .select({
        id: todos.id,
        title: todos.title,
        description: todos.description,
        isDone: todos.isDone,
        priority: todos.priority,
        dueDate: todos.dueDate,
        assignedTo: todos.assignedTo,
        assignedName: members.name,
        assignedColor: members.color,
        createdAt: todos.createdAt,
      })
      .from(todos)
      .leftJoin(members, eq(todos.assignedTo, members.id))
      .where(todoFilters.length > 0 ? and(...todoFilters) : undefined)
      .orderBy(
        asc(todos.isDone),
        sql`case ${todos.priority} when 'high' then 0 when 'medium' then 1 else 2 end`,
        asc(todos.dueDate),
        desc(todos.createdAt)
      );

  let todosRows: Array<{
    id: string;
    title: string;
    description: string | null;
    isDone: boolean | null;
    status: TodoStatus;
    priority: TodoPriority | null;
    dueDate: string | null;
    assignedTo: string | null;
    assignedName: string | null;
    assignedColor: string | null;
    createdAt: string | null;
  }> = [];

  if (selected) {
    try {
      todosRows = await fetchTodosWithStatus();
    } catch (error) {
      if (!isMissingTodoStatusColumnError(error)) {
        throw error;
      }
      const legacyRows = await fetchTodosLegacy();
      todosRows = legacyRows.map((row) => ({
        ...row,
        status: row.isDone ? "done" : "todo",
      }));
    }
  }

  const allMembers = await db
    .select({
      id: members.id,
      name: members.name,
      color: members.color,
    })
    .from(members)
    .orderBy(asc(members.name));

  const memberBreakdownRows = await db
    .select({
      memberId: members.id,
      memberName: members.name,
      memberColor: members.color,
      total: count(todos.id),
      open: sql<number>`sum(case when ${todos.isDone} = 0 then 1 else 0 end)`,
      done: sql<number>`sum(case when ${todos.isDone} = 1 then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${todos.isDone} = 0 and ${todos.dueDate} is not null and ${todos.dueDate} < ${today} then 1 else 0 end)`,
    })
    .from(members)
    .leftJoin(todos, eq(todos.assignedTo, members.id))
    .groupBy(members.id, members.name, members.color)
    .orderBy(asc(members.name));

  return {
    categories: categories.map((category) => ({
      ...category,
      counts: countsByCategory.get(category.id) ?? { total: 0, open: 0 },
    })),
    selectedCategoryId: selected,
    activeFilters: {
      assignedTo: filters?.assignedTo ?? "",
      status: activeStatus,
    },
    todos: todosRows,
    members: allMembers,
    memberBreakdown: memberBreakdownRows.map((row) => ({
      memberId: row.memberId,
      memberName: row.memberName,
      memberColor: row.memberColor,
      total: row.total,
      open: row.open ?? 0,
      done: row.done ?? 0,
      overdue: row.overdue ?? 0,
    })),
  };
}

export async function createTodo(input: {
  categoryId: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  assignedTo?: string;
  dueDate?: string;
}) {
  const sessionUser = await requireSessionMember();

  const values = {
    categoryId: input.categoryId,
    title: input.title,
    description: input.description || null,
    priority: input.priority,
    status: input.status,
    isDone: input.status === "done",
    completedAt: input.status === "done" ? new Date().toISOString() : null,
    createdBy: sessionUser.id,
    assignedTo: input.assignedTo || null,
    dueDate: input.dueDate || null,
  };

  try {
    await db.insert(todos).values(values);
  } catch (error) {
    if (!isMissingTodoStatusColumnError(error)) {
      throw error;
    }
    await db.insert(todos).values({
      categoryId: values.categoryId,
      title: values.title,
      description: values.description,
      priority: values.priority,
      isDone: values.isDone,
      completedAt: values.completedAt,
      createdBy: values.createdBy,
      assignedTo: values.assignedTo,
      dueDate: values.dueDate,
    });
  }
}

export async function toggleTodo(todoId: string, isDone: boolean) {
  await requireSessionMember();

  try {
    await db
      .update(todos)
      .set({
        isDone,
        status: isDone ? "done" : "todo",
        completedAt: isDone ? new Date().toISOString() : null,
      })
      .where(eq(todos.id, todoId));
  } catch (error) {
    if (!isMissingTodoStatusColumnError(error)) {
      throw error;
    }
    await db
      .update(todos)
      .set({
        isDone,
        completedAt: isDone ? new Date().toISOString() : null,
      })
      .where(eq(todos.id, todoId));
  }
}

export async function updateTodoStatus(todoId: string, status: TodoStatus) {
  await requireSessionMember();

  const isDone = status === "done";
  try {
    await db
      .update(todos)
      .set({
        status,
        isDone,
        completedAt: isDone ? new Date().toISOString() : null,
      })
      .where(eq(todos.id, todoId));
  } catch (error) {
    if (!isMissingTodoStatusColumnError(error)) {
      throw error;
    }
    await db
      .update(todos)
      .set({
        isDone,
        completedAt: isDone ? new Date().toISOString() : null,
      })
      .where(eq(todos.id, todoId));
  }
}

export async function deleteTodo(todoId: string) {
  await requireSessionMember();

  await db.delete(todos).where(eq(todos.id, todoId));
}

export async function moveTodo(todoId: string, categoryId: string) {
  await requireSessionMember();

  await db
    .update(todos)
    .set({
      categoryId,
    })
    .where(and(eq(todos.id, todoId), eq(todos.isDone, false)));
}
