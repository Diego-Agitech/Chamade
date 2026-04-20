import { NextResponse } from "next/server";
import { getFinanceReportingData } from "@/lib/db/finances";
import { buildFinanceReportingExcel } from "@/lib/finances/reporting";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const data = await getFinanceReportingData(year);
  const buffer = await buildFinanceReportingExcel(data);
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporting-${year}.xlsx"`,
    },
  });
}
