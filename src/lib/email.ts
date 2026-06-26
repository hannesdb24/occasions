import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@occasions.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendInvitationEmail({
  to,
  toName,
  fromName,
  token,
}: {
  to: string;
  toName?: string;
  fromName: string;
  token: string;
}) {
  const inviteUrl = `${APP_URL}/invite/${token}`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${fromName} hat dich zu Occasions eingeladen`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>Du wurdest eingeladen! 🎉</h2>
        <p>Hallo${toName ? ` ${toName}` : ""},</p>
        <p><strong>${fromName}</strong> hat dich zu <strong>Occasions</strong> eingeladen –
        der App, um Geburtstage, Jubiläen und besondere Anlässe nie wieder zu vergessen.</p>
        <p style="margin: 32px 0;">
          <a href="${inviteUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Einladung annehmen
          </a>
        </p>
        <p style="color: #888; font-size: 14px;">Der Link ist 7 Tage gültig.</p>
      </div>
    `,
  });
}

export async function sendReminderEmail({
  to,
  userName,
  events,
}: {
  to: string;
  userName: string;
  events: { contactName: string; title: string; date: Date; daysUntil: number }[];
}) {
  const eventList = events
    .map(
      (e) =>
        `<li><strong>${e.contactName}</strong> – ${e.title} in <strong>${e.daysUntil} Tag${e.daysUntil === 1 ? "" : "en"}</strong> (${e.date.toLocaleDateString("de-DE")})</li>`
    )
    .join("");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${events.length} bevorstehende${events.length === 1 ? "r Anlass" : " Anlässe"} – Occasions`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>Bevorstehende Anlässe 📅</h2>
        <p>Hallo ${userName},</p>
        <p>folgende Anlässe stehen bald an:</p>
        <ul style="line-height: 2;">${eventList}</ul>
        <p style="margin: 32px 0;">
          <a href="${APP_URL}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Dashboard öffnen
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendWeeklyDigestEmail({
  to,
  userName,
  events,
}: {
  to: string;
  userName: string;
  events: { contactName: string; title: string; date: Date; daysUntil: number }[];
}) {
  if (events.length === 0) return;

  const eventList = events
    .map(
      (e) =>
        `<li><strong>${e.contactName}</strong> – ${e.title} am ${e.date.toLocaleDateString("de-DE")}</li>`
    )
    .join("");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Deine Woche auf einen Blick – Occasions`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2>Diese Woche ✨</h2>
        <p>Hallo ${userName},</p>
        <p>diese Woche gibt es ${events.length} Anlass${events.length === 1 ? "" : ""}:</p>
        <ul style="line-height: 2;">${eventList}</ul>
        <p style="margin: 32px 0;">
          <a href="${APP_URL}/calendar" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Kalender öffnen
          </a>
        </p>
      </div>
    `,
  });
}
