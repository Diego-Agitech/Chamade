"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createRentalRevenueFromStay, createStay, deleteStay, updateStay } from "@/lib/db/stays";

const staySchema = z
  .object({
    memberId: z.string().optional(),
    startDate: z.string().min(1, "Date de début requise."),
    endDate: z.string().min(1, "Date de fin requise."),
    isRental: z.boolean(),
    rentalGuestName: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "La date de fin doit être après la date de début.",
    path: ["endDate"],
  });

const rentalRevenueSchema = z.object({
  netAmount: z.number().nonnegative().optional(),
});

function parseStayForm(formData: FormData) {
  const parsed = staySchema.parse({
    memberId: String(formData.get("memberId") || "") || undefined,
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    isRental: String(formData.get("isRental") || "") === "on",
    rentalGuestName: String(formData.get("rentalGuestName") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
  });
  return {
    ...parsed,
    // Règle métier: un séjour location n'est lié à aucun membre.
    memberId: parsed.isRental ? undefined : parsed.memberId,
  };
}

export async function createStayAction(formData: FormData) {
  const parsed = parseStayForm(formData);
  const createdStayId = await createStay(parsed);

  const revenueParsed = rentalRevenueSchema.parse({
    netAmount: formData.get("netAmount") ? Number(formData.get("netAmount")) : undefined,
  });

  if (parsed.isRental && typeof revenueParsed.netAmount === "number" && revenueParsed.netAmount > 0) {
    await createRentalRevenueFromStay({
      stayId: createdStayId,
      netAmount: revenueParsed.netAmount,
      date: parsed.endDate,
    });
  }
  revalidatePath("/agenda");
}

export async function updateStayAction(formData: FormData) {
  const stayId = String(formData.get("stayId") || "");
  if (!stayId) {
    throw new Error("Missing stay id.");
  }

  const parsed = parseStayForm(formData);
  await updateStay(stayId, parsed);
  revalidatePath("/agenda");
}

export async function deleteStayAction(formData: FormData) {
  const stayId = String(formData.get("stayId") || "");
  if (!stayId) {
    throw new Error("Missing stay id.");
  }

  await deleteStay(stayId);
  revalidatePath("/agenda");
}
