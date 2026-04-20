import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getFinanceReportingSummaryForCron } from "@/lib/db/finances";
import { members } from "@/lib/db/schema";
import { sendMonthlyFinanceReportEmail } from "@/lib/notifications/send";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && bearer && bearer === secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const summary = await getFinanceReportingSummaryForCron(now.getFullYear(), yearMonth);

  const recipients = await db
    .select({
      email: members.email,
    })
    .from(members)
    .where(and(eq(members.notifyMonthlyFinanceReport, true)));

  const message = `OPEX: ${summary.opex.toFixed(2)} EUR | CAPEX: ${summary.capex.toFixed(2)} EUR | Revenus: ${summary.revenues.toFixed(2)} EUR | Net: ${summary.net.toFixed(2)} EUR`;

  await Promise.all(
    recipients.map((recipient) =>
      sendMonthlyFinanceReportEmail({
        email: recipient.email,
        yearMonth,
        summary: message,
      })
    )
  );

  return Response.json({ ok: true, sent: recipients.length, yearMonth });
}
