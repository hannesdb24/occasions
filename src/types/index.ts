export type { ContactCategory, RelationshipType, EventType, WishItemStatus } from "@prisma/client";

export interface UpcomingEvent {
  id: string;
  contactId: string;
  contactName: string;
  contactCategory: string;
  title: string;
  date: Date;
  daysUntil: number;
  eventType: string;
  wishListShareToken?: string | null;
}

export interface GermanState {
  code: string;
  name: string;
}

export const GERMAN_STATES: GermanState[] = [
  { code: "BW", name: "Baden-Württemberg" },
  { code: "BY", name: "Bayern" },
  { code: "BE", name: "Berlin" },
  { code: "BB", name: "Brandenburg" },
  { code: "HB", name: "Bremen" },
  { code: "HH", name: "Hamburg" },
  { code: "HE", name: "Hessen" },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NI", name: "Niedersachsen" },
  { code: "NW", name: "Nordrhein-Westfalen" },
  { code: "RP", name: "Rheinland-Pfalz" },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Sachsen" },
  { code: "ST", name: "Sachsen-Anhalt" },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "TH", name: "Thüringen" },
];

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  MOTHER: "Mutter",
  FATHER: "Vater",
  STEPMOTHER: "Stiefmutter",
  STEPFATHER: "Stiefvater",
  PARTNER: "Partner/in",
  SPOUSE: "Ehepartner/in",
  SIBLING: "Geschwister",
  BROTHER_IN_LAW: "Schwager",
  SISTER_IN_LAW: "Schwägerin",
  GRANDPARENT: "Großelternteil",
  CHILD: "Kind",
  UNCLE: "Onkel",
  AUNT: "Tante",
  NEPHEW: "Neffe",
  NIECE: "Nichte",
  FRIEND: "Freund/in",
  COLLEAGUE: "Kolleg/in",
  OTHER: "Sonstige/r",
};

export const CATEGORY_LABELS: Record<string, string> = {
  FAMILY: "Familie",
  PARTNER: "Partner",
  FRIENDS: "Freunde",
  COLLEAGUES: "Kollegen",
  OTHER: "Sonstiges",
};

export const CATEGORY_COLORS: Record<string, string> = {
  FAMILY: "bg-rose-100 text-rose-700",
  PARTNER: "bg-[#c4704a]/10 text-[#a85c38]",
  FRIENDS: "bg-blue-100 text-blue-700",
  COLLEAGUES: "bg-amber-100 text-amber-700",
  OTHER: "bg-gray-100 text-gray-700",
};
