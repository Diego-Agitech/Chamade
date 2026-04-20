import {
  createKeyContactAction,
  deleteKeyContactAction,
  updateKeyContactAction,
} from "@/app/(authenticated)/settings/contacts/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllKeyContacts } from "@/lib/db/contacts";

export default async function ContactsPage() {
  const contacts = await getAllKeyContacts();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contacts clé"
        description="Tous les prestataires et contacts d'urgence dans une vue dédiée."
        actions={
          <a
            href="#contact-create"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Ajouter un contact
          </a>
        }
      />

      <section id="contact-create" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Nouveau contact
        </h2>
        <form action={createKeyContactAction} className="mt-3 grid gap-2 rounded-xl border border-border p-3 md:grid-cols-3">
          <input name="name" required minLength={2} placeholder="Nom" className="h-9 rounded-md border border-border px-2 text-sm" />
          <input name="role" required minLength={2} placeholder="Rôle" className="h-9 rounded-md border border-border px-2 text-sm" />
          <input name="phone" placeholder="Téléphone" className="h-9 rounded-md border border-border px-2 text-sm" />
          <input name="email" type="email" placeholder="Email" className="h-9 rounded-md border border-border px-2 text-sm" />
          <input name="serviceZone" placeholder="Zone/Service" className="h-9 rounded-md border border-border px-2 text-sm" />
          <label className="flex h-9 items-center gap-2 rounded-md border border-border px-2 text-sm text-muted-foreground">
            <input type="checkbox" name="isEmergency" className="h-4 w-4" />
            Contact urgence
          </label>
          <textarea name="notes" placeholder="Notes" className="md:col-span-2 rounded-md border border-border px-2 py-2 text-sm" />
          <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
            Ajouter
          </button>
        </form>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {contacts.length === 0 ? (
          <EmptyState
            title="Aucun contact enregistré."
            description="Ajoute un premier contact pour alimenter le dashboard."
            className="py-8"
          />
        ) : (
          contacts.map((contact) => (
            <article key={contact.id} className="rounded-xl border border-border p-3">
              <form action={updateKeyContactAction} className="grid gap-2 md:grid-cols-3">
                <input type="hidden" name="id" value={contact.id} />
                <input name="name" defaultValue={contact.name} required minLength={2} className="h-9 rounded-md border border-border px-2 text-sm" />
                <input name="role" defaultValue={contact.role} required minLength={2} className="h-9 rounded-md border border-border px-2 text-sm" />
                <input name="phone" defaultValue={contact.phone ?? ""} className="h-9 rounded-md border border-border px-2 text-sm" />
                <input name="email" type="email" defaultValue={contact.email ?? ""} className="h-9 rounded-md border border-border px-2 text-sm" />
                <input name="serviceZone" defaultValue={contact.serviceZone ?? ""} className="h-9 rounded-md border border-border px-2 text-sm" />
                <label className="flex h-9 items-center gap-2 rounded-md border border-border px-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="isEmergency" defaultChecked={Boolean(contact.isEmergency)} className="h-4 w-4" />
                  Urgence
                </label>
                <label className="flex h-9 items-center gap-2 rounded-md border border-border px-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="isActive" defaultChecked={Boolean(contact.isActive)} className="h-4 w-4" />
                  Actif
                </label>
                <textarea name="notes" defaultValue={contact.notes ?? ""} className="md:col-span-2 rounded-md border border-border px-2 py-2 text-sm" />
                <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                  Enregistrer
                </button>
              </form>
              <form action={deleteKeyContactAction} className="mt-2">
                <input type="hidden" name="id" value={contact.id} />
                <button type="submit" className="h-9 rounded-md bg-red-100 px-3 text-sm font-medium text-red-700">
                  Supprimer
                </button>
              </form>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
