"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { members, stays } from "@/lib/db/schema";
import { createRentalRevenueFromStay, createStay, deleteStay, updateStay } from "@/lib/db/stays";
import { sendNewStayEmail, sendStayOverlapEmail } from "@/lib/notifications/send";

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

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

async function notifyStayChanges({
  stayId,
  startDate,
  endDate,
  isRental,
  memberId,
  rentalGuestName,
  notes,
  actorName,
}: {
  stayId: string;
  startDate: string;
  endDate: string;
  isRental: boolean;
  memberId?: string;
  rentalGuestName?: string;
  notes?: string;
  actorName: string;
}) {
  const [recipients, member, conflictingStays] = await Promise.all([
    db
      .select({ email: members.email, name: members.name })
      .from(members)
      .where(eq(members.notifyOnNewStay, true)),
    memberId
      ? db.query.members.findFirst({
          where: eq(members.id, memberId),
          columns: { name: true },
        })
      : Promise.resolve(null),
    db
      .select({
        startDate: stays.startDate,
        endDate: stays.endDate,
        rentalGuestName: stays.rentalGuestName,
        memberName: members.name,
      })
      .from(stays)
      .leftJoin(members, eq(stays.memberId, members.id))
      .where(and(ne(stays.id, stayId))),
  ]);

  const conflicts = conflictingStays
    .filter((row) => overlaps(startDate, endDate, row.startDate, row.endDate))
    .map((row) => `${row.startDate} -> ${row.endDate} (${row.memberName ?? row.rentalGuestName ?? "Sejour"})`);

  const personLabel = isRental ? rentalGuestName || "Location" : member?.name ?? "Famille";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://gestion.lachamade.be";
  await Promise.all(
    recipients.map((recipient) =>
      sendNewStayEmail({
        email: recipient.email,
        recipientName: recipient.name,
        createdByName: actorName,
        stayType: isRental ? "Location" : "Famille",
        personLabel,
        startDate,
        endDate,
        notes,
        agendaUrl: `${appUrl}/agenda`,
      })
    )
  );

  if (conflicts.length > 0) {
    const overlapRecipients = await db
      .select({ email: members.email, name: members.name })
      .from(members)
      .where(eq(members.notifyOnOverlap, true));
    await Promise.all(
      overlapRecipients.map((recipient) =>
        sendStayOverlapEmail({
          email: recipient.email,
          recipientName: recipient.name,
          createdByName: actorName,
          startDate,
          endDate,
          conflicts,
          agendaUrl: `${appUrl}/agenda`,
        })
      )
    );
  }
}

export async function createStayAction(formData: FormData) {
  const parsed = parseStayForm(formData);
  const session = await auth();
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

  await notifyStayChanges({
    stayId: createdStayId,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    isRental: parsed.isRental,
    memberId: parsed.memberId,
    rentalGuestName: parsed.rentalGuestName,
    notes: parsed.notes,
    actorName: session?.user?.name ?? "Membre",
  });
  revalidatePath("/agenda");
}

export async function updateStayAction(formData: FormData) {
  const stayId = String(formData.get("stayId") || "");
  if (!stayId) {
    throw new Error("Missing stay id.");
  }

  const parsed = parseStayForm(formData);
  await updateStay(stayId, parsed);
  const session = await auth();
  await notifyStayChanges({
    stayId,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    isRental: parsed.isRental,
    memberId: parsed.memberId,
    rentalGuestName: parsed.rentalGuestName,
    notes: parsed.notes,
    actorName: session?.user?.name ?? "Membre",
  });
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
