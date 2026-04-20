import { eachDayOfInterval, endOfYear, format, getDaysInYear, parseISO, startOfYear } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiGrid } from "@/components/shared/KpiGrid";

type Member = { id: string; name: string; color: string };
type Stay = {
  id: string;
  memberId: string | null;
  memberName: string | null;
  memberColor: string | null;
  startDate: string;
  endDate: string;
  isRental: boolean | null;
  rentalGuestName: string | null;
  notes: string | null;
  hasOverlap: boolean;
  revenue: { net: number; gross: number; deductions: number } | null;
};

const NO_MEMBER_COLOR = "#9ca3af";
const RENTAL_COLOR = "#ca8a04";

function stayDurationDays(stay: Stay) {
  const start = parseISO(stay.startDate);
  const end = parseISO(stay.endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

export function AgendaSummary({ filteredStays, selectedYear, members }: { filteredStays: Stay[]; selectedYear: number; members: Member[] }) {
  const nightsTotal = filteredStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0);
  const rentalStays = filteredStays.filter((stay) => stay.isRental);
  const familyStays = filteredStays.filter((stay) => !stay.isRental);
  const rentalNights = rentalStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0);
  const familyNights = familyStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0);
  const rentalNetRevenue = rentalStays.reduce((acc, stay) => acc + (stay.revenue?.net ?? 0), 0);
  const occupancyRate = (nightsTotal / getDaysInYear(new Date(selectedYear, 1, 1))) * 100;

  const upcoming = [...filteredStays]
    .filter((stay) => parseISO(stay.startDate).getTime() >= Date.now())
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
    .slice(0, 10);

  const recentPast = [...filteredStays]
    .filter((stay) => parseISO(stay.endDate).getTime() < Date.now())
    .sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime())
    .slice(0, 10);

  const memberStats = members.map((member) => {
    const memberStays = filteredStays.filter((stay) => stay.memberId === member.id && !stay.isRental);
    return {
      member,
      days: memberStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0),
    };
  });

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const heatmapDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <KpiGrid
        items={[
          { title: "Nuitées totales", value: nightsTotal.toString() },
          { title: "Famille vs Location", value: `${familyNights} / ${rentalNights}` },
          { title: "Nombre de locations", value: rentalStays.length.toString() },
          { title: "Revenus locatifs nets", value: `${rentalNetRevenue.toFixed(0)} EUR` },
          { title: "Taux d'occupation", value: `${occupancyRate.toFixed(1)}%` },
        ]}
        className="md:grid-cols-3 xl:grid-cols-5"
      />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Heatmap annuelle</h3>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-chamade-cream/30 p-2">
          {heatmapDays.map((day) => {
            const dayIso = format(day, "yyyy-MM-dd");
            const match = filteredStays.find((stay) => stay.startDate <= dayIso && stay.endDate >= dayIso);
            const bg = match ? (match.isRental ? RENTAL_COLOR : (match.memberColor ?? NO_MEMBER_COLOR)) : "var(--chamade-cream)";
            return <div key={dayIso} className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: bg }} title={dayIso} />;
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StayList title="Prochains séjours" stays={upcoming} />
        <StayList title="Derniers séjours passés" stays={recentPast} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <h3 className="text-sm font-semibold text-foreground">Statistiques par membre</h3>
          <div className="mt-3 space-y-2">
            {memberStats.map((stat) => (
              <div key={stat.member.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stat.member.color }} />
                  {stat.member.name}
                </span>
                <span className="font-medium">{stat.days} jours</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <h3 className="text-sm font-semibold text-foreground">Bilan locations</h3>
          <p className="mt-2 text-sm text-muted-foreground">Semaines louées: {(rentalNights / 7).toFixed(1)}</p>
          <p className="text-sm font-semibold text-foreground">Net: {rentalNetRevenue.toFixed(0)} EUR</p>
        </div>
      </div>
    </section>
  );
}

function StayList({ title, stays }: { title: string; stays: Stay[] }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-2">
        {stays.length === 0 ? (
          <EmptyState title="Le mas attend sa prochaine visite 🌿" description="Aucun séjour dans cette section." className="py-6" />
        ) : (
          stays.map((stay) => (
            <div key={stay.id} className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <div className="font-medium text-foreground">
                {stay.memberName ?? "Sans membre"} {stay.isRental ? "• Location" : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {stay.startDate} {"->"} {stay.endDate} ({stayDurationDays(stay)} jours)
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
