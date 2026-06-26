import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS, RELATIONSHIP_TYPE_LABELS } from "@/types";
import { getRelationshipHolidays } from "@/lib/holidays";

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
    },
  });

  if (!contact) notFound();

  const currentYear = new Date().getFullYear();
  const relHolidays = getRelationshipHolidays(contact.relationshipType as any, currentYear);

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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contacts" className="text-gray-400 hover:text-gray-600 text-sm">← Kontakte</Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[contact.category]}`}>
                {CATEGORY_LABELS[contact.category]}
              </span>
              {contact.relationshipType && (
                <span className="text-sm text-gray-500">
                  {RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}
                </span>
              )}
            </div>
            {contact.birthday && (
              <p className="text-sm text-gray-500 mt-2">
                🎂 {new Date(contact.birthday).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {contact.notes && <p className="text-sm text-gray-600 mt-3 italic">„{contact.notes}"</p>}
          </div>
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Bearbeiten
          </Link>
        </div>

        {contact.linkedUser && contact.linkedUser.wishList?.isPublic && contact.linkedUser.wishList.shareToken && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/wishlist/${contact.linkedUser.wishList.shareToken}`}
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              🎁 Wunschliste von {contact.name} ansehen →
            </Link>
            <span className="text-xs text-gray-400 ml-2">
              ({contact.linkedUser.wishList.items.filter((i) => i.status === "OPEN").length} offen)
            </span>
          </div>
        )}
      </div>

      {/* Anlässe */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Anlässe</h2>
        </div>

        {contact.events.length === 0 && relHolidays.length === 0 && (
          <p className="text-sm text-gray-400">Keine Anlässe eingetragen.</p>
        )}

        <div className="space-y-2">
          {contact.events.map((event) => {
            const next = event.isRecurring ? getNextOccurrence(event.date) : event.date;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{event.title}</div>
                  <div className="text-xs text-gray-400">
                    {next.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                    {event.isRecurring && " · jährlich"}
                  </div>
                </div>
                {daysUntil >= 0 && daysUntil <= 90 && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
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
              <div key={h.title} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{h.title}</div>
                  <div className="text-xs text-gray-400">
                    {h.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })} · jährlich
                  </div>
                </div>
                {daysUntil >= 0 && daysUntil <= 90 && (
                  <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full font-medium">
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
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
          <h2 className="font-semibold text-indigo-900 mb-1">Zu Occasions einladen</h2>
          <p className="text-sm text-indigo-600 mb-3">
            {contact.name} kann die App nutzen, eine eigene Wunschliste erstellen und sein Netzwerk aufbauen.
          </p>
          <InviteButton contactName={contact.name} />
        </div>
      )}
    </div>
  );
}

function InviteButton({ contactName }: { contactName: string }) {
  return (
    <Link
      href={`/settings?invite=1&name=${encodeURIComponent(contactName)}`}
      className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
    >
      {contactName} einladen
    </Link>
  );
}
