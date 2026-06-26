import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  date: z.string(),
  isRecurring: z.boolean().default(true),
  eventType: z.enum(["CUSTOM", "ANNIVERSARY"]).default("CUSTOM"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const contact = await prisma.contact.findFirst({ where: { id, userId: session.user.id } });
  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      contactId: id,
      title: parsed.data.title,
      date: new Date(parsed.data.date),
      isRecurring: parsed.data.isRecurring,
      eventType: parsed.data.eventType,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
