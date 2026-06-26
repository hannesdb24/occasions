import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateItemSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  priceMin: z.number().min(0).optional().nullable(),
  priceMax: z.number().min(0).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  status: z.enum(["OPEN", "RESERVED", "FULFILLED"]).optional(),
  priority: z.number().int().min(0).max(10).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;

  // Sicherstellen dass das Item dem Nutzer gehört
  const item = await prisma.wishItem.findFirst({
    where: { id, wishList: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateItemSchema.parse(body);

    const updated = await prisma.wishItem.update({ where: { id }, data });
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

  const item = await prisma.wishItem.findFirst({
    where: { id, wishList: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await prisma.wishItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
