"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo, useState } from "react";
import {
  addDays,
  format,
  getDay,
  parse,
  parseISO,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { createStayAction, deleteStayAction, updateStayAction } from "@/app/(authenticated)/agenda/actions";
import { AgendaSummary } from "@/components/agenda/AgendaSummary";
import { FilterBar } from "@/components/shared/FilterBar";
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
      ) : mode === "dashboard" ? <AgendaSummary filteredStays={filteredStays} selectedYear={selectedYear} members={members} /> : null}

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
