import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const wishList = await prisma.wishList.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { name: true, image: true } },
      items: {
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true, title: true, description: true, url: true,
          priceMin: true, priceMax: true, imageUrl: true,
          status: true, priority: true,
          // reservedById absichtlich nicht zurückgeben
        },
      },
    },
  });

  if (!wishList || !wishList.isPublic) {
    return NextResponse.json({ error: "Wunschliste nicht gefunden oder nicht öffentlich" }, { status: 404 });
  }

  return NextResponse.json({
    ownerName: wishList.user.name,
    ownerImage: wishList.user.image,
    title: wishList.title,
    items: wishList.items,
  });
}
