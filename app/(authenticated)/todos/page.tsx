import Link from "next/link";
import { createTodoAction, deleteTodoAction, toggleTodoAction } from "@/app/(authenticated)/todos/actions";
import { FilterBar } from "@/components/shared/FilterBar";
import { KpiGrid } from "@/components/shared/KpiGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { ViewSwitcher } from "@/components/shared/ViewSwitcher";
import { getTodosPageData } from "@/lib/db/todos";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; view?: "dashboard" | "list" | "kanban"; assignedTo?: string; status?: "all" | "open" | "done" | "overdue" }>;
}) {
  const params = await searchParams;
  const data = await getTodosPageData(params.category, {
    assignedTo: params.assignedTo,
    status: params.status,
  });
  const view = params.view === "list" || params.view === "kanban" ? params.view : "dashboard";

  const allTodos = data.categories.reduce((acc, category) => acc + category.counts.total, 0);
  const openTodos = data.categories.reduce((acc, category) => acc + category.counts.open, 0);
  const doneTodos = allTodos - openTodos;
  const completionRate = allTodos === 0 ? 0 : (doneTodos / allTodos) * 100;
  const overdue = data.todos.filter((todo) => !todo.isDone && todo.dueDate && todo.dueDate < new Date().toISOString().slice(0, 10));
  const buildTodosUrl = ({
    nextView = "list",
    category,
    assignedTo,
    status,
  }: {
    nextView?: "list" | "dashboard" | "kanban";
    category?: string;
    assignedTo?: string;
    status?: "all" | "open" | "done" | "overdue";
  }) => {
    const query = new URLSearchParams();
    query.set("view", nextView);
    const finalCategory = category ?? data.selectedCategoryId;
    if (finalCategory) query.set("category", finalCategory);
    if (assignedTo) query.set("assignedTo", assignedTo);
    if (status && status !== "all") query.set("status", status);
    return `/todos?${query.toString()}`;
  };

  const kanbanColumns = [
    { id: "high", label: "Priorité haute", todos: data.todos.filter((todo) => !todo.isDone && todo.priority === "high") },
    { id: "medium", label: "Priorité moyenne", todos: data.todos.filter((todo) => !todo.isDone && todo.priority === "medium") },
    { id: "low", label: "Priorité basse", todos: data.todos.filter((todo) => !todo.isDone && todo.priority === "low") },
    { id: "done", label: "Terminées", todos: data.todos.filter((todo) => todo.isDone) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Todos"
        description="Suis les tâches par catégorie, par personne et par statut."
        actions={
          <ViewSwitcher
            activeId={view}
            options={[
              { id: "dashboard", label: "Tableau de bord", href: buildTodosUrl({ nextView: "dashboard", status: "all", assignedTo: "" }) },
              { id: "list", label: "Liste", href: buildTodosUrl({ nextView: "list", status: "all", assignedTo: "" }) },
              { id: "kanban", label: "Kanban", href: buildTodosUrl({ nextView: "kanban", status: "all", assignedTo: "" }) },
            ]}
          />
        }
      />

      <FilterBar>
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Catégorie</label>
        <span className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-700">
          {data.categories.find((category) => category.id === data.selectedCategoryId)?.name ?? "Toutes les catégories"}
        </span>
        <div className="flex flex-wrap gap-1">
          {data.categories.map((category) => (
            <Link
              key={category.id}
              href={buildTodosUrl({ category: category.id, assignedTo: data.activeFilters.assignedTo || "", status: data.activeFilters.status, nextView: view })}
              className={`rounded-md px-2 py-1 text-xs ${category.id === data.selectedCategoryId ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </FilterBar>

      {view === "dashboard" ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <KpiGrid
            items={[
              { title: "Total tâches", value: allTodos.toString() },
              { title: "À faire", value: openTodos.toString() },
              { title: "Terminées", value: doneTodos.toString() },
              { title: "Taux de complétion", value: `${completionRate.toFixed(1)}%` },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Répartition par catégorie</h2>
              <div className="mt-3 space-y-2">
                {data.categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between text-sm">
                    <span>{category.name}</span>
                    <span className="font-medium">
                      {category.counts.open}/{category.counts.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Todos par personne</h2>
              <div className="space-y-2">
                {data.memberBreakdown.map((row) => (
                  <Link
                    key={row.memberId}
                    href={buildTodosUrl({ assignedTo: row.memberId, status: "all" })}
                    className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.memberColor }} />
                      {row.memberName}
                    </span>
                    <span className="font-medium text-zinc-700">
                      {row.open}/{row.total}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Tâches en retard</h2>
              <div className="mt-3 space-y-2">
                {overdue.length === 0 ? (
                  <p className="text-sm text-zinc-500">Aucune tâche en retard.</p>
                ) : (
                  overdue.slice(0, 8).map((todo) => (
                    <div key={todo.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                      <p className="font-medium text-zinc-900">{todo.title}</p>
                      <p className="text-xs text-zinc-600">Échéance: {todo.dueDate}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      ) : view === "list" ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Nouvelle tâche</h2>
              <form action={createTodoAction} className="mt-3 space-y-3">
                <input type="hidden" name="categoryId" value={data.selectedCategoryId ?? ""} />
                <div className="space-y-1">
                  <label htmlFor="title" className="text-xs font-medium text-zinc-600">
                    Titre
                  </label>
                  <input id="title" name="title" required minLength={2} className="h-9 w-full rounded-md border border-zinc-300 px-3 text-sm" />
                </div>

                <div className="space-y-1">
                  <label htmlFor="description" className="text-xs font-medium text-zinc-600">
                    Description
                  </label>
                  <textarea id="description" name="description" rows={3} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select id="priority" name="priority" defaultValue="medium" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                  <input id="dueDate" name="dueDate" type="date" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm" />
                </div>

                <select id="assignedTo" name="assignedTo" className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm">
                  <option value="">Non assigné</option>
                  {data.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>

                <button type="submit" className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700">
                  Ajouter
                </button>
              </form>
            </section>
          </aside>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Liste des tâches</h2>
            <p className="mt-1 text-sm text-zinc-600">Tri: non terminées, priorité, date limite.</p>
            {(data.activeFilters.assignedTo || data.activeFilters.status !== "all") && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.activeFilters.assignedTo && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">Filtre personne actif</span>
                )}
                {data.activeFilters.status !== "all" && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">Statut: {data.activeFilters.status}</span>
                )}
                <Link href={buildTodosUrl({ assignedTo: "", status: "all", nextView: "list" })} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  Effacer filtres
                </Link>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {data.todos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
                  Aucune tâche dans cette catégorie pour le moment.
                </p>
              ) : (
                data.todos.map((todo) => (
                  <article
                    key={todo.id}
                    className={`rounded-xl border px-4 py-3 ${
                      todo.isDone ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-sm font-semibold ${todo.isDone ? "line-through" : ""}`}>{todo.title}</h3>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">{todo.priority}</span>
                          {todo.dueDate ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{todo.dueDate}</span>
                          ) : null}
                        </div>
                        {todo.description ? <p className="mt-1 text-sm">{todo.description}</p> : null}
                        {todo.assignedName ? (
                          <p className="mt-1 text-xs">
                            Assigné à <span style={{ color: todo.assignedColor ?? "#27272a" }}>{todo.assignedName}</span>
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <form action={toggleTodoAction}>
                          <input type="hidden" name="todoId" value={todo.id} />
                          <input type="hidden" name="isDone" value={todo.isDone ? "false" : "true"} />
                          <button
                            type="submit"
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                              todo.isDone ? "bg-zinc-200 text-zinc-700" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {todo.isDone ? "Rouvrir" : "Terminer"}
                          </button>
                        </form>
                        <form action={deleteTodoAction}>
                          <input type="hidden" name="todoId" value={todo.id} />
                          <button type="submit" className="rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700">
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Kanban</h2>
          <p className="mt-1 text-sm text-zinc-600">Vue colonne par priorité, avec tâches terminées séparées.</p>
          <div className="mt-4 grid gap-4 xl:grid-cols-4">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">{column.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600">{column.todos.length}</span>
                </div>
                <div className="space-y-2">
                  {column.todos.length === 0 ? (
                    <p className="rounded-md border border-dashed border-zinc-300 px-2 py-3 text-xs text-zinc-500">Aucune tâche</p>
                  ) : (
                    column.todos.map((todo) => (
                      <article key={todo.id} className="rounded-md border border-zinc-200 bg-white p-2 text-sm">
                        <p className={`font-medium text-zinc-900 ${todo.isDone ? "line-through" : ""}`}>{todo.title}</p>
                        {todo.dueDate ? <p className="mt-1 text-xs text-zinc-500">Échéance: {todo.dueDate}</p> : null}
                        {todo.assignedName ? <p className="mt-1 text-xs text-zinc-500">Assigné à {todo.assignedName}</p> : null}
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
