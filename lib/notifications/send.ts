import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import {
  MonthlyFinanceReportEmail,
  NewExpenseEmail,
  NewStayEmail,
  NotificationTestEmail,
  PasswordResetEmail,
  StayOverlapEmail,
  TodoAssignedEmail,
  WeeklyDigestEmail,
} from "@/emails/templates";

type NotificationType =
  | "password_reset"
  | "notification_test"
  | "weekly_digest"
  | "monthly_finance_report"
  | "new_stay"
  | "stay_overlap"
  | "todo_assigned"
  | "new_expense";

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
  try {
    const [{ eq }, { db }, { members, notificationLog }] = await Promise.all([
      import("drizzle-orm"),
      import("@/lib/db"),
      import("@/lib/db/schema"),
    ]);

    const member = await db.query.members.findFirst({
      where: eq(members.email, email),
      columns: { id: true },
    });

    await db.insert(notificationLog).values({
      memberId: member?.id ?? null,
      type,
      success,
    });
  } catch (error) {
    console.warn("[Notification][LOG_SKIPPED]", error);
  }
}

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter() {
  if (smtpTransporter) {
    return smtpTransporter;
  }
  smtpTransporter = nodemailer.createTransport({
    host: process.env.MAILGUN_SMTP_HOST ?? "smtp.eu.mailgun.org",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILGUN_SMTP_LOGIN,
      pass: process.env.MAILGUN_SMTP_PASSWORD,
    },
  });
  return smtpTransporter;
}

async function sendWithSmtp({
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
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL;
  if (!process.env.MAILGUN_SMTP_LOGIN || !process.env.MAILGUN_SMTP_PASSWORD || !fromEmail) {
    console.info(`[Notification][SIMULATED] to=${email} subject="${subject}"`);
    await logNotification({ email, type, success: true });
    return { simulated: true, ok: true };
  }

  const transporter = getSmtpTransporter();
  let success = true;
  try {
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    success = false;
    console.error("[Notification][SMTP_ERROR]", error);
  }
  await logNotification({ email, type, success });
  return { simulated: false, ok: success };
}

export async function sendPasswordResetEmail({ email, resetUrl }: PasswordResetPayload) {
  return sendWithSmtp({
    email,
    subject: "Réinitialisation de mot de passe",
    html: await render(PasswordResetEmail({ resetUrl })),
    type: "password_reset",
  });
}

export async function sendTestNotificationEmail({ email, name }: { email: string; name: string }) {
  return sendWithSmtp({
    email,
    subject: "Email de test - Notifications Chamade",
    html: await render(NotificationTestEmail({ name })),
    type: "notification_test",
  });
}

export async function sendWeeklyDigestEmail({ email, lines }: { email: string; lines: string[] }) {
  return sendWithSmtp({
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
  return sendWithSmtp({
    email,
    subject: `Rapport financier ${yearMonth}`,
    html: await render(MonthlyFinanceReportEmail({ yearMonth, summary })),
    type: "monthly_finance_report",
  });
}

export async function sendNewStayEmail({
  email,
  recipientName,
  createdByName,
  stayType,
  personLabel,
  startDate,
  endDate,
  notes,
  agendaUrl,
}: {
  email: string;
  recipientName: string;
  createdByName: string;
  stayType: "Famille" | "Location";
  personLabel: string;
  startDate: string;
  endDate: string;
  notes?: string;
  agendaUrl: string;
}) {
  return sendWithSmtp({
    email,
    subject: `Nouveau sejour: ${startDate} -> ${endDate}`,
    html: await render(
      NewStayEmail({
        recipientName,
        createdByName,
        stayType,
        personLabel,
        startDate,
        endDate,
        notes,
        agendaUrl,
      })
    ),
    type: "new_stay",
  });
}

export async function sendStayOverlapEmail({
  email,
  recipientName,
  createdByName,
  startDate,
  endDate,
  conflicts,
  agendaUrl,
}: {
  email: string;
  recipientName: string;
  createdByName: string;
  startDate: string;
  endDate: string;
  conflicts: string[];
  agendaUrl: string;
}) {
  return sendWithSmtp({
    email,
    subject: `Alerte chevauchement: ${startDate} -> ${endDate}`,
    html: await render(
      StayOverlapEmail({
        recipientName,
        createdByName,
        startDate,
        endDate,
        conflicts,
        agendaUrl,
      })
    ),
    type: "stay_overlap",
  });
}

export async function sendTodoAssignedEmail({
  email,
  assigneeName,
  assignedByName,
  title,
  priority,
  dueDate,
  status,
  todosUrl,
}: {
  email: string;
  assigneeName: string;
  assignedByName: string;
  title: string;
  priority: string;
  dueDate?: string;
  status: string;
  todosUrl: string;
}) {
  return sendWithSmtp({
    email,
    subject: `Nouvelle tache assignee: ${title}`,
    html: await render(
      TodoAssignedEmail({
        assigneeName,
        assignedByName,
        title,
        priority,
        dueDate,
        status,
        todosUrl,
      })
    ),
    type: "todo_assigned",
  });
}

export async function sendNewExpenseEmail({
  email,
  recipientName,
  createdByName,
  nature,
  amount,
  date,
  category,
  description,
  financesUrl,
}: {
  email: string;
  recipientName: string;
  createdByName: string;
  nature: string;
  amount: string;
  date: string;
  category: string;
  description: string;
  financesUrl: string;
}) {
  return sendWithSmtp({
    email,
    subject: `Nouvelle depense ${nature}: ${amount}`,
    html: await render(
      NewExpenseEmail({
        recipientName,
        createdByName,
        nature,
        amount,
        date,
        category,
        description,
        financesUrl,
      })
    ),
    type: "new_expense",
  });
}
