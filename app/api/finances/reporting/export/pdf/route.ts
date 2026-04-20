import { NextResponse } from "next/server";
import { getFinanceReportingData } from "@/lib/db/finances";
import { buildFinanceReportingPdf } from "@/lib/finances/reporting";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const data = await getFinanceReportingData(year);
  const buffer = await buildFinanceReportingPdf(data);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporting-${year}.pdf"`,
    },
  });
}
