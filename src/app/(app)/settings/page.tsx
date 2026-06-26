"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function getAvatarColor(name: string): string {
  const colors = ["#B85968", "#A8895C", "#C4623D", "#5B7FA6", "#6B8F5E"];
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
}

const digestHours = ["06:00","07:00","08:00","09:00","10:00","12:00","18:00","20:00"];
const leadDayOptions = [
  { value: 1, label: "1 Tag vorher" },
  { value: 3, label: "3 Tage vorher" },
  { value: 7, label: "7 Tage vorher" },
  { value: 14, label: "14 Tage vorher" },
  { value: 30, label: "1 Monat vorher" },
];

export default function SettingsPage() {
  const { data: session } = useSession();

  // Profile data
  const [profile, setProfile] = useState<{ name: string; email: string; contactCount: number; emailRemindersEnabled: boolean; digestTime: string; reminderLeadDays: number } | null>(null);

  // Invite
  const [inviteForm, setInviteForm] = useState({ email: "", name: "" });
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwError, setPwError] = useState("");

  // Notification save
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    fetch("/api/users/me").then((r) => r.json()).then((data) => {
      setProfile({
        name: data.name ?? "",
        email: data.email ?? "",
        contactCount: data._count?.contacts ?? 0,
        emailRemindersEnabled: data.emailRemindersEnabled ?? true,
        digestTime: data.digestTime ?? "08:00",
        reminderLeadDays: data.reminderLeadDays ?? 7,
      });
    });
  }, []);

  async function saveNotifications() {
    if (!profile) return;
    setNotifSaving(true);
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailRemindersEnabled: profile.emailRemindersEnabled,
        digestTime: profile.digestTime,
        reminderLeadDays: profile.reminderLeadDays,
      }),
    });
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
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

  const inputClass = "w-full px-4 py-2.5 border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30 bg-[var(--background)] text-sm transition-considered";
  const labelClass = "block text-xs font-semibold tracking-wider uppercase text-[#c4704a] mb-2";
  const avatarColor = getAvatarColor(profile?.name ?? session?.user?.name ?? "");
  const initial = (profile?.name ?? session?.user?.name ?? "?").charAt(0).toUpperCase();

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <p className="kicker mb-2">Konto</p>
        <h1 className="font-serif text-2xl font-medium text-[var(--foreground)]">Profil</h1>
      </header>

      {/* Profile card */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-full flex items-center justify-center text-white font-serif font-medium shrink-0"
            style={{ width: 64, height: 64, fontSize: 24, backgroundColor: avatarColor }}>
            {initial}
          </div>
          <div>
            <p className="font-serif text-xl font-medium text-[var(--foreground)]">{profile?.name ?? session?.user?.name}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{profile?.email ?? session?.user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[rgba(28,25,22,0.08)]">
          {[
            { label: "Personen", value: profile?.contactCount ?? "–" },
            { label: "Anlässe", value: "–" },
            { label: "Geschenke", value: "–" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-serif text-2xl font-medium text-[var(--foreground)]">{value}</div>
              <div className="kicker mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Notification preferences */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-lg font-medium text-[var(--foreground)] mb-1">Benachrichtigungen</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Wann und wie du an Anlässe erinnert werden möchtest.
        </p>

        {profile && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">E-Mail-Erinnerungen</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Erhalte Erinnerungen per E-Mail</p>
              </div>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, emailRemindersEnabled: !profile.emailRemindersEnabled })}
                className={`relative w-12 h-6 rounded-full transition-considered ${profile.emailRemindersEnabled ? "bg-[#c4704a]" : "bg-[rgba(28,25,22,0.15)]"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${profile.emailRemindersEnabled ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            {profile.emailRemindersEnabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Uhrzeit</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Zu welcher Uhrzeit du die E-Mail erhältst</p>
                  </div>
                  <select
                    value={profile.digestTime}
                    onChange={(e) => setProfile({ ...profile, digestTime: e.target.value })}
                    className="px-3 py-1.5 border-hairline rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30"
                  >
                    {digestHours.map((h) => <option key={h} value={h}>{h} Uhr</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Vorlaufzeit</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Wie früh du erinnert werden möchtest</p>
                  </div>
                  <select
                    value={profile.reminderLeadDays}
                    onChange={(e) => setProfile({ ...profile, reminderLeadDays: parseInt(e.target.value) })}
                    className="px-3 py-1.5 border-hairline rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[#c4704a]/30"
                  >
                    {leadDayOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={saveNotifications}
              disabled={notifSaving}
              className="w-full py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered"
            >
              {notifSaved ? "Gespeichert ✓" : notifSaving ? "Wird gespeichert..." : "Einstellungen speichern"}
            </button>
          </div>
        )}
      </section>

      {/* Invite */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-lg font-medium text-[var(--foreground)] mb-1">Jemanden einladen</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Lade Personen ein, Occasions zu nutzen.
        </p>
        {inviteStatus === "success" && (
          <div className="mb-4 p-3 bg-[#c4704a]/10 text-[#a85c38] rounded-xl text-sm">Einladung gesendet ✓</div>
        )}
        {inviteStatus === "error" && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{inviteError}</div>
        )}
        <form onSubmit={sendInvite} className="space-y-3">
          <div>
            <label className={labelClass}>Name (optional)</label>
            <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Max Mustermann" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-Mail *</label>
            <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} required placeholder="person@example.de" className={inputClass} />
          </div>
          <button type="submit" disabled={inviteStatus === "loading"}
            className="w-full py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered">
            {inviteStatus === "loading" ? "Wird gesendet..." : "Einladung senden"}
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="bg-card border-hairline rounded-2xl p-6">
        <h2 className="font-serif text-lg font-medium text-[var(--foreground)] mb-1">Passwort ändern</h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>Gib dein aktuelles Passwort ein und wähle ein neues.</p>
        {pwStatus === "success" && (
          <div className="mb-4 p-3 bg-[#c4704a]/10 text-[#a85c38] rounded-xl text-sm">Passwort erfolgreich geändert ✓</div>
        )}
        {pwError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{pwError}</div>}
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className={labelClass}>Aktuelles Passwort</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required autoComplete="current-password" className={inputClass} placeholder="••••••••" />
          </div>
          <div>
            <label className={labelClass}>Neues Passwort</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" className={inputClass} placeholder="Mindestens 8 Zeichen" />
          </div>
          <div>
            <label className={labelClass}>Neues Passwort bestätigen</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required autoComplete="new-password" className={inputClass} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={pwStatus === "loading"}
            className="w-full py-2.5 bg-[var(--foreground)] text-[var(--card)] rounded-full font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-considered">
            {pwStatus === "loading" ? "Wird gespeichert..." : "Passwort ändern"}
          </button>
        </form>
      </section>
    </div>
  );
}
