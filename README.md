# Occasions

Nie wieder einen Anlass vergessen – dein persönliches Netzwerk für Geburtstage, Jubiläen und besondere Momente.

## Setup

### 1. Umgebungsvariablen einrichten

```bash
cp .env.example .env
```

Dann `.env` befüllen:
- `DATABASE_URL` – PostgreSQL-Verbindungsstring
- `AUTH_SECRET` – Zufälliger String (z.B. `openssl rand -base64 32`)
- `RESEND_API_KEY` – API-Key von [resend.com](https://resend.com)
- `RESEND_FROM_EMAIL` – Absender-E-Mail
- `NEXT_PUBLIC_APP_URL` – URL der App (lokal: `http://localhost:3000`)

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Datenbank initialisieren

```bash
npx prisma generate
npx prisma db push
```

### 4. Starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. PostgreSQL-Datenbank anlegen (z.B. [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) oder [Neon](https://neon.tech))
2. Umgebungsvariablen in Vercel eintragen
3. `vercel deploy`

## Features

- Kontakte anlegen mit Kategorien (Familie, Freunde, Kollegen)
- Automatische Geburtstags-Erinnerungen
- Deutsche Feiertage via Nager.Date API
- Beziehungsbasierte Feiertage (Muttertag, Vatertag, Valentinstag)
- Wunschlisten erstellen und teilen
- Nutzer per E-Mail einladen
- E-Mail-Benachrichtigungen via Resend
