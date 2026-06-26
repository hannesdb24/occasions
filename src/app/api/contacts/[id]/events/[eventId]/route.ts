import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id, eventId } = await params;
  const contact = await prisma.contact.findFirst({ where: { id, userId: session.user.id } });
  if (!contact) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await prisma.event.delete({ where: { id: eventId, contactId: id } });
  return NextResponse.json({ ok: true });
}
