"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...(inviteToken ? { inviteToken } : {}) }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registrierung fehlgeschlagen");
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="bg-card border-hairline rounded-2xl p-8">
      {error && (
        <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoComplete="name"
            className="w-full px-4 py-3 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered"
            placeholder="Dein Name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">E-Mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
            className="w-full px-4 py-3 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered"
            placeholder="deine@email.de"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">Passwort</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered"
            placeholder="Mindestens 8 Zeichen"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered mt-2"
        >
          {loading ? "Konto wird erstellt..." : "Konto erstellen"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        Bereits ein Konto?{" "}
        <Link href="/login" className="text-[#c4704a] hover:text-[#a85c38] font-medium">
          Anmelden
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex flex-col items-center leading-none">
            <span className="font-serif font-medium tracking-tight text-[28px] text-[var(--foreground)]">Occasions</span>
            <span className="mt-1.5 h-px w-2/3 bg-[#c4704a] opacity-80" />
          </span>
          <p className="mt-4 text-sm" style={{ color: "var(--muted-foreground)" }}>Neues Konto erstellen</p>
        </div>
        <Suspense fallback={<div className="bg-card border-hairline rounded-2xl p-8 h-64" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
