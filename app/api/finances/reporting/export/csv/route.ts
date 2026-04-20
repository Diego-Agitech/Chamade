import { NextResponse } from "next/server";
import { getFinanceReportingData } from "@/lib/db/finances";
import { buildFinanceReportingCsv } from "@/lib/finances/reporting";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const data = await getFinanceReportingData(year);
  const csv = buildFinanceReportingCsv(data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporting-${year}.csv"`,
    },
  });
}
