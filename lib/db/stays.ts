import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { members, revenues, stays } from "@/lib/db/schema";

function toDateValue(dateText: string) {
  return new Date(`${dateText}T00:00:00.000Z`).getTime();
}

function hasOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const startA = toDateValue(aStart);
  const endA = toDateValue(aEnd);
  const startB = toDateValue(bStart);
  const endB = toDateValue(bEnd);

  return startA <= endB && startB <= endA;
}

async function requireSessionMember() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getAgendaPageData() {
  const sessionUser = await requireSessionMember();

  const [allMembers, stayRows] = await Promise.all([
    db
      .select({
        id: members.id,
        name: members.name,
        color: members.color,
      })
      .from(members)
      .orderBy(asc(members.name)),
    db
      .select({
        id: stays.id,
        memberId: stays.memberId,
        memberName: members.name,
        memberColor: members.color,
        startDate: stays.startDate,
        endDate: stays.endDate,
        isRental: stays.isRental,
        rentalGuestName: stays.rentalGuestName,
        notes: stays.notes,
        createdAt: stays.createdAt,
      })
      .from(stays)
      .leftJoin(members, eq(stays.memberId, members.id))
      .orderBy(desc(stays.startDate), desc(stays.createdAt)),
  ]);

  const stayIds = stayRows.map((stay) => stay.id);
  const revenueRows = stayIds.length
    ? await db
        .select({
          relatedStayId: revenues.relatedStayId,
          netTotal: sql<number>`sum(${revenues.netAmount})`,
          grossTotal: sql<number>`sum(${revenues.grossAmount})`,
          deductionsTotal: sql<number>`sum(${revenues.deductions})`,
        })
        .from(revenues)
        .where(and(inArray(revenues.relatedStayId, stayIds), eq(revenues.source, "rental")))
        .groupBy(revenues.relatedStayId)
    : [];

  const revenueByStayId = new Map(
    revenueRows
      .filter((row) => row.relatedStayId)
      .map((row) => [
        row.relatedStayId as string,
        {
          net: row.netTotal ?? 0,
          gross: row.grossTotal ?? 0,
          deductions: row.deductionsTotal ?? 0,
        },
      ])
  );

  const overlappingStayIds = new Set<string>();

  for (let i = 0; i < stayRows.length; i += 1) {
    for (let j = i + 1; j < stayRows.length; j += 1) {
      const a = stayRows[i];
      const b = stayRows[j];
      if (hasOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
        overlappingStayIds.add(a.id);
        overlappingStayIds.add(b.id);
      }
    }
  }

  return {
    currentMemberId: sessionUser.id,
    members: allMembers,
    stays: stayRows.map((stay) => ({
      ...stay,
      hasOverlap: overlappingStayIds.has(stay.id),
      revenue: revenueByStayId.get(stay.id) ?? null,
    })),
  };
}

export async function createStay(input: {
  memberId?: string;
  startDate: string;
  endDate: string;
  isRental: boolean;
  rentalGuestName?: string;
  notes?: string;
}) {
  const sessionUser = await requireSessionMember();

  const [created] = await db
    .insert(stays)
    .values({
      memberId: input.isRental ? null : (input.memberId || null),
      startDate: input.startDate,
      endDate: input.endDate,
      isRental: input.isRental,
      rentalGuestName: input.rentalGuestName || null,
      notes: input.notes || null,
      createdBy: sessionUser.id,
    })
    .returning({ id: stays.id });

  return created.id;
}

export async function createRentalRevenueFromStay(input: {
  stayId: string;
  netAmount: number;
  receivedBy?: string;
  description?: string;
  date: string;
  payerName?: string;
}) {
  await requireSessionMember();

  await db.insert(revenues).values({
    source: "rental",
    subcategory: "direct",
    grossAmount: input.netAmount,
    deductions: 0,
    netAmount: input.netAmount,
    description: input.description || "Revenu location",
    date: input.date,
    receivedBy: input.receivedBy || null,
    payerName: input.payerName || null,
    relatedStayId: input.stayId,
  });
}

export async function updateStay(
  stayId: string,
  input: {
    memberId?: string;
    startDate: string;
    endDate: string;
    isRental: boolean;
    rentalGuestName?: string;
    notes?: string;
  }
) {
  await requireSessionMember();

  await db
    .update(stays)
    .set({
      memberId: input.isRental ? null : (input.memberId || null),
      startDate: input.startDate,
      endDate: input.endDate,
      isRental: input.isRental,
      rentalGuestName: input.rentalGuestName || null,
      notes: input.notes || null,
    })
    .where(eq(stays.id, stayId));
}

export async function deleteStay(stayId: string) {
  await requireSessionMember();
  await db.delete(stays).where(eq(stays.id, stayId));
}

export async function getStayById(stayId: string) {
  await requireSessionMember();
  const row = await db.query.stays.findFirst({
    where: and(eq(stays.id, stayId)),
  });
  return row ?? null;
}
