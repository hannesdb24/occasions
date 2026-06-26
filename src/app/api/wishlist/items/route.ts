import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createItemSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  priceMin: z.number().min(0).optional().nullable(),
  priceMax: z.number().min(0).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  priority: z.number().int().min(0).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createItemSchema.parse(body);

    // WishList holen oder erstellen
    const wishList = await prisma.wishList.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    const item = await prisma.wishItem.create({
      data: {
        wishListId: wishList.id,
        title: data.title,
        description: data.description ?? null,
        url: data.url ?? null,
        priceMin: data.priceMin ?? null,
        priceMax: data.priceMax ?? null,
        imageUrl: data.imageUrl ?? null,
        priority: data.priority ?? 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
