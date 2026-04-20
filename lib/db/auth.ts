import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/hash";
import { buildPasswordResetExpiry, buildPasswordResetToken, isTokenExpired } from "@/lib/auth/tokens";
import { members, passwordResetTokens } from "@/lib/db/schema";

export async function getMemberByEmail(email: string) {
  return db.query.members.findFirst({
    where: eq(members.email, email),
  });
}

export async function getMemberById(id: string) {
  return db.query.members.findFirst({
    where: eq(members.id, id),
  });
}

export async function getLoginProfiles() {
  try {
    const rows = await db.query.members.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        color: true,
        emoji: true,
      },
      orderBy: (table, { asc }) => [asc(table.name)],
    });

    return rows
      .filter((row) => row.name?.trim().toLowerCase() !== "chrispadi sci")
      .map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        color: row.color,
        emoji: row.emoji,
      }));
  } catch (error) {
    console.error("[Auth] Failed to load login profiles", error);
    return [];
  }
}

export async function updateLastLoginAt(memberId: string) {
  await db
    .update(members)
    .set({
      lastLoginAt: new Date().toISOString(),
    })
    .where(eq(members.id, memberId));
}

export async function createPasswordResetToken(email: string) {
  const member = await getMemberByEmail(email);

  if (!member) {
    return null;
  }

  const token = buildPasswordResetToken();
  const expiresAt = buildPasswordResetExpiry(1);

  await db.insert(passwordResetTokens).values({
    memberId: member.id,
    token,
    expiresAt,
  });

  return {
    token,
    memberId: member.id,
    email: member.email,
    name: member.name,
    expiresAt,
  };
}

export async function getValidPasswordResetToken(token: string) {
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(eq(passwordResetTokens.token, token), isNull(passwordResetTokens.usedAt)),
  });

  if (!resetToken) {
    return null;
  }

  const isExpired = isTokenExpired(resetToken.expiresAt);
  if (isExpired) {
    return null;
  }

  return resetToken;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const validToken = await getValidPasswordResetToken(token);
  if (!validToken) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  const newHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx
      .update(members)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
      })
      .where(eq(members.id, validToken.memberId));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.id, validToken.id));
  });

  return { ok: true as const };
}

export async function changePassword({
  memberId,
  currentPassword,
  newPassword,
}: {
  memberId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const member = await db.query.members.findFirst({
    where: eq(members.id, memberId),
  });

  if (!member) {
    return { ok: false as const, reason: "member_not_found" as const };
  }

  const matchesCurrent = await verifyPassword(currentPassword, member.passwordHash);
  if (!matchesCurrent) {
    return { ok: false as const, reason: "invalid_current_password" as const };
  }

  const samePassword = await verifyPassword(newPassword, member.passwordHash);
  if (samePassword) {
    return { ok: false as const, reason: "same_password" as const };
  }

  const newHash = await hashPassword(newPassword);

  await db
    .update(members)
    .set({
      passwordHash: newHash,
      mustChangePassword: false,
    })
    .where(eq(members.id, member.id));

  return { ok: true as const };
}
