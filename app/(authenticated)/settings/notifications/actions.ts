"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { type NotificationSettings, updateNotificationSettings } from "@/lib/db/settings";
import { sendTestNotificationEmail } from "@/lib/notifications/send";

const preferenceKeySchema = z.enum([
  "notifyOnNewStay",
  "notifyOnOverlap",
  "notifyOnTodoAssigned",
  "notifyOnNewExpense",
  "notifyMonthlyFinanceReport",
  "notifyWeeklyDigest",
]);

const updatePreferenceSchema = z.object({
  key: preferenceKeySchema,
  enabled: z.boolean(),
});

export type UpdateNotificationPreferenceResult = {
  ok: boolean;
  error?: string;
};

export async function updateNotificationPreferenceAction(
  input: unknown
): Promise<UpdateNotificationPreferenceResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }

  const parsed = updatePreferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Préférence invalide." };
  }

  const payload: Partial<NotificationSettings> = {
    [parsed.data.key]: parsed.data.enabled,
  };

  await updateNotificationSettings(payload);
  revalidatePath("/settings/notifications");

  return { ok: true };
}

export type SendTestNotificationEmailResult = {
  ok: boolean;
  simulated?: boolean;
  message?: string;
  error?: string;
};

export async function sendTestNotificationEmailAction(): Promise<SendTestNotificationEmailResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: "Session invalide ou email manquant." };
  }

  const result = await sendTestNotificationEmail({
    email: session.user.email,
    name: session.user.name ?? "Membre",
  });

  return {
    ok: true,
    simulated: result.simulated,
    message: result.simulated
      ? "Email test simulé (Resend non configuré)."
      : "Email test déclenché via le mécanisme de notification.",
  };
}
