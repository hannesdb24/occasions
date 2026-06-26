"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GERMAN_STATES } from "@/types";

const categories = [
  { value: "FAMILY", label: "Familie" },
  { value: "FRIENDS", label: "Freunde" },
  { value: "COLLEAGUES", label: "Kollegen" },
  { value: "OTHER", label: "Sonstiges" },
];

const relationshipTypes = [
  { value: "MOTHER", label: "Mutter" },
  { value: "FATHER", label: "Vater" },
  { value: "STEPMOTHER", label: "Stiefmutter" },
  { value: "STEPFATHER", label: "Stiefvater" },
  { value: "PARTNER", label: "Partner/in" },
  { value: "SPOUSE", label: "Ehepartner/in" },
  { value: "SIBLING", label: "Geschwister" },
  { value: "GRANDPARENT", label: "Großelternteil" },
  { value: "CHILD", label: "Kind" },
  { value: "FRIEND", label: "Freund/in" },
  { value: "COLLEAGUE", label: "Kolleg/in" },
  { value: "OTHER", label: "Sonstige/r" },
];

export default function NewContactPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", birthday: "", category: "FAMILY", relationshipType: "", state: "", notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        birthday: form.birthday || null,
        relationshipType: form.relationshipType || null,
        state: form.state || null,
        notes: form.notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Fehler beim Speichern");
      setLoading(false);
    } else {
      const contact = await res.json();
      router.push(`/contacts/${contact.id}`);
    }
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
        <h1 className="font-serif text-3xl font-medium text-[var(--foreground)]">Person anlegen</h1>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border-hairline rounded-2xl p-6">
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
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm({ ...form, category: cat.value })}
                className={`py-2.5 px-4 rounded-full border text-sm font-medium transition-considered ${
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

        <div>
          <label className={labelClass}>Beziehungstyp</label>
          <select value={form.relationshipType} onChange={(e) => setForm({ ...form, relationshipType: e.target.value })} className={inputClass}>
            <option value="">– Keiner –</option>
            {relationshipTypes.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Wird genutzt um passende Feiertage anzuzeigen (z.B. Muttertag, Vatertag)
          </p>
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
