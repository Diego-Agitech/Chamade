"use client";

import { KpiGrid } from "@/components/shared/KpiGrid";

type FinancesData = {
  year: number;
  tab: "reporting" | "opex" | "capex" | "revenues" | "claims";
  kpis: {
    opex: number;
    capex: number;
    revenuesNet: number;
    revenuesBySource: { rental: number; vignes: number; divers: number };
    opexPreviousYear: number;
  };
  categories: Array<{
    id: string;
    name: string;
    nature: "OPEX" | "CAPEX";
    zone: string | null;
    amortizationYears: number | null;
    color: string | null;
  }>;
  members: Array<{ id: string; name: string; color: string }>;
  expenses: Array<{
    id: string;
    nature: "OPEX" | "CAPEX";
    date: string;
    description: string;
    amount: number;
    vendor: string | null;
    isRecurring: boolean | null;
    recurrenceFrequency: string | null;
    categoryName: string | null;
    categoryZone: string | null;
    categoryColor: string | null;
    paidByName: string | null;
  }>;
  revenues: Array<{
    id: string;
    source: "rental" | "vignes" | "divers";
    subcategory: string | null;
    date: string;
    description: string;
    payerName: string | null;
    grossAmount: number;
    deductions: number | null;
    netAmount: number;
    receivedByName: string | null;
  }>;
};
const FINANCE_ENTITY_NAME = "ChrisPadi SCI";

type FinancesClientProps = {
  data: FinancesData;
};

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

export function FinancesClient({ data }: FinancesClientProps) {
  const netResult = data.kpis.revenuesNet - data.kpis.opex;
  const opexDelta = data.kpis.opexPreviousYear === 0 ? 0 : ((data.kpis.opex - data.kpis.opexPreviousYear) / data.kpis.opexPreviousYear) * 100;

  return (
    <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        Tableau de bord financier de <span className="font-semibold text-zinc-900">{FINANCE_ENTITY_NAME}</span>.
      </div>
      <KpiGrid
        items={[
          { title: "OPEX année", value: money(data.kpis.opex), subtitle: `vs N-1: ${opexDelta.toFixed(1)}%` },
          { title: "CAPEX année", value: money(data.kpis.capex) },
          {
            title: "Revenus nets année",
            value: money(data.kpis.revenuesNet),
            subtitle: `Loc ${money(data.kpis.revenuesBySource.rental)} | Vignes ${money(data.kpis.revenuesBySource.vignes)} | Divers ${money(data.kpis.revenuesBySource.divers)}`,
          },
          { title: "Résultat net", value: money(netResult), subtitle: netResult >= 0 ? "Positif" : "Coût net" },
        ]}
      />
    </section>
  );
}
