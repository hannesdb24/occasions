"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function NewContactPage() {
  const router = useRouter();
  const [existingContacts, setExistingContacts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    birthday: "",
    category: "FAMILY",
    relationshipType: "",
    relatedContactId: "",
    state: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => setExistingContacts(data.map((c: any) => ({ id: c.id, name: c.name }))));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        birthday: form.birthday || null,
        category: form.category,
        relationshipType: form.relationshipType || null,
        state: form.state || null,
        notes: form.notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Fehler beim Speichern");
      setLoading(false);
      return;
    }

    const contact = await res.json();

    // Verknüpfung setzen falls ausgewählt
    if (form.relatedContactId) {
      await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedContactId: form.relatedContactId }),
      });
    }

    router.push(`/contacts/${contact.id}`);
  }

  const inputClass = "w-full px-4 py-2.5 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered";
  const labelClass = "block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2";

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/contacts" className="text-sm transition-considered hover:text-[#c4704a]" style={{ color: "var(--muted-foreground)" }}>
          ← Personen
        </Link>
      </div>
      <div className="mb-8">
        <p className="kicker mb-2">Neu</p>
        <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">Person anlegen</h1>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Grunddaten */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
            <span className="kicker">Über die Person</span>
          </div>

          <div>
            <label className={labelClass}>Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Vorname Nachname" />
          </div>

          <div>
            <label className={labelClass}>Geburtsdatum</label>
            <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Kategorie *</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`py-2 px-3 rounded-full border text-sm font-medium transition-considered ${
                    form.category === cat.value
                      ? "bg-[var(--foreground)] text-[var(--card)] border-[var(--foreground)]"
                      : "border-hairline text-[var(--foreground)] hover:border-[rgba(28,25,22,0.3)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Beziehung */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="kicker">Beziehung zu dir</span>
          </div>

          <div>
            <label className={labelClass}>Beziehungsart</label>
            <select
              value={form.relationshipType}
              onChange={(e) => setForm({ ...form, relationshipType: e.target.value })}
              className={inputClass}
            >
              <option value="">– Keine Angabe –</option>
              {relationshipTypes.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Zeigt passende Feiertage an (Muttertag, Vatertag …)
            </p>
          </div>

          {existingContacts.length > 0 && (
            <div>
              <label className={labelClass}>Verbunden mit</label>
              <select
                value={form.relatedContactId}
                onChange={(e) => setForm({ ...form, relatedContactId: e.target.value })}
                className={inputClass}
              >
                <option value="">– Keine Verknüpfung –</option>
                {existingContacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                z.B. Schwager mit der Schwester verknüpfen — wird in der Netzwerkkarte als Verbindung angezeigt.
              </p>
            </div>
          )}
        </section>

        {/* Sonstiges */}
        <section className="bg-card border-hairline rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4704a]"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span className="kicker">Notizen</span>
          </div>

          <div>
            <label className={labelClass}>Bundesland</label>
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass}>
              <option value="">– Keines (bundesweite Feiertage) –</option>
              {GERMAN_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Notizen</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Besondere Vorlieben, Interessen..."
            />
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered">
            {loading ? "Wird gespeichert..." : "Person speichern"}
          </button>
          <Link href="/contacts" className="px-6 py-2.5 border-hairline rounded-full text-sm font-medium transition-considered hover:bg-[rgba(28,25,22,0.04)]">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
