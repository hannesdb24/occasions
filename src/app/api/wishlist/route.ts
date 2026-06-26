import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateWishListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  let wishList = await prisma.wishList.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true, title: true, description: true, url: true,
          priceMin: true, priceMax: true, imageUrl: true,
          status: true, priority: true, createdAt: true, updatedAt: true,
          // reservedById wird NICHT zurückgegeben (Besitzer soll nicht sehen wer reserviert)
        },
      },
    },
  });

  // Automatisch erstellen falls noch nicht vorhanden
  if (!wishList) {
    wishList = await prisma.wishList.create({
      data: { userId: session.user.id },
      include: { items: true },
    });
  }

  return NextResponse.json(wishList);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateWishListSchema.parse(body);

    const wishList = await prisma.wishList.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });

    return NextResponse.json(wishList);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
