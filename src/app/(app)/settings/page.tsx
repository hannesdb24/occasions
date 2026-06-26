"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [inviteForm, setInviteForm] = useState({ email: "", name: "" });
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwError, setPwError] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Neue Passwörter stimmen nicht überein");
      return;
    }
    setPwStatus("loading");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    if (res.ok) {
      setPwStatus("success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      const data = await res.json();
      setPwError(data.error ?? "Fehler beim Ändern");
      setPwStatus("error");
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus("loading");
    setInviteError("");

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });

    if (res.ok) {
      setInviteStatus("success");
      setInviteForm({ email: "", name: "" });
    } else {
      const data = await res.json();
      setInviteError(data.error ?? "Fehler beim Senden");
      setInviteStatus("error");
    }
  }

  const inputClass = "w-full px-4 py-2.5 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered";

  return (
    <div className="max-w-xl space-y-10">
      <header>
        <p className="kicker mb-2">Konto</p>
        <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">Einstellungen</h1>
      </header>

      {/* Einladung */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-xl font-medium text-[var(--foreground)] mb-1">Jemanden einladen</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Lade Personen ein, Occasions zu nutzen. Sie erhalten einen Link per E-Mail und können ein eigenes Konto erstellen.
        </p>

        {inviteStatus === "success" && (
          <div className="mb-4 p-3 bg-[#c4704a]/10 text-[#a85c38] rounded-xl text-sm">
            Einladung wurde gesendet! ✓
          </div>
        )}
        {inviteStatus === "error" && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{inviteError}</div>
        )}

        <form onSubmit={sendInvite} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">Name (optional)</label>
            <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Max Mustermann" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">E-Mail *</label>
            <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required placeholder="person@example.de" className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={inviteStatus === "loading"}
            className="w-full py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered"
          >
            {inviteStatus === "loading" ? "Wird gesendet..." : "Einladung senden"}
          </button>
        </form>
      </section>

      {/* Passwort ändern */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-xl font-medium text-[var(--foreground)] mb-1">Passwort ändern</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Gib dein aktuelles Passwort ein und wähle ein neues.
        </p>

        {pwStatus === "success" && (
          <div className="mb-4 p-3 bg-[#c4704a]/10 text-[#a85c38] rounded-xl text-sm">
            Passwort erfolgreich geändert ✓
          </div>
        )}
        {pwError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{pwError}</div>
        )}

        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">Aktuelles Passwort</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">Neues Passwort</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2">Neues Passwort bestätigen</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
              autoComplete="new-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={pwStatus === "loading"}
            className="w-full py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered"
          >
            {pwStatus === "loading" ? "Wird gespeichert..." : "Passwort ändern"}
          </button>
        </form>
      </section>

      {/* Erinnerungen */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-xl font-medium text-[var(--foreground)] mb-1">E-Mail-Erinnerungen</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          Konfiguration der Erinnerungen folgt im nächsten Update.
        </p>
        <p className="editorial-italic text-sm">Demnächst verfügbar</p>
      </section>
    </div>
  );
}
