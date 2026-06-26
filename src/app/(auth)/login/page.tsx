"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("E-Mail oder Passwort falsch.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="bg-card border-hairline rounded-2xl p-8">
      {searchParams.get("registered") && (
        <div className="mb-5 p-3 bg-[#c4704a]/10 text-[#a85c38] rounded-xl text-sm font-medium">
          Konto erstellt! Jetzt anmelden.
        </div>
      )}
      {error && (
        <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered mt-2"
        >
          {loading ? "Anmelden..." : "Anmelden"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        Noch kein Konto?{" "}
        <Link href="/register" className="text-[#c4704a] hover:text-[#a85c38] font-medium">
          Registrieren
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex flex-col items-center leading-none">
            <span className="font-serif font-medium tracking-tight text-[32px] text-[var(--foreground)]">Occasions</span>
            <span className="mt-1.5 h-px w-2/3 bg-[#c4704a] opacity-80" />
          </span>
          <p className="mt-4 text-sm" style={{ color: "var(--muted-foreground)" }}>Anmelden um fortzufahren</p>
        </div>
        <Suspense fallback={<div className="bg-card border-hairline rounded-2xl p-8 h-64" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
