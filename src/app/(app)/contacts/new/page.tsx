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
    name: "",
    birthday: "",
    category: "FAMILY",
    relationshipType: "",
    state: "",
    notes: "",
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

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/contacts" className="text-gray-400 hover:text-gray-600 text-sm">← Kontakte</Link>
        <h1 className="text-2xl font-bold">Neuen Kontakt anlegen</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Vorname Nachname"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geburtsdatum</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm({ ...form, category: cat.value })}
                className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  form.category === cat.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-200 text-gray-600 hover:border-indigo-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beziehungstyp</label>
          <select
            value={form.relationshipType}
            onChange={(e) => setForm({ ...form, relationshipType: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">– Keiner –</option>
            {relationshipTypes.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Wird genutzt um passende Feiertage anzuzeigen (z.B. Muttertag, Vatertag)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bundesland</label>
          <select
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">– Keines (bundesweite Feiertage) –</option>
            {GERMAN_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Besondere Vorlieben, Interessen..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Wird gespeichert..." : "Kontakt speichern"}
          </button>
          <Link
            href="/contacts"
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
