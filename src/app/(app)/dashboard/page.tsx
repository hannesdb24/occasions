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

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const firstName = name?.split(" ")[0] ?? "";
  if (hour < 12) return `Guten Morgen, ${firstName}.`;
  if (hour < 18) return `Guten Tag, ${firstName}.`;
  return `Guten Abend, ${firstName}.`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
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

  const contactCount = user.contacts.length;
  const upcomingCount = upcoming.length;
  const soonCount = todayItems.length + soonItems.length;

  function EventCard({ item }: { item: UpcomingItem }) {
    const isHoliday = item.eventType === "HOLIDAY";
    const categoryClass = item.contactCategory
      ? CATEGORY_COLORS[item.contactCategory] ?? "bg-gray-100 text-gray-700"
      : "";

    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-100 hover:shadow-sm transition-all">
        <div className="flex-shrink-0 w-12 text-center">
          {item.daysUntil === 0 ? (
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-lg mx-auto">🎉</div>
          ) : (
            <div>
              <div className="text-xl font-bold text-violet-600 leading-none">{item.daysUntil}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Tage</div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{item.title}</div>
          <div className="text-sm text-gray-400 mt-0.5">
            {item.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
            {item.contactName && (
              <Link href={`/contacts/${item.contactId}`} className="ml-2 hover:text-violet-600 transition-colors">
                {item.contactName}
              </Link>
            )}
          </div>
        </div>
        {item.contactCategory && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${categoryClass}`}>
            {CATEGORY_LABELS[item.contactCategory]}
          </span>
        )}
        {isHoliday && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium flex-shrink-0">
            Feiertag
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">{formatDate(new Date())}</p>
        <h1 className="text-2xl font-semibold text-gray-900">{getGreeting(user.name)}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{contactCount}</div>
          <div className="text-sm text-gray-400 mt-0.5">
            {contactCount === 1 ? "Person" : "Personen"} in deinem Kreis
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{upcomingCount}</div>
          <div className="text-sm text-gray-400 mt-0.5">Anlässe in 90 Tagen</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-2xl font-bold text-violet-600">{soonCount}</div>
          <div className="text-sm text-gray-400 mt-0.5">Diese Woche</div>
        </div>
      </div>

      {/* Empty state */}
      {upcoming.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-medium text-gray-500">Keine Anlässe in den nächsten 90 Tagen</p>
          <p className="text-sm mt-1">Füge Kontakte hinzu, um Anlässe zu sehen.</p>
          <Link href="/contacts/new" className="mt-4 inline-block text-violet-600 hover:text-violet-700 text-sm font-medium">
            Ersten Kontakt anlegen →
          </Link>
        </div>
      )}

      {/* Upcoming events */}
      {todayItems.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Heute</h2>
          <div className="space-y-2">
            {todayItems.map((item) => <EventCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {soonItems.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Diese Woche</h2>
          <div className="space-y-2">
            {soonItems.map((item) => <EventCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {laterItems.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demnächst</h2>
          <div className="space-y-2">
            {laterItems.map((item) => <EventCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <div className="mt-6 text-center">
          <Link href="/occasions" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            Alle Anlässe ansehen →
          </Link>
        </div>
      )}
    </div>
  );
}
