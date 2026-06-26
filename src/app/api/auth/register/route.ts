import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Prüfe ob E-Mail schon vergeben
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 409 });
    }

    // Invite-Token validieren (falls vorhanden)
    let invitation = null;
    if (data.inviteToken) {
      invitation = await prisma.invitation.findUnique({
        where: { token: data.inviteToken },
      });
      if (!invitation || invitation.acceptedById || invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: "Einladung ungültig oder abgelaufen" }, { status: 400 });
      }
      if (invitation.email !== data.email) {
        return NextResponse.json({ error: "E-Mail stimmt nicht mit Einladung überein" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    // Standard-Reminder-Einstellungen anlegen
    await prisma.reminderSetting.createMany({
      data: [
        { userId: user.id, eventType: "BIRTHDAY", daysBefore: 7 },
        { userId: user.id, eventType: "BIRTHDAY", daysBefore: 1 },
        { userId: user.id, eventType: "ANNIVERSARY", daysBefore: 7 },
      ],
    });

    // Einladung als akzeptiert markieren
    if (invitation) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedById: user.id },
      });

      // Den einladenden Nutzer mit diesem neuen Nutzer verknüpfen
      await prisma.contact.updateMany({
        where: {
          userId: invitation.invitedById,
          OR: [{ linkedUserId: null }],
          user: { id: invitation.invitedById },
        },
        data: {},
      });
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Bitte alle Felder korrekt ausfüllen (Name min. 2 Zeichen, Passwort min. 8 Zeichen)" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
