import { KeyContactsPanel } from "@/components/contacts/KeyContactsPanel";
import Link from "next/link";
import { KpiGrid } from "@/components/shared/KpiGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { getActiveKeyContacts } from "@/lib/db/contacts";
import { getDashboardData } from "@/lib/db/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const contacts = await getActiveKeyContacts();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble rapide de la propriété: agenda, tâches, finances."
        actions={
          <>
            <Link href="/agenda" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white">
              Nouvel agenda
            </Link>
            <Link href="/todos?view=list" className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700">
              Voir les tâches
            </Link>
          </>
        }
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <KpiGrid
          items={[
            { title: "Todos ouverts", value: data.kpis.todosOpen.toString(), subtitle: `${data.kpis.todosTotal} au total` },
            { title: "Todos en retard", value: data.kpis.todosOverdue.toString() },
            { title: "Séjours année", value: data.kpis.staysTotal.toString(), subtitle: `${data.kpis.staysRental} locations` },
            { title: "Net financier", value: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(data.kpis.financeNet) },
          ]}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Prochains séjours</h2>
          <div className="mt-3 space-y-2">
            {data.upcomingStays.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun séjour à venir.</p>
            ) : (
              data.upcomingStays.map((stay) => (
                <div key={stay.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <p className="font-medium text-zinc-900">{stay.memberName ?? stay.guestName ?? "Séjour"}</p>
                  <p className="text-xs text-zinc-600">
                    {stay.startDate} - {stay.endDate} {stay.isRental ? "• Location" : "• Famille"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Tâches prioritaires</h2>
          <div className="mt-3 space-y-2">
            {data.upcomingTodos.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune tâche ouverte.</p>
            ) : (
              data.upcomingTodos.map((todo) => (
                <div key={todo.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                  <p className="font-medium text-zinc-900">{todo.title}</p>
                  <p className="text-xs text-zinc-600">
                    Priorité {todo.priority} {todo.dueDate ? `• Échéance ${todo.dueDate}` : ""} {todo.assignedName ? `• ${todo.assignedName}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <KeyContactsPanel contacts={contacts} />
    </div>
  );
}
