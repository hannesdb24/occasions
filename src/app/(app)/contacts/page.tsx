import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CATEGORY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/types";

function getAvatarColor(name: string): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  return colors[name.charCodeAt(0) % colors.length];
}

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
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="kicker mb-2">Dein Kreis</p>
          <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">Personen</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {contacts.length === 0
              ? "Noch niemanden hinzugefügt"
              : `${contacts.length} ${contacts.length === 1 ? "Person" : "Personen"} in deinem Kreis`}
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="px-5 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered"
        >
          + Hinzufügen
        </Link>
      </header>

      {contacts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full border-hairline flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "var(--muted-foreground)" }}>Noch keine Personen</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Füge deine erste Person hinzu, um loszulegen.</p>
          <Link href="/contacts/new" className="mt-4 inline-block text-[#c4704a] text-sm font-medium">
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
              <div className="flex items-center gap-3 mb-3">
                <span className="kicker">{CATEGORY_LABELS[cat]}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {items.length}</span>
              </div>
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
                  const avatarColor = getAvatarColor(contact.name);

                  return (
                    <Link
                      key={contact.id}
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-4 p-4 bg-card border-hairline rounded-xl hover:border-[rgba(28,25,22,0.2)] transition-considered group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-serif font-medium flex-shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--foreground)] group-hover:text-[#c4704a] transition-considered truncate">
                          {contact.name}
                        </div>
                        <div className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                          {contact.relationshipType && (
                            <span>{RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}</span>
                          )}
                          {birthday && (
                            <span>
                              · {new Date(birthday).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                              {daysUntil !== null && daysUntil <= 30 && (
                                <span className="ml-1 text-[#c4704a] font-medium">in {daysUntil}d</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
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
