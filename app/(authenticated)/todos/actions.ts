"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { createTodo, deleteTodo, toggleTodo, updateTodoStatus, type TodoPriority, type TodoStatus } from "@/lib/db/todos";
import { sendTodoAssignedEmail } from "@/lib/notifications/send";

const createTodoSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

async function toAttachmentDataUrl(file: File | null) {
  if (!file || file.size === 0) return undefined;
  if (!file.type.startsWith("image/")) {
    throw new Error("La pièce jointe doit être une image.");
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Image trop lourde (max 4MB).");
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function createTodoAction(formData: FormData) {
  const session = await auth();
  const parsed = createTodoSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: (formData.get("priority") || "medium") as TodoPriority,
    status: (formData.get("status") || "todo") as TodoStatus,
    assignedTo: formData.get("assignedTo") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid todo form.");
  }

  const attachment = formData.get("attachment");
  const attachmentDataUrl = await toAttachmentDataUrl(attachment instanceof File ? attachment : null);

  await createTodo({
    ...parsed.data,
    attachmentDataUrl,
  });

  if (parsed.data.assignedTo) {
    const assignee = await db.query.members.findFirst({
      where: eq(members.id, parsed.data.assignedTo),
      columns: {
        email: true,
        name: true,
        notifyOnTodoAssigned: true,
      },
    });
    if (assignee?.notifyOnTodoAssigned && assignee.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://gestion.lachamade.be";
      await sendTodoAssignedEmail({
        email: assignee.email,
        assigneeName: assignee.name,
        assignedByName: session?.user?.name ?? "Membre",
        title: parsed.data.title,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate,
        status: parsed.data.status,
        todosUrl: `${appUrl}/todos`,
      });
    }
  }
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

export async function updateTodoStatusAction(formData: FormData) {
  const todoId = String(formData.get("todoId") || "");
  const status = String(formData.get("status") || "todo") as TodoStatus;

  if (!todoId) {
    throw new Error("Missing todoId.");
  }

  if (!["todo", "in_progress", "done"].includes(status)) {
    throw new Error("Invalid todo status.");
  }

  await updateTodoStatus(todoId, status);
  revalidatePath("/todos");
}
