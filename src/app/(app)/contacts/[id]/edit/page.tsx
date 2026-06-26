"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { GERMAN_STATES } from "@/types";

const categories = [
  { value: "FAMILY", label: "Familie" },
  { value: "PARTNER", label: "Partner" },
  { value: "FRIENDS", label: "Freunde" },
  { value: "COLLEAGUES", label: "Kollegen" },
  { value: "OTHER", label: "Sonstiges" },
];

const relationshipTypes = [
  { group: "Partnerschaft", options: [
    { value: "PARTNER", label: "Partner/in" },
    { value: "SPOUSE", label: "Ehepartner/in" },
  ]},
  { group: "Eltern", options: [
    { value: "MOTHER", label: "Mutter" },
    { value: "FATHER", label: "Vater" },
    { value: "STEPMOTHER", label: "Stiefmutter" },
    { value: "STEPFATHER", label: "Stiefvater" },
  ]},
  { group: "Geschwister & Angeheiratete", options: [
    { value: "SIBLING", label: "Geschwister" },
    { value: "BROTHER_IN_LAW", label: "Schwager" },
    { value: "SISTER_IN_LAW", label: "Schwägerin" },
  ]},
  { group: "Großfamilie", options: [
    { value: "GRANDPARENT", label: "Großelternteil" },
    { value: "UNCLE", label: "Onkel" },
    { value: "AUNT", label: "Tante" },
    { value: "NEPHEW", label: "Neffe" },
    { value: "NIECE", label: "Nichte" },
  ]},
  { group: "Kinder", options: [
    { value: "CHILD", label: "Kind" },
  ]},
  { group: "Sonstige", options: [
    { value: "FRIEND", label: "Freund/in" },
    { value: "COLLEAGUE", label: "Kolleg/in" },
    { value: "OTHER", label: "Sonstige/r" },
  ]},
];

const keepInTouchOptions = [
  { value: "", label: "Keine Erinnerung" },
  { value: "14", label: "Alle 2 Wochen" },
  { value: "30", label: "Einmal im Monat" },
  { value: "90", label: "Alle 3 Monate" },
  { value: "180", label: "Alle 6 Monate" },
  { value: "365", label: "Einmal im Jahr" },
];

interface CustomEvent {
  id?: string;
  title: string;
  date: string;
  isRecurring: boolean;
}

