import { NextRequest, NextResponse } from "next/server";
import { getGermanHolidays, filterHolidaysByState } from "@/lib/holidays";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const state = searchParams.get("state");

  const holidays = await getGermanHolidays(year);
  const filtered = state ? filterHolidaysByState(holidays, state) : holidays;

  return NextResponse.json(filtered, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
