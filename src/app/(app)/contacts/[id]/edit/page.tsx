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

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    name: "", birthday: "", category: "FAMILY", relationshipType: "", state: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

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
        });
        setFetching(false);
      });
  }, [id]);

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
        <div className="bg-card border-hairline rounded-2xl p-6 space-y-5">
          {[1,2,3].map((i) => <div key={i} className="h-10 bg-[rgba(28,25,22,0.04)] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/contacts/${id}`} className="text-sm transition-considered hover:text-[#c4704a]" style={{ color: "var(--muted-foreground)" }}>
          ← {form.name}
        </Link>
      </div>
      <div className="mb-8">
        <p className="kicker mb-2">Bearbeiten</p>
        <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">{form.name}</h1>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border-hairline rounded-2xl p-6">
        <div>
          <label className={labelClass}>Name *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} />
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
            {loading ? "Wird gespeichert..." : "Änderungen speichern"}
          </button>
          <Link href={`/contacts/${id}`} className="px-6 py-2.5 border-hairline rounded-full text-sm font-medium transition-considered hover:bg-[rgba(28,25,22,0.04)]">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
