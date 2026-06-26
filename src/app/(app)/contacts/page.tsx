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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Meine Kontakte</h1>
        <Link
          href="/contacts/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Kontakt hinzufügen
        </Link>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg font-medium">Noch keine Kontakte</p>
          <Link href="/contacts/new" className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium">
            Ersten Kontakt anlegen →
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {CATEGORY_LABELS[cat]} ({items.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      className="bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {contact.name}
                          </div>
                          {contact.relationshipType && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}
                            </div>
                          )}
                          {birthday && (
                            <div className="text-xs text-gray-400 mt-1">
                              🎂 {new Date(birthday).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                              {daysUntil !== null && daysUntil <= 30 && (
                                <span className="ml-1 text-indigo-500 font-medium">
                                  (in {daysUntil} {daysUntil === 1 ? "Tag" : "Tagen"})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLORS[cat]}`}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </div>
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
