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

  const [{ db }, { members }, { sendWeeklyDigestEmail }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
    import("@/lib/notifications/send"),
  ]);

  const recipients = await db
    .select({
      email: members.email,
      name: members.name,
    })
    .from(members)
    .where(and(eq(members.notifyWeeklyDigest, true)));

  await Promise.all(
    recipients.map((recipient) =>
      sendWeeklyDigestEmail({
        email: recipient.email,
        lines: [`Bonjour ${recipient.name},`, "Voici votre résumé hebdomadaire Chamade."],
      })
    )
  );

  return Response.json({ ok: true, sent: recipients.length });
}
