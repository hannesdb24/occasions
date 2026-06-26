import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.RESET_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.wishItem.deleteMany();
  await prisma.wishList.deleteMany();
  await prisma.reminderSetting.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();

  return NextResponse.json({ ok: true, message: "Alle Daten gelöscht" });
}
