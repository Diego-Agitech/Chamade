import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { MonthlyFinanceReportEmail, NotificationTestEmail, PasswordResetEmail, WeeklyDigestEmail } from "@/emails/templates";
import { db } from "@/lib/db";
import { members, notificationLog } from "@/lib/db/schema";

type NotificationType = "password_reset" | "notification_test" | "weekly_digest" | "monthly_finance_report";

type PasswordResetPayload = {
  email: string;
  resetUrl: string;
};

type NotificationSendResult = {
  simulated: boolean;
  ok: boolean;
};

async function logNotification({
  email,
  type,
  success,
}: {
  email: string;
  type: NotificationType;
  success: boolean;
}) {
  const member = await db.query.members.findFirst({
    where: eq(members.email, email),
    columns: { id: true },
  });
  await db.insert(notificationLog).values({
    memberId: member?.id ?? null,
    type,
    success,
  });
}

async function sendWithResend({
  email,
  subject,
  html,
  type,
}: {
  email: string;
  subject: string;
  html: string;
  type: NotificationType;
}): Promise<NotificationSendResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.info(`[Notification][SIMULATED] to=${email} subject="${subject}"`);
    await logNotification({ email, type, success: true });
    return { simulated: true, ok: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject,
    html,
  });
  const success = !result.error;
  await logNotification({ email, type, success });
  return { simulated: false, ok: success };
}

export async function sendPasswordResetEmail({ email, resetUrl }: PasswordResetPayload) {
  return sendWithResend({
    email,
    subject: "Réinitialisation de mot de passe",
    html: await render(PasswordResetEmail({ resetUrl })),
    type: "password_reset",
  });
}

export async function sendTestNotificationEmail({ email, name }: { email: string; name: string }) {
  return sendWithResend({
    email,
    subject: "Email de test - Notifications Chamade",
    html: await render(NotificationTestEmail({ name })),
    type: "notification_test",
  });
}

export async function sendWeeklyDigestEmail({ email, lines }: { email: string; lines: string[] }) {
  return sendWithResend({
    email,
    subject: "Résumé hebdomadaire Chamade",
    html: await render(WeeklyDigestEmail({ lines })),
    type: "weekly_digest",
  });
}

export async function sendMonthlyFinanceReportEmail({
  email,
  yearMonth,
  summary,
}: {
  email: string;
  yearMonth: string;
  summary: string;
}) {
  return sendWithResend({
    email,
    subject: `Rapport financier ${yearMonth}`,
    html: await render(MonthlyFinanceReportEmail({ yearMonth, summary })),
    type: "monthly_finance_report",
  });
}
