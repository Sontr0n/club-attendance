# Club Attendance

A small web app to track attendance for your club. Members submit two kinds of
forms (mark-present and absence-request); the admin handles everything else.

## What's in here

- **Member forms** (no login required)
  - `/present` — pick your name, type the meeting's secret password to be marked present.
  - `/absence` — pick your name, pick the event, write a reason. Must be ≥ 48 hours before the event or it's auto-denied with a strike.

- **Admin** (`/admin`, password-gated)
  - Dashboard with pending requests, recent strikes, upcoming events
  - Members list with strike counts and per-member detail pages
  - Events list synced from Google Calendar, with per-event attendance grid and manual marking (for socials)
  - Absence-request review queue — approve (excused) or deny (unexcused + strike)
  - Add members, create events manually, override attendance, remove strikes

- **Integrations**
  - **Slack** — bot DMs a member when they receive a strike (1st = warning, 2nd = "meet with board")
  - **Google Calendar** — pull events into the app, classify as meetings or socials

- **Strike rules**
  - 1st strike: warning DM
  - 2nd strike: DM saying they must meet with the board
  - Triggers: late absence request, denied absence request, no-show on event close-out
  - Capped at 2 — additional missed events don't pile on; admin handles in person

## Setup

### 1. Install + database

```bash
npm install
cp .env.example .env
# edit .env (at minimum: ADMIN_PASSWORD and SESSION_SECRET)
npm run db:push
npm run db:seed      # optional sample data
npm run dev
```

Visit http://localhost:3000.

### Deploying to production

See [DEPLOY.md](DEPLOY.md) for a step-by-step guide to hosting on Vercel + Turso (free).

### 2. Slack bot (for strike DMs)

1. Go to https://api.slack.com/apps and click **Create New App** → **From scratch**.
2. Pick your workspace, name it (e.g. "Club Attendance").
3. **OAuth & Permissions** → Bot Token Scopes → add:
   - `chat:write` (to DM members)
   - `users:read` and `users:read.email` (to auto-find Slack users by email)
4. **Install to Workspace** → copy the **Bot User OAuth Token** (starts with `xoxb-`).
5. Paste it into `.env` as `SLACK_BOT_TOKEN`.
6. Either invite the bot to a channel users share with, or send users a DM once
   so Slack permits the bot to DM them (Slack rules).

When you add a member with their @company.com email and the bot has
`users:read.email`, the app auto-fills their Slack user ID. Otherwise you can
paste the Slack ID manually.

If `SLACK_BOT_TOKEN` is unset, strike notifications log to the server console
instead — useful while testing.

### 3. Google Calendar (for event sync)

1. Go to https://console.cloud.google.com/, create (or pick) a project.
2. **APIs & Services → Enable APIs** → enable **Google Calendar API**.
3. **IAM & Admin → Service Accounts** → create a service account (any name).
   - **Keys** tab → **Add Key** → **JSON** → download.
4. Copy the entire JSON contents into `.env` as `GOOGLE_SERVICE_ACCOUNT_JSON`
   on a single line (or escape newlines).
5. In Google Calendar, open your club's calendar settings → **Share with
   specific people** → add the service account's email (the `client_email`
   from the JSON) with **See all event details** access.
6. From that same settings page, copy the **Calendar ID** → put it in `.env`
   as `GOOGLE_CALENDAR_ID`.
7. Optionally set `SOCIAL_EVENT_PREFIX` — events whose title starts with this
   are classified as socials (default `[Social]`). Everything else is a meeting.

Then in the admin, click **Sync Google Calendar** on `/admin/events`.

Newly-imported meetings get an auto-generated secret password you can edit on
the event detail page. Re-syncing updates titles/times but preserves your
passwords and any attendance records.

## Daily flow

1. Members submit absence requests as life happens. You review them on `/admin/requests`.
2. The day of a meeting, share the event's secret password (visible on its admin page) with present members.
3. After the meeting (or social) ends, open the event page:
   - For meetings, members who entered the password are already marked present. Use **Close event** to issue no-show strikes to everyone else without an approved absence.
   - For socials, mark attendance manually using the per-row dropdown, then **Close event**.
4. Strike DMs go out automatically. Members at 2 strikes show up in red on the dashboard.

## Tech

- Next.js 14 (App Router) + TypeScript
- Prisma + SQLite (file at `prisma/dev.db`)
- Tailwind CSS
- `@slack/web-api` and `googleapis`
