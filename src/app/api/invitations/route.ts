import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const body = await req.json();
    const data = inviteSchema.parse(body);

    // Prüfen ob Nutzer schon existiert
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Dieser Nutzer ist bereits registriert" }, { status: 409 });
    }

    // Bestehende offene Einladung prüfen
    const existing = await prisma.invitation.findFirst({
      where: {
        invitedById: session.user.id,
        email: data.email,
        acceptedById: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Eine Einladung an diese E-Mail wurde bereits gesendet" }, { status: 409 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        invitedById: session.user.id,
        email: data.email,
        name: data.name,
        expiresAt,
      },
    });

    const inviter = await prisma.user.findUnique({ where: { id: session.user.id } });
    await sendInvitationEmail({
      to: data.email,
      toName: data.name,
      fromName: inviter?.name ?? "Jemand",
      token: invitation.token,
    });

    return NextResponse.json({ id: invitation.id, token: invitation.token }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
