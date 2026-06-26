import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { invitedByUser: { select: { name: true } } },
  });

  if (!invitation) return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });
  if (invitation.acceptedById) return NextResponse.json({ error: "Einladung bereits verwendet" }, { status: 410 });
  if (invitation.expiresAt < new Date()) return NextResponse.json({ error: "Einladung abgelaufen" }, { status: 410 });

  return NextResponse.json({
    email: invitation.email,
    name: invitation.name,
    invitedBy: invitation.invitedByUser.name,
    expiresAt: invitation.expiresAt,
  });
}