function getAvatarColor(name: string): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [allContacts, setAllContacts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "", birthday: "", category: "FAMILY", relationshipType: "",
    state: "", notes: "", email: "", phone: "", address: "", city: "", zip: "",
    interests: "", keepInTouchDays: "", relatedContactId: "",
  });
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [newEvent, setNewEvent] = useState<CustomEvent>({ title: "", date: "", isRecurring: true });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then((data) => {
      setAllContacts(data.map((c: any) => ({ id: c.id, name: c.name })));
    });
  }, []);

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          birthday: data.birthday ? new Date(data.birthday).toISOString().split("T")[0] : "",
          category: data.category ?? "FAMILY",
          relationshipType: data.relationshipType ?? "",
          state: data.state ?? "",
          notes: data.notes ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          zip: data.zip ?? "",
          interests: data.interests ?? "",
          keepInTouchDays: data.keepInTouchDays ? String(data.keepInTouchDays) : "",
          relatedContactId: data.relatedContactId ?? "",
        });
        if (data.interests) {
          setTagList(data.interests.split(",").map((t: string) => t.trim()).filter(Boolean));
        }
        const nonBirthday = (data.events ?? []).filter((e: any) => e.eventType !== "BIRTHDAY");
        setCustomEvents(nonBirthday.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.date).toISOString().split("T")[0],
          isRecurring: e.isRecurring,
        })));
        setFetching(false);
      });
  }, [id]);

  function addTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = interestInput.trim();
      if (val && !tagList.includes(val)) {
        const next = [...tagList, val];
        setTagList(next);
        setForm({ ...form, interests: next.join(", ") });
      }
      setInterestInput("");
    }
  }

  function removeTag(tag: string) {
    const next = tagList.filter((t) => t !== tag);
    setTagList(next);
    setForm({ ...form, interests: next.join(", ") });
  }

  async function addCustomEvent() {
    if (!newEvent.title || !newEvent.date) return;
    const res = await fetch(`/api/contacts/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newEvent.title, date: newEvent.date, isRecurring: newEvent.isRecurring, eventType: "CUSTOM" }),
    });
    if (res.ok) {
      const created = await res.json();
      setCustomEvents([...customEvents, { id: created.id, title: created.title, date: new Date(created.date).toISOString().split("T")[0], isRecurring: created.isRecurring }]);
      setNewEvent({ title: "", date: "", isRecurring: true });
      setShowAddEvent(false);
    }
  }

  async function deleteCustomEvent(eventId: string) {
    await fetch(`/api/contacts/${id}/events/${eventId}`, { method: "DELETE" });
    setCustomEvents(customEvents.filter((e) => e.id !== eventId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        birthday: form.birthday || null,
        category: form.category,
        relationshipType: form.relationshipType || null,
        state: form.state || null,
        notes: form.notes || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        zip: form.zip || null,
        interests: tagList.join(", ") || null,
        keepInTouchDays: form.keepInTouchDays ? parseInt(form.keepInTouchDays) : null,
        relatedContactId: form.relatedContactId || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Fehler beim Speichern");
      setLoading(false);
    } else {
      router.push(`/contacts/${id}`);
    }
  }

  const inputClass = "w-full px-4 py-2.5 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered";
  const labelClass = "block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2";

  if (fetching) {
    return (
      <div className="max-w-xl">
        <div className="h-8 w-48 bg-[rgba(28,25,22,0.06)] rounded-lg animate-pulse mb-8" />
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-32 bg-[rgba(28,25,22,0.04)] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const avatarColor = getAvatarColor(form.name);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/contacts/${id}`} className="text-sm transition-considered hover:text-[#c4704a]" style={{ color: "var(--muted-foreground)" }}>
          ← {form.name}
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="rounded-full flex items-center justify-center text-white font-serif font-medium shrink-0"
          style={{ width: 52, height: 52, fontSize: 20, backgroundColor: avatarColor }}>
          {form.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="kicker mb-1">Bearbeiten</p>
          <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">{form.name}</h1>
        </div>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* About them */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <span className="kicker">Über die Person</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Voller Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Beziehung</label>
              <select value={form.relationshipType} onChange={(e) => setForm({ ...form, relationshipType: e.target.value })} className={inputClass}>
                <option value="">–</option>
                {relationshipTypes.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          {allContacts.filter((c) => c.id !== id).length > 0 && (
            <div>
              <label className={labelClass}>Verbunden mit</label>
              <select
                value={form.relatedContactId}
                onChange={(e) => setForm({ ...form, relatedContactId: e.target.value })}
                className={inputClass}
              >
                <option value="">Keine Verknüpfung</option>
                {allContacts.filter((c) => c.id !== id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                z.B. Schwager verknüpfen mit der Schwester, die auch im Adressbuch ist.
              </p>
            </div>
          )}

          <div>
            <label className={labelClass}>Kategorie</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })}
                  className={`py-2 px-3 rounded-full border text-sm font-medium transition-considered ${form.category === cat.value ? "bg-[var(--foreground)] text-[var(--card)] border-[var(--foreground)]" : "border-hairline text-[var(--foreground)] hover:border-[rgba(28,25,22,0.3)]"}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Contact details */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span className="kicker">Kontaktdaten</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>E-Mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="name@example.de" />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+49 171 000 0000" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Straße & Hausnummer</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="Musterstraße 12" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>PLZ</label>
              <input type="text" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputClass} placeholder="10115" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Stadt</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Berlin" />
            </div>
          </div>
        </section>

        {/* Important dates */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span className="kicker">Wichtige Daten</span>
          </div>
          <div>
            <label className={labelClass}>Geburtstag</label>
            <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
          </div>

          {customEvents.length > 0 && (
            <div className="space-y-2">
              <label className={labelClass}>Weitere Daten</label>
              {customEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between py-2.5 px-3 border-hairline rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{ev.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(ev.date + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
                      {ev.isRecurring && " · jährlich"}
                    </p>
                  </div>
                  <button type="button" onClick={() => ev.id && deleteCustomEvent(ev.id)}
                    className="text-xs px-2 py-1 rounded-lg text-red-400 hover:bg-red-50 transition-considered">✕</button>
                </div>
              ))}
            </div>
          )}

          {showAddEvent ? (
            <div className="border-brass-hairline rounded-xl p-4 space-y-3 bg-[#c4704a]/3">
              <div>
                <label className={labelClass}>Bezeichnung</label>
                <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className={inputClass} placeholder="z.B. Jahrestag, Kennenlerntag..." />
              </div>
              <div>
                <label className={labelClass}>Datum</label>
                <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newEvent.isRecurring} onChange={(e) => setNewEvent({ ...newEvent, isRecurring: e.target.checked })}
                  className="rounded accent-[#c4704a]" />
                Jährlich wiederholen
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={addCustomEvent}
                  className="flex-1 py-2 bg-[var(--foreground)] text-[var(--card)] rounded-full text-sm font-medium hover:opacity-90 transition-considered">
                  Hinzufügen
                </button>
                <button type="button" onClick={() => setShowAddEvent(false)}
                  className="px-4 py-2 border-hairline rounded-full text-sm transition-considered hover:bg-[rgba(28,25,22,0.04)]">
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddEvent(true)}
              className="flex items-center gap-2 text-sm text-[#c4704a] font-medium hover:text-[#a85c38] transition-considered">
              <span className="text-lg leading-none">+</span> Weiteres Datum hinzufügen
            </button>
          )}
        </section>

        {/* Personality & Notes */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <span className="kicker">Persönlichkeit & Notizen</span>
          </div>
          <div>
            <label className={labelClass}>Interessen & Hobbys</label>
            <div className="border-hairline rounded-xl px-3 py-2 bg-[var(--background)] focus-within:ring-2 focus-within:ring-[#c4704a]/30 transition-considered">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {tagList.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#c4704a]/10 text-[#a85c38] rounded-full text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-[#c4704a] leading-none">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={addTag}
                className="w-full bg-transparent text-sm outline-none"
                placeholder={tagList.length === 0 ? "z.B. Kochen, Wandern (Enter zum Hinzufügen)" : "Weiteres hinzufügen..."}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Private Notizen</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3} className={`${inputClass} resize-none`}
              placeholder="Konfektionsgröße, Allergien, Vorlieben..." />
          </div>
          <div>
            <label className={labelClass}>In Kontakt bleiben</label>
            <select value={form.keepInTouchDays} onChange={(e) => setForm({ ...form, keepInTouchDays: e.target.value })} className={inputClass}>
              {keepInTouchOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Wir erinnern dich sanft, wenn du zu lange nichts von dieser Person gehört hast.
            </p>
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered">
            {loading ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
          <Link href={`/contacts/${id}`}
            className="px-6 py-2.5 border-hairline rounded-full text-sm font-medium transition-considered hover:bg-[rgba(28,25,22,0.04)]">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
