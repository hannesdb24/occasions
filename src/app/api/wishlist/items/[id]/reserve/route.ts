import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.wishItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Eigene Wunschliste kann man nicht selbst reservieren
  const ownWishList = await prisma.wishList.findFirst({
    where: { id: item.wishListId, userId: session.user.id },
  });
  if (ownWishList) return NextResponse.json({ error: "Eigene Items können nicht reserviert werden" }, { status: 403 });

  if (item.status !== "OPEN") return NextResponse.json({ error: "Item ist nicht mehr verfügbar" }, { status: 409 });

  const updated = await prisma.wishItem.update({
    where: { id },
    data: { status: "RESERVED", reservedById: session.user.id },
  });

  return NextResponse.json({ success: true, status: updated.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.wishItem.findFirst({
    where: { id, reservedById: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Nicht gefunden oder nicht von dir reserviert" }, { status: 404 });

  await prisma.wishItem.update({
    where: { id },
    data: { status: "OPEN", reservedById: null },
  });

  return NextResponse.json({ success: true });
}
