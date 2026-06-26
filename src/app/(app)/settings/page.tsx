"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [inviteForm, setInviteForm] = useState({ email: "", name: "" });
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

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

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      {/* Einladung */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Jemanden einladen</h2>
        <p className="text-sm text-gray-500 mb-4">
          Lade Personen ein, Occasions zu nutzen. Sie erhalten einen Link per E-Mail und können ein eigenes Konto erstellen.
        </p>

        {inviteStatus === "success" && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            Einladung wurde gesendet! ✓
          </div>
        )}
        {inviteStatus === "error" && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{inviteError}</div>
        )}

        <form onSubmit={sendInvite} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
            <input
              type="text"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="Max Mustermann"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              required
              placeholder="person@example.de"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={inviteStatus === "loading"}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {inviteStatus === "loading" ? "Wird gesendet..." : "Einladung senden"}
          </button>
        </form>
      </section>

      {/* Erinnerungen */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">E-Mail-Erinnerungen</h2>
        <p className="text-sm text-gray-500 mb-4">
          Konfiguration der Erinnerungen folgt im nächsten Update.
        </p>
        <div className="text-sm text-gray-400 italic">Demnächst verfügbar</div>
      </section>
    </div>
  );
}
