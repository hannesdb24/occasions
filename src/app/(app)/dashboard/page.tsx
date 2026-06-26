import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGermanHolidays, filterHolidaysByState, getRelationshipHolidays } from "@/lib/holidays";
import Link from "next/link";
import Image from "next/image";

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

function formatDate(): string {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getAvatarColor(name: string): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  return colors[name.charCodeAt(0) % colors.length];
}

function PersonAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  const fontSize = size * 0.42;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white shrink-0 font-serif font-medium tracking-tight"
      style={{ width: size, height: size, fontSize, backgroundColor: getAvatarColor(name) }}
    >
      {initial}
    </div>
  );
}

export default async function DashboardPage() {
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

  type UpcomingItem = {
    id: string; contactId: string; contactName: string;
    title: string; date: Date; daysUntil: number; eventType: string;
  };

  const upcoming: UpcomingItem[] = [];

  const holidays = await getGermanHolidays(currentYear);
  const nextYearHolidays = await getGermanHolidays(currentYear + 1);
  const userHolidays = filterHolidaysByState([...holidays, ...nextYearHolidays], user.state);

  const addedHolidays = new Set<string>();
  for (const h of userHolidays) {
    const date = new Date(h.date);
    if (date >= now && date <= in365Days && !addedHolidays.has(h.date)) {
      addedHolidays.add(h.date);
      upcoming.push({ id: `h_${h.date}`, contactId: "", contactName: "", title: h.localName, date, daysUntil: Math.ceil((date.getTime() - now.getTime()) / 86400000), eventType: "HOLIDAY" });
    }
  }

  for (const contact of user.contacts) {
    for (const event of contact.events) {
      if (!event.isRecurring) {
        if (event.date >= now && event.date <= in365Days) {
          upcoming.push({ id: event.id, contactId: contact.id, contactName: contact.name, title: event.title, date: event.date, daysUntil: Math.ceil((event.date.getTime() - now.getTime()) / 86400000), eventType: event.eventType });
        }
      } else {
        const next = getNextOccurrence(event.date);
        if (next >= now && next <= in365Days) {
          upcoming.push({ id: event.id, contactId: contact.id, contactName: contact.name, title: event.title, date: next, daysUntil: getDaysUntil(event.date), eventType: event.eventType });
        }
      }
    }
    for (const year of [currentYear, currentYear + 1]) {
      const relHolidays = getRelationshipHolidays(contact.relationshipType as any, year);
      for (const h of relHolidays) {
        if (h.date >= now && h.date <= in365Days) {
          upcoming.push({ id: `rel_${contact.id}_${h.title}_${year}`, contactId: contact.id, contactName: contact.name, title: h.title, date: h.date, daysUntil: Math.ceil((h.date.getTime() - now.getTime()) / 86400000), eventType: "RELATIONSHIP_HOLIDAY" });
        }
      }
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  const contactCount = user.contacts.length;
  const upcomingCount = upcoming.length;
  const nextContactEvent = upcoming.find((e) => e.contactName);
  const comingUpNext = upcoming.filter((e) => e.contactName).slice(0, 4);
  const featuredEvent = nextContactEvent;

  const subtitle =
    contactCount === 0
      ? "Füge deine ersten Personen hinzu, um loszulegen."
      : `${contactCount} ${contactCount === 1 ? "Person" : "Personen"} in deinem Kreis.${featuredEvent ? ` Der nächste Anlass ist ${featuredEvent.title}${featuredEvent.contactName ? " von " + featuredEvent.contactName : ""} am ${featuredEvent.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}.` : ""}`;

  return (
    <div>
      {/* Header */}
      <header className="mb-12 pt-2">
        <p className="kicker mb-4">{formatDate()}</p>
        <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight text-[var(--foreground)] leading-[1.05] mb-6">
          {getGreeting(user.name)}
        </h1>
        <p className="editorial-italic text-xl max-w-2xl leading-relaxed">{subtitle}</p>
        {contactCount > 0 && (
          <Link href="/occasions" className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-[#c4704a] hover:text-[#a85c38]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
              <path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>
            </svg>
            Sieh alle Anlässe dieses Jahr
          </Link>
        )}
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        <Link href="/contacts">
          <div className="bg-card border-hairline rounded-2xl p-5 h-full transition-considered hover:border-[rgba(28,25,22,0.2)]">
            <div className="flex items-center gap-2 mb-3 text-[#c4704a]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <span className="kicker">Personen</span>
            </div>
            <div className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-[var(--foreground)]">{contactCount}</div>
          </div>
        </Link>

        <Link href="/occasions">
          <div className="bg-card border-hairline rounded-2xl p-5 h-full transition-considered hover:border-[rgba(28,25,22,0.2)]">
            <div className="flex items-center gap-2 mb-3 text-[#c4704a]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.127 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.125"/><path d="M14.62 18.8A2.25 2.25 0 1 1 18 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/>
              </svg>
              <span className="kicker">Anlässe</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-[var(--foreground)]">{upcomingCount}</span>
              <span className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>anlässe</span>
            </div>
          </div>
        </Link>

        <Link href="/wishlist">
          <div className="bg-card border-hairline rounded-2xl p-5 h-full transition-considered hover:border-[rgba(28,25,22,0.2)]">
            <div className="flex items-center gap-2 mb-3 text-[#c4704a]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
              </svg>
              <span className="kicker">Gesendet</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-[var(--foreground)]">0</span>
              <span className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>geschenke</span>
            </div>
          </div>
        </Link>

        <div className="bg-card border-hairline rounded-2xl p-5 h-full transition-considered hover:border-[rgba(28,25,22,0.2)]">
          <div className="flex items-center gap-2 mb-3 text-[#c4704a]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
            </svg>
            <span className="kicker">Diesen Monat</span>
          </div>
          <div className="font-serif font-medium text-3xl md:text-4xl tracking-tight text-[var(--foreground)]">€0</div>
          <p className="text-xs italic mt-2" style={{ color: "var(--muted-foreground)" }}>kein Budget gesetzt</p>
        </div>
      </section>

      {/* Hero + Coming up next */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
        {/* Featured event card */}
        <div className="lg:col-span-3">
          {featuredEvent ? (
            <article className="border-brass-hairline bg-card rounded-2xl overflow-hidden">
              <div className="aspect-[16/9] relative overflow-hidden bg-[#f0e4d4]">
                <Image
                  src="/hero.png"
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-8 md:p-10">
                <p className="kicker mb-3">Demnächst · in {featuredEvent.daysUntil} Tagen</p>
                <h2 className="font-serif text-3xl md:text-4xl font-medium leading-tight mb-4">
                  {featuredEvent.contactName ? `${featuredEvent.contactName}s ${featuredEvent.title}` : featuredEvent.title}
                </h2>
                <p className="editorial-italic text-lg mb-8 leading-relaxed">
                  Das wäre ein schöner Moment für ein Geschenk.
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-[rgba(28,25,22,0.08)]">
                  {featuredEvent.contactName && <PersonAvatar name={featuredEvent.contactName} size={48} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{featuredEvent.contactName}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {featuredEvent.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <Link
                    href={`/contacts/${featuredEvent.contactId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--foreground)] text-[var(--card)] text-sm font-medium transition-considered hover:opacity-90 border-brass-hairline"
                    style={{ boxShadow: "0 2px 24px -8px rgba(28,25,22,0.25)" }}
                  >
                    Profil ansehen
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ) : (
            <article className="border-brass-hairline bg-card rounded-2xl overflow-hidden">
              <div className="aspect-[16/9] relative overflow-hidden bg-[#f0e4d4]">
                <Image src="/hero.png" alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="p-8 md:p-10">
                <p className="kicker mb-3">Erste Schritte</p>
                <h2 className="font-serif text-3xl font-medium leading-tight mb-4">Leg deine erste Person an.</h2>
                <p className="editorial-italic text-lg mb-8 leading-relaxed">Füge Kontakte hinzu, um Geburtstage und Jubiläen nie mehr zu vergessen.</p>
                <Link
                  href="/contacts/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--foreground)] text-[var(--card)] text-sm font-medium transition-considered hover:opacity-90"
                >
                  Person hinzufügen
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </article>
          )}
        </div>

        {/* Sidebar sections */}
        <aside className="lg:col-span-2 space-y-12">
          <section>
            <h3 className="font-serif text-2xl font-medium text-[var(--foreground)]">Demnächst</h3>
            <div className="h-px bg-[#c4704a]/30 my-4 w-12" />
            {comingUpNext.length === 0 ? (
              <p className="editorial-italic text-sm">Keine Anlässe in Sicht.</p>
            ) : (
              <ul className="space-y-4">
                {comingUpNext.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/contacts/${item.contactId}`}
                      className="flex items-center gap-3 -mx-2 px-2 py-1 rounded-lg hover:bg-[rgba(28,25,22,0.03)] transition-considered"
                    >
                      <PersonAvatar name={item.contactName} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.contactName}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{item.title}</p>
                      </div>
                      <span className="text-xs text-[#c4704a] whitespace-nowrap">
                        {item.date.toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-serif text-2xl font-medium text-[var(--foreground)]">Zuletzt gesendet</h3>
            <div className="h-px bg-[#c4704a]/30 my-4 w-12" />
            <p className="editorial-italic text-sm">Noch nichts gesendet.</p>
          </section>

          {user.contacts.length > 0 && (
            <section>
              <h3 className="font-serif text-2xl font-medium text-[var(--foreground)]">Dein Kreis</h3>
              <div className="h-px bg-[#c4704a]/30 my-4 w-12" />
              <ul className="space-y-4">
                {user.contacts.slice(0, 4).map((contact) => (
                  <li key={contact.id} className="flex items-center gap-3">
                    <PersonAvatar name={contact.name} size={32} />
                    <p className="text-sm font-medium text-[var(--foreground)] truncate flex-1 min-w-0">{contact.name}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
