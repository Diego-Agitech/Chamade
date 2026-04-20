"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createKeyContact, deleteKeyContact, updateKeyContact } from "@/lib/db/contacts";

const contactSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  serviceZone: z.string().optional(),
  notes: z.string().optional(),
  isEmergency: z.boolean().optional(),
});

export async function createKeyContactAction(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    serviceZone: formData.get("serviceZone"),
    notes: formData.get("notes"),
    isEmergency: formData.get("isEmergency") === "on",
  });
  if (!parsed.success) {
    throw new Error("Contact invalide");
  }
  await createKeyContact(parsed.data);
  revalidatePath("/settings/contacts");
  revalidatePath("/dashboard");
}

export async function updateKeyContactAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Contact manquant");
  const parsed = contactSchema.extend({ isActive: z.boolean().optional() }).safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    serviceZone: formData.get("serviceZone"),
    notes: formData.get("notes"),
    isEmergency: formData.get("isEmergency") === "on",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) throw new Error("Contact invalide");
  await updateKeyContact(id, parsed.data);
  revalidatePath("/settings/contacts");
  revalidatePath("/dashboard");
}

export async function deleteKeyContactAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Contact manquant");
  await deleteKeyContact(id);
  revalidatePath("/settings/contacts");
  revalidatePath("/dashboard");
}
