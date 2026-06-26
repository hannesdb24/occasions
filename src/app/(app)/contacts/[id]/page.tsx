import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/types";
import { getRelationshipHolidays } from "@/lib/holidays";

function getAvatarColor(name: string): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  return colors[name.charCodeAt(0) % colors.length];
}

const LINK_TYPE_LABELS: Record<string, (isFrom: boolean) => string> = {
  COUPLE:    () => "Paar",
  PARENT_OF: (isFrom) => isFrom ? "Elternteil von" : "Kind von",
  SIBLINGS:  () => "Geschwister",
  OTHER:     () => "Verbunden mit",
};

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, userId: session!.user!.id },
    include: {
      events: { orderBy: { date: "asc" } },
      linkedUser: {
        select: {
          name: true,
          image: true,
          wishList: { select: { shareToken: true, isPublic: true, items: { select: { id: true, status: true } } } },
        },
      },
      linksFrom: { include: { to: { select: { id: true, name: true } } } },
      linksTo:   { include: { from: { select: { id: true, name: true } } } },
    },
  });

  if (!contact) notFound();

  const currentYear = new Date().getFullYear();
  const relHolidays = getRelationshipHolidays(contact.relationshipType as any, currentYear);
  const avatarColor = getAvatarColor(contact.name);

  const allLinks = [
    ...contact.linksFrom.map((l) => ({ id: l.id, other: l.to, linkType: l.linkType, isFrom: true })),
    ...contact.linksTo.map((l)   => ({ id: l.id, other: l.from, linkType: l.linkType, isFrom: false })),
  ];

  function getNextOccurrence(date: Date): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setFullYear(now.getFullYear());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    return next;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/contacts" className="text-sm transition-considered hover:text-[#c4704a]" style={{ color: "var(--muted-foreground)" }}>
          ← Personen
        </Link>
      </div>

      {/* Header-Karte */}
      <div className="bg-card border-hairline rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="rounded-full flex items-center justify-center text-white font-serif font-medium shrink-0"
              style={{ width: 56, height: 56, fontSize: 22, backgroundColor: avatarColor }}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-xl font-medium text-[var(--foreground)]">{contact.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(28,25,22,0.06)] font-medium text-[var(--foreground)]">
                  {CATEGORY_LABELS[contact.category]}
                </span>
                {contact.relationshipType && (
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}
                  </span>
                )}
              </div>
              {contact.birthday && (
                <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(contact.birthday).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              {contact.notes && <p className="text-sm mt-3 editorial-italic">„{contact.notes}"</p>}
            </div>
          </div>
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="px-4 py-2 border-hairline rounded-full text-sm transition-considered hover:bg-[rgba(28,25,22,0.04)] shrink-0"
          >
            Bearbeiten
          </Link>
        </div>

        {contact.linkedUser && contact.linkedUser.wishList?.isPublic && contact.linkedUser.wishList.shareToken && (
          <div className="mt-5 pt-5 border-t border-[rgba(28,25,22,0.08)]">
            <Link
              href={`/wishlist/${contact.linkedUser.wishList.shareToken}`}
              className="text-sm text-[#c4704a] hover:text-[#a85c38] font-medium"
            >
              Wunschliste von {contact.name} ansehen →
            </Link>
            <span className="text-xs ml-2" style={{ color: "var(--muted-foreground)" }}>
              ({contact.linkedUser.wishList.items.filter((i) => i.status === "OPEN").length} offen)
            </span>
          </div>
        )}
      </div>

      {/* Verbindungen */}
      {(contact.relationshipType || allLinks.length > 0) && (
        <div className="bg-card border-hairline rounded-2xl p-6 mb-4">
          <h2 className="font-serif text-lg font-medium text-[var(--foreground)] mb-4">Verbindungen</h2>
          <div className="space-y-2">

            {/* Beziehung zum eingeloggten Nutzer */}
            {contact.relationshipType && (
              <div className="flex items-center gap-3 py-2.5 border-b border-[rgba(28,25,22,0.06)]">
                <div className="w-8 h-8 rounded-full bg-[#1c1916] flex items-center justify-center text-white text-xs font-serif font-medium shrink-0">
                  Ich
                </div>
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[var(--foreground)]">Du</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(28,25,22,0.06)]" style={{ color: "var(--muted-foreground)" }}>
                    {contact.relationshipType === "MOTHER" || contact.relationshipType === "FATHER" ||
                     contact.relationshipType === "STEPMOTHER" || contact.relationshipType === "STEPFATHER"
                      ? "Kind von"
                      : contact.relationshipType === "CHILD"
                      ? "Elternteil von"
                      : contact.relationshipType === "SIBLING" || contact.relationshipType === "BROTHER_IN_LAW" || contact.relationshipType === "SISTER_IN_LAW"
                      ? "Geschwister /"
                      : "→"}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{contact.name}</span>
                  <span className="text-xs ml-1" style={{ color: "var(--muted-foreground)" }}>
                    ({RELATIONSHIP_TYPE_LABELS[contact.relationshipType]})
                  </span>
                </div>
              </div>
            )}

            {/* Kontakt-zu-Kontakt-Links */}
            {allLinks.map((link) => {
              const labelFn = LINK_TYPE_LABELS[link.linkType] ?? (() => "Verbunden mit");
              const label = labelFn(link.isFrom);
              const otherColor = getAvatarColor(link.other.name);
              return (
                <div key={link.id} className="flex items-center gap-3 py-2.5 border-b border-[rgba(28,25,22,0.06)] last:border-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-serif font-medium shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--foreground)]">{contact.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(28,25,22,0.06)]" style={{ color: "var(--muted-foreground)" }}>
                      {label}
                    </span>
                    <Link href={`/contacts/${link.other.id}`} className="flex items-center gap-1.5 group">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-serif font-medium shrink-0"
                        style={{ backgroundColor: otherColor }}
                      >
                        {link.other.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[#c4704a] transition-considered">
                        {link.other.name}
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Anlässe */}
      <div className="bg-card border-hairline rounded-2xl p-6 mb-4">
        <h2 className="font-serif text-lg font-medium text-[var(--foreground)] mb-4">Anlässe</h2>

        {contact.events.length === 0 && relHolidays.length === 0 && (
          <p className="text-sm editorial-italic" style={{ color: "var(--muted-foreground)" }}>Keine Anlässe eingetragen.</p>
        )}

        <div className="space-y-1">
          {contact.events.map((event) => {
            const next = event.isRecurring ? getNextOccurrence(event.date) : event.date;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={event.id} className="flex items-center justify-between py-3 border-b border-[rgba(28,25,22,0.06)] last:border-0">
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{event.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {next.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                    {event.isRecurring && " · jährlich"}
                  </div>
                </div>
                {daysUntil >= 0 && daysUntil <= 90 && (
                  <span className="text-xs bg-[#c4704a]/10 text-[#c4704a] px-2.5 py-1 rounded-full font-medium">
                    in {daysUntil} Tagen
                  </span>
                )}
              </div>
            );
          })}
          {relHolidays.map((h) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((h.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={h.title} className="flex items-center justify-between py-3 border-b border-[rgba(28,25,22,0.06)] last:border-0">
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{h.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {h.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })} · jährlich
                  </div>
                </div>
                {daysUntil >= 0 && daysUntil <= 90 && (
                  <span className="text-xs bg-[#c4704a]/10 text-[#c4704a] px-2.5 py-1 rounded-full font-medium">
                    in {daysUntil} Tagen
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Einladen */}
      {!contact.linkedUserId && (
        <div className="border-brass-hairline bg-[#c4704a]/5 rounded-2xl p-6">
          <h2 className="font-serif text-lg font-medium text-[var(--foreground)] mb-1">Zu Occasions einladen</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
            {contact.name} kann die App nutzen, eine eigene Wunschliste erstellen und ihr Netzwerk aufbauen.
          </p>
          <Link
            href={`/settings?invite=1&name=${encodeURIComponent(contact.name)}`}
            className="inline-flex px-5 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered"
          >
            {contact.name} einladen
          </Link>
        </div>
      )}
    </div>
  );
}
