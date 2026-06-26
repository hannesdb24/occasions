import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGermanHolidays, filterHolidaysByState, getRelationshipHolidays } from "@/lib/holidays";
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
  }).toUpperCase();
}

function ContactAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${color}`}>
      {initial}
    </div>
  );
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
  const currentYear = now.getFullYear();

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

  const holidays = await getGermanHolidays(currentYear);
  const nextYearHolidays = await getGermanHolidays(currentYear + 1);
  const userHolidays = filterHolidaysByState([...holidays, ...nextYearHolidays], user.state);

  const addedHolidayDates = new Set<string>();
  for (const h of userHolidays) {
    const date = new Date(h.date);
    if (date >= now && date <= in90Days && !addedHolidayDates.has(h.date)) {
      addedHolidayDates.add(h.date);
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
            title: `${h.title}`,
            date: h.date,
            daysUntil: Math.ceil((h.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            eventType: "RELATIONSHIP_HOLIDAY",
          });
        }
      }
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  const contactCount = user.contacts.length;
  const upcomingCount = upcoming.length;
  const nextEvent = upcoming.find((e) => e.contactName);

  const subtitle =
    contactCount === 0
      ? "Füge deine ersten Kontakte hinzu, um loszulegen."
      : contactCount === 1
      ? `Eine Person in deinem Kreis.${nextEvent ? ` Der nächste Anlass ist ${nextEvent.title}${nextEvent.contactName ? " von " + nextEvent.contactName : ""} am ${nextEvent.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}.` : ""}`
      : `${contactCount} Personen in deinem Kreis.${nextEvent ? ` Der nächste Anlass ist ${nextEvent.title}${nextEvent.contactName ? " von " + nextEvent.contactName : ""} am ${nextEvent.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}.` : ""}`;

  const comingUp = upcoming.filter((e) => e.contactName).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 mb-3">
          {formatDate(new Date())}
        </p>
        <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-4" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
          {getGreeting(user.name)}
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">{subtitle}</p>
        {contactCount > 0 && (
          <Link href="/occasions" className="inline-block mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            Sieh alle Anlässe dieses Jahr →
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Personen</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{contactCount}</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Anlässe</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{upcomingCount}</div>
          <div className="text-xs text-gray-400 mt-1">in 90 Tagen</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Geschenke</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs text-gray-400 mt-1">dieses Jahr</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Diesen Monat</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">€0</div>
          <div className="text-xs text-gray-400 mt-1">kein Budget</div>
        </div>
      </div>

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden h-72 bg-gradient-to-br from-rose-100 via-amber-50 to-orange-100">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="text-5xl mb-4">💝</div>
            <p className="text-gray-600 font-medium text-lg">Vergiss nie einen Moment</p>
            <p className="text-gray-400 text-sm mt-1">Geburtstage, Jubiläen, besondere Anlässe</p>
            {contactCount === 0 && (
              <Link
                href="/contacts/new"
                className="mt-5 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Erste Person hinzufügen
              </Link>
            )}
          </div>
        </div>

        {/* Coming up next */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-5">Demnächst</h3>
          {comingUp.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-gray-400 text-sm">Keine Anlässe in den nächsten 90 Tagen</p>
              <Link href="/contacts/new" className="mt-3 text-sm text-emerald-600 font-medium">
                Kontakt anlegen →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {comingUp.map((item) => (
                <Link
                  key={item.id}
                  href={`/contacts/${item.contactId}`}
                  className="flex items-center gap-3 group"
                >
                  <ContactAvatar name={item.contactName} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm group-hover:text-emerald-600 transition-colors truncate">
                      {item.contactName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{item.title}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-500 flex-shrink-0">
                    {item.date.toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                  </div>
                </Link>
              ))}
              {upcoming.filter((e) => e.contactName).length > 4 && (
                <Link href="/occasions" className="block text-xs text-center text-gray-400 hover:text-gray-600 pt-2">
                  Alle anzeigen →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recently sent */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">Zuletzt gesendet</h3>
        <p className="text-sm text-gray-400">Noch nichts gesendet.</p>
      </div>
    </div>
  );
}
