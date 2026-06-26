import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@occasions.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function baseTemplate(body: string): string {
  return `
    <div style="background:#faf9f7;padding:40px 0;font-family:Georgia,serif;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(28,25,22,0.08);">
        <div style="background:#1c1916;padding:28px 36px;text-align:center;">
          <span style="font-family:Georgia,serif;font-size:22px;color:#faf9f7;letter-spacing:-0.02em;">Occasions</span>
          <div style="width:40px;height:1px;background:#c4704a;margin:8px auto 0;opacity:0.8;"></div>
        </div>
        <div style="padding:36px;">
          ${body}
        </div>
        <div style="padding:20px 36px;border-top:1px solid rgba(28,25,22,0.08);text-align:center;">
          <p style="font-size:12px;color:#888;font-family:sans-serif;margin:0;">
            Du erhältst diese E-Mail, weil du bei Occasions registriert bist.<br>
            <a href="${APP_URL}/settings" style="color:#c4704a;">Benachrichtigungen verwalten</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function ctaButton(href: string, label: string): string {
  return `
    <p style="margin:32px 0;">
      <a href="${href}" style="background:#c4704a;color:#ffffff;padding:14px 28px;border-radius:100px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:600;">
        ${label}
      </a>
    </p>
  `;
}

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
    html: baseTemplate(`
      <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#1c1916;margin:0 0 16px;">Du wurdest eingeladen</h2>
      <p style="font-family:sans-serif;font-size:15px;color:#555;line-height:1.6;margin:0 0 12px;">
        Hallo${toName ? ` ${toName}` : ""},
      </p>
      <p style="font-family:sans-serif;font-size:15px;color:#555;line-height:1.6;margin:0 0 12px;">
        <strong style="color:#1c1916;">${fromName}</strong> hat dich zu <strong style="color:#1c1916;">Occasions</strong> eingeladen –
        der App, um Geburtstage, Jubiläen und besondere Anlässe nie wieder zu vergessen.
      </p>
      ${ctaButton(inviteUrl, "Einladung annehmen")}
      <p style="font-family:sans-serif;font-size:13px;color:#999;margin:0;">Der Link ist 7 Tage gültig.</p>
    `),
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
  const eventRows = events
    .map((e) => {
      const daysLabel =
        e.daysUntil === 0 ? "heute" :
        e.daysUntil === 1 ? "morgen" :
        `in ${e.daysUntil} Tagen`;
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid rgba(28,25,22,0.06);">
            <span style="font-family:Georgia,serif;font-size:15px;color:#1c1916;">${e.contactName}</span>
            <span style="font-family:sans-serif;font-size:13px;color:#888;"> · ${e.title}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid rgba(28,25,22,0.06);text-align:right;white-space:nowrap;">
            <span style="font-family:sans-serif;font-size:12px;background:#c4704a20;color:#c4704a;padding:3px 10px;border-radius:100px;font-weight:600;">${daysLabel}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${events.length} bevorstehende${events.length === 1 ? "r Anlass" : " Anlässe"} – Occasions`,
    html: baseTemplate(`
      <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#1c1916;margin:0 0 8px;">Bevorstehende Anlässe</h2>
      <p style="font-family:sans-serif;font-size:15px;color:#888;margin:0 0 24px;">Hallo ${userName}, das steht bald an:</p>
      <table style="width:100%;border-collapse:collapse;">
        ${eventRows}
      </table>
      ${ctaButton(`${APP_URL}/dashboard`, "Dashboard öffnen")}
    `),
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

  const eventRows = events
    .map((e) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(28,25,22,0.06);">
          <span style="font-family:Georgia,serif;font-size:15px;color:#1c1916;">${e.contactName}</span>
          <span style="font-family:sans-serif;font-size:13px;color:#888;"> · ${e.title}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(28,25,22,0.06);text-align:right;">
          <span style="font-family:sans-serif;font-size:13px;color:#888;">${e.date.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}</span>
        </td>
      </tr>
    `)
    .join("");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Deine Woche auf einen Blick – Occasions`,
    html: baseTemplate(`
      <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#1c1916;margin:0 0 8px;">Diese Woche</h2>
      <p style="font-family:sans-serif;font-size:15px;color:#888;margin:0 0 24px;">Hallo ${userName}, ${events.length} Anlass${events.length === 1 ? "" : "e"} diese Woche:</p>
      <table style="width:100%;border-collapse:collapse;">
        ${eventRows}
      </table>
      ${ctaButton(`${APP_URL}/dashboard`, "Dashboard öffnen")}
    `),
  });
}
