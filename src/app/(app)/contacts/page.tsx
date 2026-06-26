import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/types";

export default async function ContactsPage() {
  const session = await auth();
  const contacts = await prisma.contact.findMany({
    where: { userId: session!.user!.id },
    include: { events: { where: { eventType: "BIRTHDAY" } } },
    orderBy: { name: "asc" },
  });

  const grouped = contacts.reduce(
    (acc, c) => {
      const key = c.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    },
    {} as Record<string, typeof contacts>
  );

  const categoryOrder = ["FAMILY", "FRIENDS", "COLLEAGUES", "OTHER"];

  function ContactAvatar({ name }: { name: string }) {
    return (
      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personen</h1>
          <p className="text-sm text-gray-400 mt-1">
            {contacts.length === 0
              ? "Noch niemanden hinzugefügt"
              : `${contacts.length} ${contacts.length === 1 ? "Person" : "Personen"} in deinem Kreis`}
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          + Hinzufügen
        </Link>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-medium text-gray-500">Noch keine Personen</p>
          <p className="text-sm text-gray-400 mt-1">Füge deine erste Person hinzu, um loszulegen.</p>
          <Link href="/contacts/new" className="mt-4 inline-block text-violet-600 text-sm font-medium">
            Erste Person anlegen →
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {CATEGORY_LABELS[cat]} · {items.length}
              </h2>
              <div className="space-y-2">
                {items.map((contact) => {
                  const birthday = contact.events[0]?.date;
                  const now = new Date();
                  let daysUntil: number | null = null;
                  if (birthday) {
                    const next = new Date(birthday);
                    next.setFullYear(now.getFullYear());
                    if (next < now) next.setFullYear(now.getFullYear() + 1);
                    daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  }

                  return (
                    <Link
                      key={contact.id}
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-100 hover:shadow-sm transition-all group"
                    >
                      <ContactAvatar name={contact.name} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                          {contact.name}
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                          {contact.relationshipType && (
                            <span>{RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}</span>
                          )}
                          {birthday && (
                            <span>
                              · 🎂 {new Date(birthday).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                              {daysUntil !== null && daysUntil <= 30 && (
                                <span className="ml-1 text-violet-500 font-medium">in {daysUntil}d</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
