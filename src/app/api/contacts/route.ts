import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  birthday: z.string().optional().nullable(),
  category: z.enum(["FAMILY", "PARTNER", "FRIENDS", "COLLEAGUES", "OTHER"]),
  relationshipType: z
    .enum(["MOTHER","FATHER","STEPMOTHER","STEPFATHER","PARTNER","SPOUSE","SIBLING","BROTHER_IN_LAW","SISTER_IN_LAW","GRANDPARENT","CHILD","UNCLE","AUNT","NEPHEW","NIECE","FRIEND","COLLEAGUE","OTHER"])
    .optional()
    .nullable(),
  state: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const contacts = await prisma.contact.findMany({
    where: {
      userId: session.user.id,
      ...(category ? { category: category as any } : {}),
    },
    include: {
      events: { orderBy: { date: "asc" } },
      linkedUser: { select: { id: true, name: true, image: true } },
      linksFrom: { select: { id: true, toId: true, linkType: true } },
      linksTo:   { select: { id: true, fromId: true, linkType: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createContactSchema.parse(body);

    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        name: data.name,
        birthday: data.birthday ? new Date(data.birthday) : null,
        category: data.category,
        relationshipType: data.relationshipType ?? null,
        state: data.state ?? null,
        notes: data.notes ?? null,
        photoUrl: data.photoUrl ?? null,
      },
    });

    // Geburtstags-Event automatisch anlegen
    if (data.birthday) {
      await prisma.event.create({
        data: {
          contactId: contact.id,
          title: `Geburtstag von ${data.name}`,
          date: new Date(data.birthday),
          isRecurring: true,
          eventType: "BIRTHDAY",
        },
      });
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
