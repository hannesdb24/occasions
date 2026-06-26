import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGermanHolidays, filterHolidaysByState, getRelationshipHolidays } from "@/lib/holidays";
import type { UpcomingEvent } from "@/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      contacts: {
        include: {
          events: true,
          linkedUser: { select: { wishList: { select: { shareToken: true, isPublic: true } } } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 });

  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);

  const upcomingEvents: UpcomingEvent[] = [];
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

  // Deutsche Feiertage laden
  const holidaysThisYear = await getGermanHolidays(currentYear);
  const holidaysNextYear = await getGermanHolidays(nextYear);

  for (const contact of user.contacts) {
    const state = contact.state ?? user.state;

    // Wiederkehrende Events (Geburtstag, Jubiläum)
    for (const event of contact.events) {
      const dates = event.isRecurring
        ? [currentYear, nextYear].map((y) => {
            const d = new Date(event.date);
            return new Date(y, d.getMonth(), d.getDate());
          })
        : [event.date];

      for (const date of dates) {
        if (date >= now && date <= future) {
          const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          upcomingEvents.push({
            id: event.id,
            contactId: contact.id,
            contactName: contact.name,
            contactCategory: contact.category,
            title: event.title,
            date,
            daysUntil,
            eventType: event.eventType,
            wishListShareToken: contact.linkedUser?.wishList?.shareToken ?? null,
          });
        }
      }
    }

    // Beziehungs-Feiertage (Muttertag, Vatertag, Valentinstag)
    for (const year of [currentYear, nextYear]) {
      const relHolidays = getRelationshipHolidays(contact.relationshipType as any, year);
      for (const h of relHolidays) {
        if (h.date >= now && h.date <= future) {
          const daysUntil = Math.ceil((h.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          upcomingEvents.push({
            id: `rel_${contact.id}_${h.title}_${year}`,
            contactId: contact.id,
            contactName: contact.name,
            contactCategory: contact.category,
            title: h.title,
            date: h.date,
            daysUntil,
            eventType: "RELATIONSHIP_HOLIDAY",
            wishListShareToken: contact.linkedUser?.wishList?.shareToken ?? null,
          });
        }
      }
    }

    // Deutsche Feiertage für diesen Kontakt
    const contactHolidays = [
      ...filterHolidaysByState(holidaysThisYear, state),
      ...filterHolidaysByState(holidaysNextYear, state),
    ];

    for (const h of contactHolidays) {
      const date = new Date(h.date);
      if (date >= now && date <= future) {
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        // Nur einmal pro Feiertag (nicht für jeden Kontakt)
        const isDuplicate = upcomingEvents.some(
          (e) => e.eventType === "HOLIDAY" && e.title === h.localName && e.date.toDateString() === date.toDateString()
        );
        if (!isDuplicate) {
          upcomingEvents.push({
            id: `holiday_${h.date}`,
            contactId: "",
            contactName: "",
            contactCategory: "",
            title: h.localName,
            date,
            daysUntil,
            eventType: "HOLIDAY",
          });
        }
      }
    }
  }

  // Nach Datum sortieren
  upcomingEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  return NextResponse.json(upcomingEvents);
}
