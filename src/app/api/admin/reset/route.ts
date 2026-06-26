import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  const secret = req.headers.get("x-reset-secret");
  if (secret !== process.env.RESET_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.deleteMany();
  return NextResponse.json({ ok: true });
}
