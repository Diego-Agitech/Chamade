"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfYear,
  format,
  getDay,
  getDaysInYear,
  parse,
  parseISO,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { createStayAction, deleteStayAction, updateStayAction } from "@/app/(authenticated)/agenda/actions";
import { FilterBar } from "@/components/shared/FilterBar";
import { KpiGrid } from "@/components/shared/KpiGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { ViewSwitcher } from "@/components/shared/ViewSwitcher";

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

type AgendaClientProps = {
  members: Member[];
  stays: Stay[];
  currentMemberId: string;
};

type CalendarStayEvent = Event & { resource: Stay };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { fr },
});

type Mode = "calendar" | "dashboard";
type FilterMode = "all" | "family" | "rental";

const NO_MEMBER_COLOR = "#9ca3af";
const RENTAL_COLOR = "#ca8a04";

function stayDurationDays(stay: Stay) {
  const start = parseISO(stay.startDate);
  const end = parseISO(stay.endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

export function AgendaClient({ members, stays, currentMemberId }: AgendaClientProps) {
  const [mode, setMode] = useState<Mode>("calendar");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [isRentalNewStay, setIsRentalNewStay] = useState(false);

  const years = useMemo(() => {
    const allYears = stays.flatMap((stay) => [parseISO(stay.startDate).getFullYear(), parseISO(stay.endDate).getFullYear()]);
    const unique = new Set([new Date().getFullYear(), ...allYears]);
    return [...unique].sort((a, b) => b - a);
  }, [stays]);

  const filteredStays = useMemo(() => {
    return stays.filter((stay) => {
      const byType =
        filterMode === "all" || (filterMode === "rental" && Boolean(stay.isRental)) || (filterMode === "family" && !stay.isRental);
      const stayYear = parseISO(stay.startDate).getFullYear();
      return byType && stayYear === selectedYear;
    });
  }, [stays, filterMode, selectedYear]);

  const events: CalendarStayEvent[] = useMemo(
    () =>
      filteredStays.map((stay) => ({
        title: `${stay.isRental ? "🏠€ " : ""}${stay.memberName ?? "Séjour"}`,
        start: parseISO(stay.startDate),
        end: addDays(parseISO(stay.endDate), 1),
        allDay: true,
        resource: stay,
      })),
    [filteredStays]
  );

  const kpis = useMemo(() => {
    const nightsTotal = filteredStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0);
    const rentalStays = filteredStays.filter((stay) => stay.isRental);
    const familyStays = filteredStays.filter((stay) => !stay.isRental);
    const rentalNights = rentalStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0);
    const familyNights = familyStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0);
    const rentalNetRevenue = rentalStays.reduce((acc, stay) => acc + (stay.revenue?.net ?? 0), 0);
    const occupancyRate = (nightsTotal / getDaysInYear(new Date(selectedYear, 1, 1))) * 100;
    return { nightsTotal, rentalNights, familyNights, rentalCount: rentalStays.length, rentalNetRevenue, occupancyRate };
  }, [filteredStays, selectedYear]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return [...filteredStays]
      .filter((stay) => parseISO(stay.startDate).getTime() >= now.getTime())
      .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
      .slice(0, 10);
  }, [filteredStays]);

  const recentPast = useMemo(() => {
    const now = new Date();
    return [...filteredStays]
      .filter((stay) => parseISO(stay.endDate).getTime() < now.getTime())
      .sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime())
      .slice(0, 10);
  }, [filteredStays]);

  const memberStats = useMemo(
    () =>
      members.map((member) => {
        const memberStays = filteredStays.filter((stay) => stay.memberId === member.id && !stay.isRental);
        return {
          member,
          days: memberStays.reduce((acc, stay) => acc + stayDurationDays(stay), 0),
        };
      }),
    [members, filteredStays]
  );

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const heatmapDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Planifie les séjours famille et locations, puis suis l'occupation annuelle."
        actions={
          <ViewSwitcher
            activeId={mode}
            options={[
              { id: "calendar", label: "Calendrier", onClick: () => setMode("calendar") },
              { id: "dashboard", label: "Tableau de bord", onClick: () => setMode("dashboard") },
            ]}
          />
        }
      />

      <FilterBar>
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Type</label>
        <select
          value={filterMode}
          onChange={(event) => setFilterMode(event.target.value as FilterMode)}
          className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="family">Famille</option>
          <option value="rental">Locations</option>
        </select>

        <label className="ml-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Année</label>
        <select
          value={selectedYear}
          onChange={(event) => setSelectedYear(Number(event.target.value))}
          className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </FilterBar>

      {mode === "calendar" ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 grid gap-4 lg:grid-cols-[360px_1fr]">
            <form action={createStayAction} className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <h3 className="text-sm font-semibold text-zinc-900">+ Ajouter un séjour</h3>
              <div className="grid grid-cols-2 gap-2">
                <input name="startDate" type="date" required className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
                <input name="endDate" type="date" required className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
              </div>
              <select name="memberId" defaultValue={currentMemberId} className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="isRental"
                  className="h-4 w-4"
                  checked={isRentalNewStay}
                  onChange={(event) => setIsRentalNewStay(event.target.checked)}
                />{" "}
                Location ?
              </label>
              <input
                name="rentalGuestName"
                placeholder="Nom invité location"
                className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm"
              />
              {isRentalNewStay ? (
                <input
                  name="netAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Revenu net EUR"
                  className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm"
                />
              ) : null}
              <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
              <button type="submit" className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white">
                Créer
              </button>
            </form>

            <div className="rounded-xl border border-zinc-200 p-2">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 620 }}
                defaultView="month"
                views={["month", "week", "agenda"]}
                culture="fr"
                eventPropGetter={(event: CalendarStayEvent) => {
                  const stay = event.resource;
                  const color = stay.memberColor ?? NO_MEMBER_COLOR;
                  if (stay.isRental) {
                    return {
                      style: {
                        backgroundColor: "#fff7ed",
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgba(202,138,4,0.22) 0px, rgba(202,138,4,0.22) 6px, rgba(255,255,255,0) 6px, rgba(255,255,255,0) 12px)",
                        border: `1px dashed ${RENTAL_COLOR}`,
                        color: "#1f2937",
                      },
                    };
                  }

                  return {
                    style: {
                      backgroundColor: color,
                      border: "none",
                      color: "#fff",
                    },
                  };
                }}
                onSelectEvent={(event: CalendarStayEvent) => setSelectedStay(event.resource)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: member.color }} />
                {member.name}
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: NO_MEMBER_COLOR }} />
              Sans utilisateur
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: RENTAL_COLOR }} />
              Location
            </div>
          </div>
        </section>
      ) : mode === "dashboard" ? (
        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <KpiGrid
            items={[
              { title: "Nuitées totales", value: kpis.nightsTotal.toString() },
              { title: "Famille vs Location", value: `${kpis.familyNights} / ${kpis.rentalNights}` },
              { title: "Nombre de locations", value: kpis.rentalCount.toString() },
              { title: "Revenus locatifs nets", value: `${kpis.rentalNetRevenue.toFixed(0)} EUR` },
              { title: "Taux d'occupation", value: `${kpis.occupancyRate.toFixed(1)}%` },
            ]}
            className="md:grid-cols-3 xl:grid-cols-5"
          />

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Heatmap annuelle</h3>
            <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 p-2">
              {heatmapDays.map((day) => {
                const dayIso = format(day, "yyyy-MM-dd");
                const match = filteredStays.find((stay) => stay.startDate <= dayIso && stay.endDate >= dayIso);
                const bg = match ? (match.isRental ? RENTAL_COLOR : (match.memberColor ?? NO_MEMBER_COLOR)) : "#f4f4f5";
                return <div key={dayIso} className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: bg }} title={dayIso} />;
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StayList title="Prochains séjours" stays={upcoming} />
            <StayList title="Derniers séjours passés" stays={recentPast} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-3">
              <h3 className="text-sm font-semibold text-zinc-900">Statistiques par membre</h3>
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

            <div className="rounded-xl border border-zinc-200 p-3">
              <h3 className="text-sm font-semibold text-zinc-900">Bilan locations</h3>
              <p className="mt-2 text-sm text-zinc-700">Semaines louées: {(kpis.rentalNights / 7).toFixed(1)}</p>
              <p className="text-sm font-semibold text-zinc-900">Net: {kpis.rentalNetRevenue.toFixed(0)} EUR</p>
            </div>
          </div>
        </section>
      ) : null}

      {selectedStay ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-zinc-900">Modifier le séjour</h3>
            <form action={updateStayAction} className="mt-3 space-y-2">
              <input type="hidden" name="stayId" value={selectedStay.id} />
              <div className="grid grid-cols-2 gap-2">
                <input name="startDate" type="date" defaultValue={selectedStay.startDate} required className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
                <input name="endDate" type="date" defaultValue={selectedStay.endDate} required className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
              </div>
              <select name="memberId" defaultValue={selectedStay.memberId ?? ""} className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <input
                name="rentalGuestName"
                defaultValue={selectedStay.rentalGuestName ?? ""}
                className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="isRental" defaultChecked={Boolean(selectedStay.isRental)} className="h-4 w-4" />
                Location
              </label>
              <textarea name="notes" defaultValue={selectedStay.notes ?? ""} rows={3} className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white">
                  Enregistrer
                </button>
                <button type="button" className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700" onClick={() => setSelectedStay(null)}>
                  Fermer
                </button>
              </div>
            </form>
            <form action={deleteStayAction} className="mt-2">
              <input type="hidden" name="stayId" value={selectedStay.id} />
              <button type="submit" className="rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
                Supprimer
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StayList({ title, stays }: { title: string; stays: Stay[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {stays.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun séjour.</p>
        ) : (
          stays.map((stay) => (
            <div key={stay.id} className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
              <div className="font-medium text-zinc-900">
                {stay.memberName ?? "Sans membre"} {stay.isRental ? "• Location" : ""}
              </div>
              <div className="text-xs text-zinc-600">
                {stay.startDate} {"->"} {stay.endDate} ({stayDurationDays(stay)} jours)
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
