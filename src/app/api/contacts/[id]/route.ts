import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  birthday: z.string().optional().nullable(),
  category: z.enum(["FAMILY", "FRIENDS", "COLLEAGUES", "OTHER"]).optional(),
  relationshipType: z
    .enum(["MOTHER","FATHER","STEPMOTHER","STEPFATHER","PARTNER","SPOUSE","SIBLING","GRANDPARENT","CHILD","FRIEND","COLLEAGUE","OTHER"])
    .optional()
    .nullable(),
  state: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

async function getContactAndVerify(id: string, userId: string) {
  return prisma.contact.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, userId: session.user.id },
    include: {
      events: { orderBy: { date: "asc" } },
      linkedUser: { select: { id: true, name: true, image: true, wishList: { select: { shareToken: true, isPublic: true } } } },
    },
  });

  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const contact = await getContactAndVerify(id, session.user.id);
  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateContactSchema.parse(body);

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.birthday !== undefined && { birthday: data.birthday ? new Date(data.birthday) : null }),
        ...(data.category && { category: data.category }),
        ...(data.relationshipType !== undefined && { relationshipType: data.relationshipType }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    });

    // Geburtstags-Event aktualisieren wenn Datum geändert
    if (data.birthday !== undefined) {
      await prisma.event.deleteMany({ where: { contactId: id, eventType: "BIRTHDAY" } });
      if (data.birthday) {
        await prisma.event.create({
          data: {
            contactId: id,
            title: `Geburtstag von ${updated.name}`,
            date: new Date(data.birthday),
            isRecurring: true,
            eventType: "BIRTHDAY",
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const contact = await getContactAndVerify(id, session.user.id);
  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
