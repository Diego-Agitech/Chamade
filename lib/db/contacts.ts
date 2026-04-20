import { asc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { keyContacts } from "@/lib/db/schema";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
}

async function nextSortOrder() {
  const rows = await db.select({ max: sql<number>`coalesce(max(${keyContacts.sortOrder}), -1)` }).from(keyContacts);
  return (rows[0]?.max ?? -1) + 1;
}

function isMissingTableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("no such table") || message.includes("key_contacts");
}

export async function getActiveKeyContacts() {
  await requireSession();
  try {
    return await db
      .select({
        id: keyContacts.id,
        name: keyContacts.name,
        role: keyContacts.role,
        phone: keyContacts.phone,
        email: keyContacts.email,
        serviceZone: keyContacts.serviceZone,
        notes: keyContacts.notes,
        isEmergency: keyContacts.isEmergency,
      })
      .from(keyContacts)
      .where(eq(keyContacts.isActive, true))
      .orderBy(asc(keyContacts.sortOrder), asc(keyContacts.name));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function getAllKeyContacts() {
  await requireSession();
  try {
    return await db
      .select()
      .from(keyContacts)
      .orderBy(asc(keyContacts.sortOrder), asc(keyContacts.name));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function createKeyContact(input: {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  serviceZone?: string;
  notes?: string;
  isEmergency?: boolean;
}) {
  await requireSession();
  const sortOrder = await nextSortOrder();
  await db.insert(keyContacts).values({
    name: input.name,
    role: input.role,
    phone: input.phone || null,
    email: input.email || null,
    serviceZone: input.serviceZone || null,
    notes: input.notes || null,
    isEmergency: input.isEmergency ?? false,
    isActive: true,
    sortOrder,
  });
}

export async function updateKeyContact(
  id: string,
  input: {
    name: string;
    role: string;
    phone?: string;
    email?: string;
    serviceZone?: string;
    notes?: string;
    isEmergency?: boolean;
    isActive?: boolean;
  }
) {
  await requireSession();
  await db
    .update(keyContacts)
    .set({
      name: input.name,
      role: input.role,
      phone: input.phone || null,
      email: input.email || null,
      serviceZone: input.serviceZone || null,
      notes: input.notes || null,
      isEmergency: input.isEmergency ?? false,
      isActive: input.isActive ?? true,
    })
    .where(eq(keyContacts.id, id));
}

export async function deleteKeyContact(id: string) {
  await requireSession();
  await db.delete(keyContacts).where(eq(keyContacts.id, id));
}
