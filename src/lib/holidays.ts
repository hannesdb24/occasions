export interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Cache: year -> holidays
const holidayCache = new Map<number, PublicHoliday[]>();

export async function getGermanHolidays(year: number): Promise<PublicHoliday[]> {
  if (holidayCache.has(year)) return holidayCache.get(year)!;

  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`, {
    next: { revalidate: 86400 * 30 }, // 30 Tage cachen
  });

  if (!res.ok) return [];

  const holidays: PublicHoliday[] = await res.json();
  holidayCache.set(year, holidays);
  return holidays;
}

export function filterHolidaysByState(
  holidays: PublicHoliday[],
  state: string | null | undefined
): PublicHoliday[] {
  return holidays.filter((h) => {
    if (h.global) return true;
    if (!state || !h.counties) return false;
    return h.counties.some((c) => c.includes(state));
  });
}

// Muttertag: 2. Sonntag im Mai
export function getMothersDay(year: number): Date {
  const may1 = new Date(year, 4, 1);
  const dayOfWeek = may1.getDay(); // 0=So
  const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return new Date(year, 4, firstSunday + 7);
}

// Vatertag = Christi Himmelfahrt (39 Tage nach Ostern)
export function getAscensionDay(year: number): Date {
  const easter = getEasterDate(year);
  const ascension = new Date(easter);
  ascension.setDate(ascension.getDate() + 39);
  return ascension;
}

// Valentinstag
export function getValentinesDay(year: number): Date {
  return new Date(year, 1, 14);
}

// Berechnung des Osterdatums (Gaußsche Osterformel)
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

export type RelationshipType =
  | "MOTHER" | "FATHER" | "STEPMOTHER" | "STEPFATHER"
  | "PARTNER" | "SPOUSE" | "SIBLING" | "GRANDPARENT"
  | "CHILD" | "FRIEND" | "COLLEAGUE" | "OTHER";

export interface RelationshipHoliday {
  title: string;
  date: Date;
}

export function getRelationshipHolidays(
  relationshipType: RelationshipType | null | undefined,
  year: number
): RelationshipHoliday[] {
  if (!relationshipType) return [];

  const holidays: RelationshipHoliday[] = [];

  switch (relationshipType) {
    case "MOTHER":
    case "STEPMOTHER":
      holidays.push({ title: "Muttertag", date: getMothersDay(year) });
      break;
    case "FATHER":
    case "STEPFATHER":
      holidays.push({ title: "Vatertag", date: getAscensionDay(year) });
      break;
    case "PARTNER":
    case "SPOUSE":
      holidays.push({ title: "Valentinstag", date: getValentinesDay(year) });
      break;
    case "GRANDPARENT":
      holidays.push({ title: "Muttertag", date: getMothersDay(year) });
      break;
  }

  return holidays;
}
