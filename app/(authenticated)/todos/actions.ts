"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createTodo, deleteTodo, toggleTodo, type TodoPriority } from "@/lib/db/todos";

const createTodoSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function createTodoAction(formData: FormData) {
  const parsed = createTodoSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: (formData.get("priority") || "medium") as TodoPriority,
    assignedTo: formData.get("assignedTo") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid todo form.");
  }

  await createTodo(parsed.data);
  revalidatePath("/todos");
}

export async function toggleTodoAction(formData: FormData) {
  const todoId = String(formData.get("todoId") || "");
  const isDone = String(formData.get("isDone") || "false") === "true";

  if (!todoId) {
    throw new Error("Missing todoId.");
  }

  await toggleTodo(todoId, isDone);
  revalidatePath("/todos");
}

export async function deleteTodoAction(formData: FormData) {
  const todoId = String(formData.get("todoId") || "");
  if (!todoId) {
    throw new Error("Missing todoId.");
  }

  await deleteTodo(todoId);
  revalidatePath("/todos");
}
