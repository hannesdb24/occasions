import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGermanHolidays, filterHolidaysByState, getRelationshipHolidays } from "@/lib/holidays";
import { CATEGORY_LABELS } from "@/types";
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

export default async function OccasionsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: { contacts: { include: { events: true } } },
  });

  if (!user) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in365Days = new Date(now);
  in365Days.setDate(in365Days.getDate() + 365);
  const currentYear = now.getFullYear();

  type OccasionItem = {
    id: string; contactId: string; contactName: string; contactCategory: string;
    title: string; date: Date; daysUntil: number; eventType: string;
  };

  const occasions: OccasionItem[] = [];

  const holidays = await getGermanHolidays(currentYear);
  const nextYearHolidays = await getGermanHolidays(currentYear + 1);
  const userHolidays = filterHolidaysByState([...holidays, ...nextYearHolidays], user.state);

  const addedHolidayDates = new Set<string>();
  for (const h of userHolidays) {
    const date = new Date(h.date);
    if (date >= now && date <= in365Days && !addedHolidayDates.has(h.date)) {
      addedHolidayDates.add(h.date);
      occasions.push({ id: `holiday_${h.date}`, contactId: "", contactName: "", contactCategory: "", title: h.localName, date, daysUntil: Math.ceil((date.getTime() - now.getTime()) / 86400000), eventType: "HOLIDAY" });
    }
  }

  for (const contact of user.contacts) {
    for (const event of contact.events) {
      if (!event.isRecurring) {
        if (event.date >= now && event.date <= in365Days) {
          occasions.push({ id: event.id, contactId: contact.id, contactName: contact.name, contactCategory: contact.category, title: event.title, date: event.date, daysUntil: Math.ceil((event.date.getTime() - now.getTime()) / 86400000), eventType: event.eventType });
        }
      } else {
        const next = getNextOccurrence(event.date);
        if (next >= now && next <= in365Days) {
          occasions.push({ id: event.id, contactId: contact.id, contactName: contact.name, contactCategory: contact.category, title: event.title, date: next, daysUntil: getDaysUntil(event.date), eventType: event.eventType });
        }
      }
    }
    for (const year of [currentYear, currentYear + 1]) {
      const relHolidays = getRelationshipHolidays(contact.relationshipType as any, year);
      for (const h of relHolidays) {
        if (h.date >= now && h.date <= in365Days) {
          occasions.push({ id: `rel_${contact.id}_${h.title}_${year}`, contactId: contact.id, contactName: contact.name, contactCategory: contact.category, title: `${h.title} (${contact.name})`, date: h.date, daysUntil: Math.ceil((h.date.getTime() - now.getTime()) / 86400000), eventType: "RELATIONSHIP_HOLIDAY" });
        }
      }
    }
  }

  occasions.sort((a, b) => a.date.getTime() - b.date.getTime());

  const grouped: Record<string, OccasionItem[]> = {};
  for (const item of occasions) {
    const monthKey = item.date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(item);
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="kicker mb-2">Kalender</p>
          <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">Anlässe</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Nächste 12 Monate</p>
        </div>
        <Link
          href="/contacts/new"
          className="px-5 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered"
        >
          + Kontakt
        </Link>
      </header>

      {occasions.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full border-hairline flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "var(--muted-foreground)" }}>Keine Anlässe im nächsten Jahr</p>
          <Link href="/contacts/new" className="mt-3 inline-block text-[#c4704a] text-sm font-medium">
            Kontakt anlegen →
          </Link>
        </div>
      )}

      <div className="space-y-10">
        {Object.entries(grouped).map(([month, items]) => (
          <section key={month}>
            <div className="flex items-center gap-3 mb-4">
              <span className="kicker">{month}</span>
              <div className="h-px flex-1 bg-[rgba(28,25,22,0.06)]" />
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-card border-hairline rounded-xl hover:border-[rgba(28,25,22,0.2)] transition-considered"
                >
                  <div className="flex-shrink-0 w-14 text-center">
                    {item.daysUntil === 0 ? (
                      <div className="w-10 h-10 rounded-full bg-[#c4704a]/10 text-[#c4704a] flex items-center justify-center text-lg mx-auto">🎉</div>
                    ) : (
                      <div>
                        <div className="font-serif text-xl font-medium text-[#c4704a] leading-none">{item.daysUntil}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>Tage</div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--foreground)] truncate">{item.title}</div>
                    <div className="text-sm mt-0.5 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <span>{item.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}</span>
                      {item.contactName && (
                        <Link href={`/contacts/${item.contactId}`} className="hover:text-[#c4704a] transition-considered">
                          · {item.contactName}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.contactCategory && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(28,25,22,0.05)] text-[var(--foreground)] font-medium">
                        {CATEGORY_LABELS[item.contactCategory]}
                      </span>
                    )}
                    {item.eventType === "HOLIDAY" && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#c4704a]/10 text-[#c4704a] font-medium">
                        Feiertag
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
