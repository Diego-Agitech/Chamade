import Link from "next/link";
import { createTodoAction, deleteTodoAction, toggleTodoAction, updateTodoStatusAction } from "@/app/(authenticated)/todos/actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
    { id: "todo", label: "A faire", todos: data.todos.filter((todo) => (todo.status ?? (todo.isDone ? "done" : "todo")) === "todo") },
    { id: "in_progress", label: "En cours", todos: data.todos.filter((todo) => (todo.status ?? (todo.isDone ? "done" : "todo")) === "in_progress") },
    { id: "done", label: "Fait", todos: data.todos.filter((todo) => (todo.status ?? (todo.isDone ? "done" : "todo")) === "done") },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Todos"
        description="Suis les tâches par catégorie, par personne et par statut."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildTodosUrl({ nextView: "list", status: "all", assignedTo: "" }) + "#todo-create"}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Ajouter une tache
            </Link>
            <ViewSwitcher
              activeId={view}
              options={[
                { id: "dashboard", label: "Tableau de bord", href: buildTodosUrl({ nextView: "dashboard", status: "all", assignedTo: "" }) },
                { id: "list", label: "Liste", href: buildTodosUrl({ nextView: "list", status: "all", assignedTo: "" }) },
                { id: "kanban", label: "Kanban", href: buildTodosUrl({ nextView: "kanban", status: "all", assignedTo: "" }) },
              ]}
            />
          </div>
        }
      />

      <FilterBar>
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Catégorie</label>
        <span className="inline-flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm text-foreground">
          {data.categories.find((category) => category.id === data.selectedCategoryId)?.name ?? "Toutes les catégories"}
        </span>
        <div className="flex flex-wrap gap-1">
          {data.categories.map((category) => (
            <Link
              key={category.id}
              href={buildTodosUrl({ category: category.id, assignedTo: data.activeFilters.assignedTo || "", status: data.activeFilters.status, nextView: view })}
              className={`rounded-md px-2 py-1 text-xs ${category.id === data.selectedCategoryId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </FilterBar>

      {view === "dashboard" ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <KpiGrid
            items={[
              { title: "Total tâches", value: allTodos.toString() },
              { title: "À faire", value: openTodos.toString() },
              { title: "Terminées", value: doneTodos.toString() },
              { title: "Taux de complétion", value: `${completionRate.toFixed(1)}%` },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Répartition par catégorie</h2>
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

            <div className="rounded-xl border border-border p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Todos par personne</h2>
              <div className="space-y-2">
                {data.memberBreakdown.map((row) => (
                  <Link
                    key={row.memberId}
                    href={buildTodosUrl({ assignedTo: row.memberId, status: "all" })}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.memberColor }} />
                      {row.memberName}
                    </span>
                    <span className="font-medium text-foreground">
                      {row.open}/{row.total}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tâches en retard</h2>
              <div className="mt-3 space-y-2">
                {overdue.length === 0 ? (
                  <EmptyState title="Tout est en ordre — rien à faire ici." description="Aucune tâche en retard pour l'instant." className="py-6" />
                ) : (
                  overdue.slice(0, 8).map((todo) => (
                    <div key={todo.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                      <p className="font-medium text-foreground">{todo.title}</p>
                      <p className="text-xs text-muted-foreground">Échéance: {todo.dueDate}</p>
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
            <section id="todo-create" className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nouvelle tâche</h2>
              <form action={createTodoAction} className="mt-3 space-y-3">
                <input type="hidden" name="categoryId" value={data.selectedCategoryId ?? ""} />
                <div className="space-y-1">
                  <label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                    Titre
                  </label>
                  <input id="title" name="title" required minLength={2} className="h-9 w-full rounded-md border border-border px-3 text-sm" />
                </div>

                <div className="space-y-1">
                  <label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <textarea id="description" name="description" rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select id="priority" name="priority" defaultValue="medium" className="h-9 w-full rounded-md border border-border px-2 text-sm">
                    <option value="low">Priorité basse</option>
                    <option value="medium">Priorité moyenne</option>
                    <option value="high">Priorité haute</option>
                  </select>
                  <input id="dueDate" name="dueDate" type="date" className="h-9 w-full rounded-md border border-border px-2 text-sm" />
                </div>
                <select id="status" name="status" defaultValue="todo" className="h-9 w-full rounded-md border border-border px-2 text-sm">
                  <option value="todo">A faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Fait</option>
                </select>

                <select id="assignedTo" name="assignedTo" className="h-9 w-full rounded-md border border-border px-2 text-sm">
                  <option value="">Non assigné</option>
                  {data.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <div className="space-y-1">
                  <label htmlFor="attachment" className="text-xs font-medium text-muted-foreground">
                    Pièce jointe photo
                  </label>
                  <input
                    id="attachment"
                    name="attachment"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="h-9 w-full rounded-md border border-border px-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                  />
                </div>

                <button type="submit" className="h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90">
                  Ajouter
                </button>
              </form>
            </section>
          </aside>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Liste des tâches</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tri: non terminées, priorité, date limite.</p>
            {(data.activeFilters.assignedTo || data.activeFilters.status !== "all") && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {data.activeFilters.assignedTo && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Filtre personne actif</span>
                )}
                {data.activeFilters.status !== "all" && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Statut: {data.activeFilters.status}</span>
                )}
                <Link href={buildTodosUrl({ assignedTo: "", status: "all", nextView: "list" })} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  Effacer filtres
                </Link>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {data.todos.length === 0 ? (
                <EmptyState title="Tout est en ordre — rien à faire ici." description="Aucune tâche dans cette catégorie pour le moment." className="py-8" />
              ) : (
                data.todos.map((todo) => (
                  <article
                    key={todo.id}
                    className={`rounded-xl border px-4 py-3 ${
                      todo.isDone ? "border-border bg-muted text-muted-foreground" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-sm font-semibold ${todo.isDone ? "line-through" : ""}`}>{todo.title}</h3>
                          <Badge tone={todo.priority === "high" ? "warm" : todo.priority === "medium" ? "gold" : "neutral"}>
                            {todo.priority === "high" ? "Haute" : todo.priority === "medium" ? "Moyenne" : "Basse"}
                          </Badge>
                          {todo.dueDate ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{todo.dueDate}</span>
                          ) : null}
                        </div>
                        {todo.description ? <p className="mt-1 text-sm">{todo.description}</p> : null}
                        {todo.attachmentUrl ? (
                          <img
                            src={todo.attachmentUrl}
                            alt={`Photo liée à ${todo.title}`}
                            className="mt-2 max-h-40 w-auto rounded-md border border-border object-cover"
                          />
                        ) : null}
                        {todo.assignedName ? (
                          <p className="mt-1 text-xs">
                            Assigné à <span style={{ color: todo.assignedColor ?? "#27272a" }}>{todo.assignedName}</span>
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <form action={updateTodoStatusAction}>
                          <input type="hidden" name="todoId" value={todo.id} />
                          <select
                            name="status"
                            defaultValue={todo.status ?? (todo.isDone ? "done" : "todo")}
                            className="rounded-md border border-border px-2 py-1.5 text-xs"
                          >
                            <option value="todo">A faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="done">Fait</option>
                          </select>
                          <button type="submit" className="ml-1 rounded-md bg-muted px-2 py-1.5 text-xs text-foreground">
                            MAJ
                          </button>
                        </form>
                        <form action={toggleTodoAction}>
                          <input type="hidden" name="todoId" value={todo.id} />
                          <input type="hidden" name="isDone" value={todo.isDone ? "false" : "true"} />
                          <button
                            type="submit"
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                              todo.isDone ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-800"
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
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Kanban</h2>
          <p className="mt-1 text-sm text-muted-foreground">Vue colonne par statut d&apos;avancement.</p>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{column.todos.length}</span>
                </div>
                <div className="space-y-2">
                  {column.todos.length === 0 ? (
                    <EmptyState title="Aucune tâche" description="Cette colonne est vide." className="px-2 py-4" />
                  ) : (
                    column.todos.map((todo) => (
                      <article key={todo.id} className="rounded-md border border-border bg-card p-2 text-sm">
                        <p className={`font-medium text-foreground ${todo.isDone ? "line-through" : ""}`}>{todo.title}</p>
                        {todo.attachmentUrl ? (
                          <img
                            src={todo.attachmentUrl}
                            alt={`Photo liée à ${todo.title}`}
                            className="mt-2 max-h-28 w-full rounded-md border border-border object-cover"
                          />
                        ) : null}
                        {todo.dueDate ? <p className="mt-1 text-xs text-muted-foreground">Échéance: {todo.dueDate}</p> : null}
                        {todo.assignedName ? <p className="mt-1 text-xs text-muted-foreground">Assigné à {todo.assignedName}</p> : null}
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
