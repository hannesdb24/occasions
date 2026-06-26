"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { RELATIONSHIP_TYPE_LABELS } from "@/types";
import { ContactNetwork } from "@/components/ContactNetwork";

interface ContactEvent {
  id: string;
  date: string;
  eventType: string;
  isRecurring: boolean;
}

interface Contact {
  id: string;
  name: string;
  birthday: string | null;
  category: string;
  relationshipType: string | null;
  events: ContactEvent[];
}

function getAvatarColor(name: string): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  return colors[name.charCodeAt(0) % colors.length];
}

const RELATIONSHIP_BADGE_COLORS: Record<string, string> = {
  PARTNER: "bg-rose-100 text-rose-700",
  SPOUSE: "bg-rose-100 text-rose-700",
  MOTHER: "bg-amber-100 text-amber-700",
  FATHER: "bg-amber-100 text-amber-700",
  STEPMOTHER: "bg-amber-100 text-amber-700",
  STEPFATHER: "bg-amber-100 text-amber-700",
  SIBLING: "bg-sky-100 text-sky-700",
  BROTHER_IN_LAW: "bg-sky-100 text-sky-700",
  SISTER_IN_LAW: "bg-sky-100 text-sky-700",
  GRANDPARENT: "bg-purple-100 text-purple-700",
  CHILD: "bg-green-100 text-green-700",
  UNCLE: "bg-violet-100 text-violet-700",
  AUNT: "bg-violet-100 text-violet-700",
  NEPHEW: "bg-teal-100 text-teal-700",
  NIECE: "bg-teal-100 text-teal-700",
  FRIEND: "bg-blue-100 text-blue-700",
  COLLEAGUE: "bg-slate-100 text-slate-600",
  OTHER: "bg-[rgba(28,25,22,0.06)] text-[var(--foreground)]",
};

const FILTER_TABS = [
  { key: "ALL", label: "Alle", types: null },
  { key: "PARTNER", label: "Partner", types: ["PARTNER", "SPOUSE"] },
  { key: "FAMILY", label: "Familie", types: ["MOTHER", "FATHER", "STEPMOTHER", "STEPFATHER", "SIBLING", "BROTHER_IN_LAW", "SISTER_IN_LAW", "GRANDPARENT", "CHILD", "UNCLE", "AUNT", "NEPHEW", "NIECE"] },
  { key: "FRIEND", label: "Freund", types: ["FRIEND"] },
  { key: "COLLEAGUE", label: "Kollege", types: ["COLLEAGUE"] },
  { key: "OTHER", label: "Andere", types: ["OTHER", null] },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [view, setView] = useState<"list" | "network">("list");

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => { setContacts(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = contacts;
    if (activeFilter !== "ALL") {
      const tab = FILTER_TABS.find((t) => t.key === activeFilter);
      if (tab?.types) {
        result = result.filter((c) => (tab.types as any[]).includes(c.relationshipType));
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [contacts, activeFilter, search]);

  function getBirthday(contact: Contact): string | null {
    const bdEvent = contact.events.find((e) => e.eventType === "BIRTHDAY");
    if (!bdEvent && !contact.birthday) return null;
    const date = new Date(bdEvent?.date ?? contact.birthday!);
    return date.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  }

  return (
    <div>
      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="kicker mb-3">Dein Kreis</p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-[var(--foreground)] leading-[1.05]">
            Deine Personen
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex border-hairline rounded-full overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 transition-considered ${view === "list" ? "bg-[var(--foreground)] text-[var(--card)]" : "text-[var(--foreground)] hover:bg-[rgba(28,25,22,0.05)]"}`}
              aria-label="Listenansicht"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setView("network")}
              className={`px-3 py-2 transition-considered ${view === "network" ? "bg-[var(--foreground)] text-[var(--card)]" : "text-[var(--foreground)] hover:bg-[rgba(28,25,22,0.05)]"}`}
              aria-label="Netzwerkansicht"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/><line x1="5" y1="19" x2="19" y2="19"/>
              </svg>
            </button>
          </div>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered"
          >
            <span className="text-base leading-none">+</span> Person hinzufügen
          </Link>
        </div>
      </header>

      {/* Netzwerkansicht */}
      {view === "network" && (
        <div className="bg-card border-hairline rounded-2xl p-4 md:p-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#c4704a] border-t-transparent animate-spin" />
            </div>
          ) : (
            <ContactNetwork contacts={contacts} userName="Ich" />
          )}
        </div>
      )}

      {/* Listenansicht */}
      {view === "list" && (
        <>
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nach Name suchen..."
              className="w-full pl-10 pr-4 py-2.5 border-hairline rounded-full bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 transition-considered"
            />
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-considered border ${
                  activeFilter === tab.key
                    ? "bg-[var(--foreground)] text-[var(--card)] border-[var(--foreground)]"
                    : "border-hairline text-[var(--foreground)] hover:border-[rgba(28,25,22,0.3)] bg-card"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border-hairline rounded-2xl p-6 h-48 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="font-serif text-xl font-medium text-[var(--foreground)] mb-2">
                {search || activeFilter !== "ALL" ? "Keine Treffer" : "Noch niemanden hinzugefügt"}
              </p>
              <p className="text-sm editorial-italic mb-6">
                {search ? `Keine Person mit „${search}" gefunden.` : "Füge deine erste Person hinzu, um loszulegen."}
              </p>
              {!search && activeFilter === "ALL" && (
                <Link href="/contacts/new" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered">
                  + Person hinzufügen
                </Link>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((contact) => {
                const color = getAvatarColor(contact.name);
                const birthday = getBirthday(contact);
                const eventCount = contact.events.length;
                const relationLabel = contact.relationshipType ? RELATIONSHIP_TYPE_LABELS[contact.relationshipType] : null;
                const badgeColor = (contact.relationshipType && RELATIONSHIP_BADGE_COLORS[contact.relationshipType]) ?? RELATIONSHIP_BADGE_COLORS.OTHER;

                return (
                  <div key={contact.id} className="bg-card border-hairline rounded-2xl p-6 flex flex-col gap-4 hover:border-[rgba(28,25,22,0.2)] transition-considered">
                    <div className="flex items-start gap-4">
                      <div
                        className="rounded-full flex items-center justify-center text-white font-serif font-medium shrink-0"
                        style={{ width: 56, height: 56, fontSize: 22, backgroundColor: color }}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-lg font-medium text-[var(--foreground)] truncate">{contact.name}</p>
                        {relationLabel && (
                          <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                            {relationLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {birthday && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                          </svg>
                          <span>Geburtstag <span className="font-medium text-[var(--foreground)]">{birthday}</span></span>
                        </div>
                      )}
                      {eventCount > 0 && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
                          </svg>
                          <span>{eventCount} {eventCount === 1 ? "Anlass" : "Anlässe"} im Kalender</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/contacts/${contact.id}`}
                      className="mt-auto block text-center py-2 border-hairline rounded-full text-sm font-medium transition-considered hover:bg-[rgba(28,25,22,0.04)]"
                    >
                      Profil ansehen
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
