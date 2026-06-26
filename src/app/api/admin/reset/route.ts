import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.RESET_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(
      `TRUNCATE TABLE "WishItem", "WishList", "ReminderSetting", "Invitation", "Event", "Contact", "User" RESTART IDENTITY CASCADE`
    );
    return NextResponse.json({ ok: true, message: "Alle Daten gelöscht" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await pool.end();
  }
}
