import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

function getNextOccurrence(date: Date): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setFullYear(now.getFullYear());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return next;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { emailRemindersEnabled: true },
    select: {
      id: true,
      name: true,
      email: true,
      reminderLeadDays: true,
      contacts: {
        select: {
          name: true,
          events: {
            select: { title: true, date: true, isRecurring: true, eventType: true },
          },
        },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    const upcoming: { contactName: string; title: string; date: Date; daysUntil: number }[] = [];

    for (const contact of user.contacts) {
      for (const event of contact.events) {
        const eventDate = event.isRecurring
          ? getNextOccurrence(event.date)
          : new Date(event.date);

        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil >= 0 && daysUntil <= user.reminderLeadDays) {
          upcoming.push({
            contactName: contact.name,
            title: event.title,
            date: eventDate,
            daysUntil,
          });
        }
      }
    }

    if (upcoming.length === 0) continue;

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    try {
      await sendReminderEmail({
        to: user.email,
        userName: user.name ?? "du",
        events: upcoming,
      });
      sent++;
    } catch (err) {
      console.error(`Fehler beim Senden an ${user.email}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, sent, errors, usersChecked: users.length });
}
