import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  toId: z.string(),
  linkType: z.enum(["COUPLE", "PARENT_OF", "SIBLINGS", "OTHER"]).default("OTHER"),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const contact = await prisma.contact.findFirst({ where: { id, userId: session.user.id } });
  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const links = await prisma.contactLink.findMany({
    where: { OR: [{ fromId: id }, { toId: id }] },
    include: {
      from: { select: { id: true, name: true } },
      to:   { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const contact = await prisma.contact.findFirst({ where: { id, userId: session.user.id } });
  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const { toId, linkType } = parsed.data;
  if (toId === id) return NextResponse.json({ error: "Kann nicht mit sich selbst verknüpft werden" }, { status: 400 });

  // Normalisieren damit [A→B] und [B→A] nicht doppelt angelegt werden
  const [normFrom, normTo] = id < toId ? [id, toId] : [toId, id];

  const link = await prisma.contactLink.upsert({
    where: { fromId_toId: { fromId: normFrom, toId: normTo } },
    create: { userId: session.user.id, fromId: normFrom, toId: normTo, linkType },
    update: { linkType },
    include: {
      from: { select: { id: true, name: true } },
      to:   { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(link, { status: 201 });
}
