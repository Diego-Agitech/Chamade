import { createCompensationPaymentAction, createExpenseAction, createRevenueAction } from "@/app/(authenticated)/finances/actions";
import { FinancesClient } from "@/components/finances/FinancesClient";
import { ReportingCharts } from "@/components/finances/ReportingCharts";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { ViewSwitcher } from "@/components/shared/ViewSwitcher";
import { EmptyState } from "@/components/ui/empty-state";
import { getFinanceReportingData, getFinancesPageData } from "@/lib/db/finances";

type Tab = "reporting" | "opex" | "capex" | "revenues" | "claims";
const FINANCE_ENTITY_NAME = "ChrisPadi SCI";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "reporting", label: "Reporting" },
  { id: "opex", label: "OPEX" },
  { id: "capex", label: "CAPEX" },
  { id: "revenues", label: "Revenus" },
  { id: "claims", label: "Créances" },
];

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as Tab) || "reporting";
  const year = Number(params.year || new Date().getFullYear());
  const data = await getFinancesPageData(year, tab);
  const reportingData = tab === "reporting" ? await getFinanceReportingData(year) : null;
  const opexCategories = data.categories.filter((c) => c.nature === "OPEX");
  const capexCategories = data.categories.filter((c) => c.nature === "CAPEX");
  const addRecordHrefByTab: Record<Tab, string> = {
    reporting: "/finances?tab=opex",
    opex: "#finance-create",
    capex: "#finance-create",
    revenues: "#finance-create",
    claims: "#finance-create",
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finances"
        description={`Pilotage financier de ${FINANCE_ENTITY_NAME}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a href={addRecordHrefByTab[tab]} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              Ajouter un enregistrement
            </a>
            <ViewSwitcher
              activeId={tab}
              className="w-full sm:w-auto"
              options={tabs.map((item) => ({
                id: item.id,
                label: item.label,
                href: `/finances?tab=${item.id}&year=${year}`,
              }))}
            />
          </div>
        }
      />

      <FilterBar>
        <form className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Année</label>
          <select name="year" defaultValue={year} className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <input type="hidden" name="tab" value={tab} />
          <button type="submit" className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white">
            Appliquer
          </button>
        </form>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
          Entité propriétaire: {FINANCE_ENTITY_NAME}
        </span>
      </FilterBar>

      {tab === "reporting" ? <FinancesClient data={data} /> : null}

      {tab === "claims" ? (
        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div id="finance-create" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Paiement de compensation</h2>
            <p className="mt-1 text-xs text-zinc-600">Permet d&apos;équilibrer les créances entre membres.</p>
            <form action={createCompensationPaymentAction} className="mt-3 space-y-2">
              <select name="fromMemberId" required className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                <option value="">Payé par</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <select name="toMemberId" required className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                <option value="">Reçu par</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="amount" type="number" min="0" step="0.01" required placeholder="Montant" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
                <input name="date" type="date" required className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
              </div>
              <input name="notes" placeholder="Notes (optionnel)" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <button type="submit" className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white">
                Enregistrer paiement
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Soldes par membre</h2>
              <p className="mt-1 text-xs text-zinc-600">Solde = Avancé (OPEX+CAPEX) - Encaissé (revenus) - compensation sortante + compensation entrante</p>
              <div className="mt-3 space-y-2">
                {data.memberBalances.map((row) => (
                  <div key={row.memberId} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{row.memberName}</span>
                      <span className={`font-semibold ${row.netBalance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.netBalance)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      Avancé {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.paid)} • Encaissé{" "}
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.received)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Paiements de compensation</h2>
              <div className="mt-3 space-y-2">
                {data.compensations.length === 0 ? (
                  <EmptyState title="Aucun paiement de compensation" description="Les paiements apparaîtront ici dès le premier enregistrement." className="py-6" />
                ) : (
                  data.compensations.map((row) => (
                    <div key={row.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-zinc-900">
                          {row.fromMemberName} → {row.toMemberName}
                        </div>
                        <div className="font-semibold">
                          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.amount)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-600">
                        {row.date}
                        {row.notes ? ` • ${row.notes}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Qui doit à qui</h2>
              <p className="mt-1 text-xs text-zinc-600">Suggestions de règlements pour équilibrer automatiquement les soldes.</p>
              <div className="mt-3 space-y-2">
                {data.settlementSuggestions.length === 0 ? (
                  <EmptyState title="Soldes déjà équilibrés" description="Aucun règlement conseillé pour le moment." className="py-6" />
                ) : (
                  data.settlementSuggestions.map((row, idx) => (
                    <div key={`${row.fromMemberName}-${row.toMemberName}-${idx}`} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-zinc-900">
                          {row.fromMemberName} doit payer {row.toMemberName}
                        </div>
                        <div className="font-semibold">
                          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.amount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "opex" || tab === "capex" ? (
        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div id="finance-create" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Ajouter une dépense {tab === "opex" ? "OPEX - Dépenses courantes" : "CAPEX - Travaux/Investissements"}
            </h2>
            <form action={createExpenseAction} className="mt-3 space-y-2">
              <input type="hidden" name="nature" value={tab.toUpperCase()} />
              <select name="categoryId" required className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                <option value="">Catégorie</option>
                {(tab === "opex" ? opexCategories : capexCategories).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input name="description" required placeholder="Description" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <input name="vendor" placeholder="Fournisseur" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input name="amount" type="number" min="0" step="0.01" required placeholder="Montant" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
                <input name="date" type="date" required className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
              </div>
              <select name="paidBy" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                <option value="">Payé par</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {tab === "opex" ? (
                <>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" name="isRecurring" className="h-4 w-4" />
                    Dépense récurrente
                  </label>
                  <select name="recurrenceFrequency" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                    <option value="">Fréquence</option>
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="yearly">Annuelle</option>
                  </select>
                </>
              ) : null}
              <button type="submit" className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white">
                Ajouter
              </button>
            </form>
          </div>

          <div id="finance-create" className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">
              {tab === "opex" ? "OPEX - Dépenses courantes" : "CAPEX - Travaux/Investissements"}
            </h2>
            <div className="mt-3 space-y-2">
              {data.expenses.filter((expense) => expense.nature === tab.toUpperCase()).map((expense) => (
                <div key={expense.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-zinc-900">{expense.description}</div>
                    <div className="font-semibold">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(expense.amount)}</div>
                  </div>
                  <div className="text-xs text-zinc-600">
                    {expense.date} • {expense.categoryName ?? "Catégorie"} • {expense.categoryZone ?? "global"} • {expense.paidByName ?? "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "revenues" ? (
        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Ajouter un revenu</h2>
            <form action={createRevenueAction} className="mt-3 space-y-2">
              <select name="source" required className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                <option value="rental">Location</option>
                <option value="vignes">Vignes</option>
                <option value="divers">Divers</option>
              </select>
              <input name="subcategory" placeholder="Sous-catégorie" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <input name="description" required placeholder="Description" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input name="grossAmount" type="number" min="0" step="0.01" required placeholder="Brut" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
                <input name="deductions" type="number" min="0" step="0.01" placeholder="Déductions" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
              </div>
              <input name="date" type="date" required className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <input name="payerName" placeholder="Payeur" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
              <select name="receivedBy" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                <option value="">Encaissé par</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white">
                Ajouter
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Revenus</h2>
            <div className="mt-3 space-y-2">
              {data.revenues.length === 0 ? (
                <EmptyState title="Aucun revenu saisi cette année." description="Ajoute un revenu pour démarrer le suivi financier." className="py-8" />
              ) : (
                data.revenues.map((revenue) => (
                  <div key={revenue.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-zinc-900">
                        {revenue.description} <span className="text-zinc-500">({revenue.source})</span>
                      </div>
                      <div className="font-semibold">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(revenue.netAmount)}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600">
                      {revenue.date} • brut {revenue.grossAmount} • déductions {revenue.deductions ?? 0} • {revenue.receivedByName ?? "N/A"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "reporting" ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Reporting annuel</h2>
            <p className="mt-1 text-sm text-zinc-600">Synthèse exécutive, tendances mensuelles et distribution par membre.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">OPEX</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(data.kpis.opex)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">CAPEX</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(data.kpis.capex)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Revenus nets</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(data.kpis.revenuesNet)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Résultat net</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(data.kpis.revenuesNet - data.kpis.opex - data.kpis.capex)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={`/api/finances/reporting/export/csv?year=${year}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700">
              Export CSV
            </a>
            <a href={`/api/finances/reporting/export/excel?year=${year}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700">
              Export Excel
            </a>
            <a href={`/api/finances/reporting/export/pdf?year=${year}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700">
              Export PDF
            </a>
          </div>
          {reportingData ? <ReportingCharts data={reportingData} /> : null}
        </section>
      ) : null}
    </div>
  );
}
