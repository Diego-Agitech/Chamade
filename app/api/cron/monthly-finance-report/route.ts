import { and, eq } from "drizzle-orm";

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

  const [{ db }, { members }, { getFinanceReportingSummaryForCron }, { sendMonthlyFinanceReportEmail }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
    import("@/lib/db/finances"),
    import("@/lib/notifications/send"),
  ]);

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
