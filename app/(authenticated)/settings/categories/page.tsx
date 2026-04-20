import {
  createExpenseCategoryAction,
  createTodoCategoryAction,
  deleteExpenseCategoryAction,
  deleteTodoCategoryAction,
  toggleExpenseCategoryActiveAction,
  updateExpenseCategoryAction,
  updateTodoCategoryAction,
} from "@/app/(authenticated)/settings/categories/actions";
import { SettingsSectionIntro } from "@/components/settings/SettingsSectionIntro";
import { getSettingsCategoriesData } from "@/lib/db/settings";

const expenseZones = ["global", "chamade", "pavillon", "poolhouse", "piscine", "vignes", "jardin"] as const;

export default async function SettingsCategoriesPage() {
  const data = await getSettingsCategoriesData();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <SettingsSectionIntro
          title="Catégories"
          description="Gère les catégories Todo et Dépenses avec migration sécurisée des éléments liés avant suppression."
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">A) Catégories todos</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Crée, édite et supprime des catégories. En cas de todos liés, la migration vers une autre catégorie est proposée.
          </p>
        </div>

        <form action={createTodoCategoryAction} className="grid gap-2 rounded-xl border border-zinc-200 p-3 md:grid-cols-4">
          <input name="name" required minLength={2} placeholder="Nom" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
          <input name="icon" placeholder="Icône (optionnel)" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
          <input name="color" placeholder="#0f172a" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
          <button type="submit" className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white">
            Ajouter
          </button>
        </form>

        <div className="space-y-2">
          {data.todoCategories.map((category) => (
            <article key={category.id} className="rounded-xl border border-zinc-200 p-3">
              <p className="mb-3 text-xs font-medium text-zinc-500">
                Todos liés: <span className="font-semibold text-zinc-900">{category.linkedTodos}</span>
              </p>

              <form action={updateTodoCategoryAction} className="grid gap-2 md:grid-cols-5">
                <input type="hidden" name="categoryId" value={category.id} />
                <input
                  name="name"
                  defaultValue={category.name}
                  required
                  minLength={2}
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <input
                  name="icon"
                  defaultValue={category.icon ?? ""}
                  placeholder="Icône"
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <input
                  name="color"
                  defaultValue={category.color ?? ""}
                  placeholder="Couleur"
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <div className="text-xs text-zinc-600 md:self-center">
                  {category.linkedTodos > 0 ? "Suppression avec migration recommandée" : "Aucun todo lié"}
                </div>
                <button type="submit" className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white">
                  Enregistrer
                </button>
              </form>

              <form action={deleteTodoCategoryAction} className="mt-2 grid gap-2 md:grid-cols-[1fr_180px]">
                <input type="hidden" name="categoryId" value={category.id} />
                <select
                  name="replacementCategoryId"
                  required={category.linkedTodos > 0}
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                  defaultValue=""
                >
                  <option value="">
                    {category.linkedTodos > 0 ? "Migrer les todos vers..." : "Migration optionnelle"}
                  </option>
                  {data.todoCategories
                    .filter((candidate) => candidate.id !== category.id)
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </option>
                    ))}
                </select>
                <button type="submit" className="h-9 rounded-md bg-red-100 px-3 text-sm font-medium text-red-700">
                  Supprimer
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">B) Catégories dépenses OPEX/CAPEX</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Crée, édite, active/désactive et supprime des catégories de dépenses. Si des dépenses sont liées, une migration vers
            une catégorie de même nature est obligatoire.
          </p>
        </div>

        <form action={createExpenseCategoryAction} className="grid gap-2 rounded-xl border border-zinc-200 p-3 md:grid-cols-7">
          <input name="name" required minLength={2} placeholder="Nom" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
          <select name="nature" defaultValue="OPEX" className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
            <option value="OPEX">OPEX</option>
            <option value="CAPEX">CAPEX</option>
          </select>
          <select name="zone" defaultValue="global" className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
            {expenseZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <input name="icon" placeholder="Icône" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
          <input name="color" placeholder="Couleur" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
          <input
            name="amortizationYears"
            type="number"
            min={1}
            placeholder="Amort. (ans)"
            className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
          />
          <button type="submit" className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white">
            Ajouter
          </button>
        </form>

        <div className="space-y-2">
          {data.expenseCategories.map((category) => (
            <article key={category.id} className="rounded-xl border border-zinc-200 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
                <span>
                  Nature: <span className="font-semibold text-zinc-900">{category.nature}</span> - Dépenses liées:{" "}
                  <span className="font-semibold text-zinc-900">{category.linkedExpenses}</span>
                </span>
                <span className={category.isActive ? "text-emerald-700" : "text-zinc-500"}>
                  {category.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <form action={updateExpenseCategoryAction} className="grid gap-2 md:grid-cols-7">
                <input type="hidden" name="categoryId" value={category.id} />
                <input
                  name="name"
                  defaultValue={category.name}
                  required
                  minLength={2}
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <input type="hidden" name="nature" value={category.nature} />
                <select name="zone" defaultValue={category.zone ?? "global"} className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
                  {expenseZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                <input
                  name="icon"
                  defaultValue={category.icon ?? ""}
                  placeholder="Icône"
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <input
                  name="color"
                  defaultValue={category.color ?? ""}
                  placeholder="Couleur"
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <input
                  name="amortizationYears"
                  defaultValue={category.amortizationYears ?? ""}
                  type="number"
                  min={1}
                  placeholder="Amort. (ans)"
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <button type="submit" className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white">
                  Enregistrer
                </button>
              </form>

              <div className="mt-2 grid gap-2 md:grid-cols-[180px_1fr_180px]">
                <form action={toggleExpenseCategoryActiveAction}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="isActive" value={category.isActive ? "false" : "true"} />
                  <button
                    type="submit"
                    className={`h-9 w-full rounded-md px-3 text-sm font-medium ${
                      category.isActive ? "bg-zinc-100 text-zinc-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {category.isActive ? "Désactiver" : "Activer"}
                  </button>
                </form>

                <form action={deleteExpenseCategoryAction} className="grid gap-2 md:grid-cols-[1fr_180px] md:col-span-2">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <select
                    name="replacementCategoryId"
                    required={category.linkedExpenses > 0}
                    defaultValue=""
                    className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                  >
                    <option value="">
                      {category.linkedExpenses > 0
                        ? `Migration obligatoire vers une autre ${category.nature}`
                        : "Migration optionnelle"}
                    </option>
                    {data.expenseCategories
                      .filter((candidate) => candidate.id !== category.id && candidate.nature === category.nature)
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                  </select>
                  <button type="submit" className="h-9 rounded-md bg-red-100 px-3 text-sm font-medium text-red-700">
                    Supprimer
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
