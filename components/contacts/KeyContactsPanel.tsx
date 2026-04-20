type KeyContact = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  serviceZone: string | null;
  notes: string | null;
  isEmergency: boolean | null;
};

export function KeyContactsPanel({ contacts }: { contacts: KeyContact[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">Contacts clé</h2>
        <a href="/contacts" className="text-xs font-medium text-zinc-600 underline underline-offset-2">
          Gérer
        </a>
      </div>
      <div className="mt-3 space-y-2">
        {contacts.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun contact configuré.</p>
        ) : (
          contacts.map((contact) => (
            <article key={contact.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-zinc-900">{contact.name}</p>
                {contact.isEmergency ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Urgence</span>
                ) : null}
              </div>
              <p className="text-xs text-zinc-600">
                {contact.role}
                {contact.serviceZone ? ` • ${contact.serviceZone}` : ""}
              </p>
              <p className="mt-1 text-xs text-zinc-700">
                {contact.phone ? `Tél: ${contact.phone}` : ""}
                {contact.phone && contact.email ? " • " : ""}
                {contact.email ? `Email: ${contact.email}` : ""}
              </p>
              {contact.notes ? <p className="mt-1 text-xs text-zinc-500">{contact.notes}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
