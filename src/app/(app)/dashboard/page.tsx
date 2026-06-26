import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGermanHolidays, filterHolidaysByState, getRelationshipHolidays } from "@/lib/holidays";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import Link from "next/link";

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setFullYear(now.getFullYear());
  if (target < now) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getNextOccurrence(date: Date): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setFullYear(now.getFullYear());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return next;
}

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: {
      contacts: {
        include: { events: true },
      },
    },
  });

  if (!user) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in90Days = new Date(now);
  in90Days.setDate(in90Days.getDate() + 90);

  type UpcomingItem = {
    id: string;
    contactId: string;
    contactName: string;
    contactCategory: string;
    title: string;
    date: Date;
    daysUntil: number;
    eventType: string;
  };

  const upcoming: UpcomingItem[] = [];
  const currentYear = now.getFullYear();

  const holidays = await getGermanHolidays(currentYear);
  const nextYearHolidays = await getGermanHolidays(currentYear + 1);
  const allHolidays = [...holidays, ...nextYearHolidays];
  const userHolidays = filterHolidaysByState(allHolidays, user.state);

  // Feiertage einmalig hinzufügen
  const addedHolidayDates = new Set<string>();
  for (const h of userHolidays) {
    const date = new Date(h.date);
    if (date >= now && date <= in90Days) {
      const key = h.date;
      if (!addedHolidayDates.has(key)) {
        addedHolidayDates.add(key);
        upcoming.push({
          id: `holiday_${h.date}`,
          contactId: "",
          contactName: "",
          contactCategory: "",
          title: h.localName,
          date,
          daysUntil: Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          eventType: "HOLIDAY",
        });
      }
    }
  }

  for (const contact of user.contacts) {
    // Geburtstage & Jubiläen
    for (const event of contact.events) {
      if (!event.isRecurring) {
        if (event.date >= now && event.date <= in90Days) {
          upcoming.push({
            id: event.id,
            contactId: contact.id,
            contactName: contact.name,
            contactCategory: contact.category,
            title: event.title,
            date: event.date,
            daysUntil: Math.ceil((event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            eventType: event.eventType,
          });
        }
      } else {
        const next = getNextOccurrence(event.date);
        if (next >= now && next <= in90Days) {
          upcoming.push({
            id: event.id,
            contactId: contact.id,
            contactName: contact.name,
            contactCategory: contact.category,
            title: event.title,
            date: next,
            daysUntil: getDaysUntil(event.date),
            eventType: event.eventType,
          });
        }
      }
    }

    // Beziehungs-Feiertage
    for (const year of [currentYear, currentYear + 1]) {
      const relHolidays = getRelationshipHolidays(contact.relationshipType as any, year);
      for (const h of relHolidays) {
        if (h.date >= now && h.date <= in90Days) {
          upcoming.push({
            id: `rel_${contact.id}_${h.title}_${year}`,
            contactId: contact.id,
            contactName: contact.name,
            contactCategory: contact.category,
            title: `${h.title} (${contact.name})`,
            date: h.date,
            daysUntil: Math.ceil((h.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            eventType: "RELATIONSHIP_HOLIDAY",
          });
        }
      }
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  const todayItems = upcoming.filter((e) => e.daysUntil === 0);
  const soonItems = upcoming.filter((e) => e.daysUntil > 0 && e.daysUntil <= 7);
  const laterItems = upcoming.filter((e) => e.daysUntil > 7);

  function EventCard({ item }: { item: UpcomingItem }) {
    const isHoliday = item.eventType === "HOLIDAY";
    const categoryClass = item.contactCategory
      ? CATEGORY_COLORS[item.contactCategory] ?? "bg-gray-100 text-gray-700"
      : "";

    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all">
        <div className="flex-shrink-0 w-14 text-center">
          <div className="text-2xl font-bold text-indigo-600">{item.daysUntil === 0 ? "🎉" : item.daysUntil}</div>
          {item.daysUntil > 0 && <div className="text-xs text-gray-400">Tage</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{item.title}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {item.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
            {item.contactName && (
              <span className="ml-2">
                <Link href={`/contacts/${item.contactId}`} className="hover:text-indigo-600">
                  {item.contactName}
                </Link>
              </span>
            )}
          </div>
        </div>
        {item.contactCategory && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${categoryClass}`}>
            {CATEGORY_LABELS[item.contactCategory]}
          </span>
        )}
        {isHoliday && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium flex-shrink-0">
            Feiertag
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guten Tag, {user.name} 👋</h1>
          <p className="text-gray-500 mt-1">Nächste 90 Tage im Überblick</p>
        </div>
        <Link
          href="/contacts/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Kontakt hinzufügen
        </Link>
      </div>

      {upcoming.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-medium">Keine Anlässe in den nächsten 90 Tagen</p>
          <p className="text-sm mt-2">Füge Kontakte hinzu, um Anlässe zu sehen.</p>
          <Link href="/contacts/new" className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium">
            Ersten Kontakt anlegen →
          </Link>
        </div>
      )}

      {todayItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Heute 🎉</h2>
          <div className="space-y-2">
            {todayItems.map((item) => <EventCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {soonItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Diese Woche</h2>
          <div className="space-y-2">
            {soonItems.map((item) => <EventCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {laterItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Demnächst</h2>
          <div className="space-y-2">
            {laterItems.map((item) => <EventCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
