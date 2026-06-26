import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.RESET_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "WishItem", "WishList", "ReminderSetting", "Invitation", "Event", "Contact", "User" RESTART IDENTITY CASCADE`);
    return NextResponse.json({ ok: true, message: "Alle Daten gelöscht" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
