# Deploying to Vercel + Turso (free)

This deploys your club-attendance app so members can access it from anywhere. **Total cost: $0** on the current tiers.

- **Vercel** — hosts the Next.js app, gives you an `https://your-app.vercel.app` URL
- **Turso** — hosts your SQLite database in the cloud (the local file won't work on Vercel's serverless)

Expect ~15 minutes end-to-end.

---

## 1. Set up Turso (the database)

Turso is hosted libSQL — same query syntax as your local SQLite, so nothing in the app code needs to change.

```bash
# Install the Turso CLI (macOS)
curl -sSfL https://get.tur.so/install.sh | bash

# Follow prompts, then in a new terminal:
turso auth signup       # or `turso auth login` if you already have an account
```

Create a database and grab its connection info:

```bash
turso db create club-attendance
turso db show club-attendance --url          # copy this: libsql://club-attendance-<you>.turso.io
turso db tokens create club-attendance       # copy this token (long random string)
```

Push your schema to Turso:

```bash
# Point Prisma at Turso temporarily to push the schema
DATABASE_URL="<the libsql:// URL>" \
TURSO_AUTH_TOKEN="<the token>" \
npx prisma db push
```

You should see `Your database is now in sync with your Prisma schema.`

---

## 2. Push your code to GitHub

Vercel deploys from a Git repo, so:

```bash
cd ~/Projects/club-attendance
git init
git add .
git commit -m "Initial club attendance app"
```

Then create an empty repo on GitHub (private is fine — anyone can still visit the deployed URL) and push:

```bash
git remote add origin https://github.com/<your-username>/club-attendance.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy to Vercel

1. Go to https://vercel.com and sign up with GitHub if you haven't.
2. Click **Add New → Project**.
3. Import the `club-attendance` repo.
4. Vercel auto-detects Next.js — leave build settings on defaults.
5. Before clicking **Deploy**, expand **Environment Variables** and add each of these:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | The `libsql://…` URL from `turso db show` |
| `TURSO_AUTH_TOKEN` | The token from `turso db tokens create` |
| `ADMIN_PASSWORD` | Pick a strong password (this is what you log in with) |
| `SESSION_SECRET` | A random hex string. Generate with `openssl rand -hex 32` |
| `SLACK_BOT_TOKEN` | Your `xoxb-…` bot token (see README) — leave blank if not ready |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The full JSON string of your service account (see README) — leave blank if not ready |
| `GOOGLE_CALENDAR_ID` | Your club's calendar ID (see README) — leave blank if not ready |
| `SOCIAL_EVENT_PREFIX` | `[Social]` (or your own convention) |

6. Click **Deploy**. First build takes ~2 minutes.

When it finishes you get a URL like `https://club-attendance-xxxx.vercel.app`. Share that with members.

---

## 4. Seed your first members

You could add each member through the admin UI (`/admin/members`), or bulk-seed from your terminal:

```bash
# Edit prisma/seed.ts with your real roster first, then:
DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run db:seed
```

---

## 5. Custom domain (optional)

In Vercel: **Project Settings → Domains**. Add whatever you own (e.g. `attendance.yourclub.org`). Vercel handles the SSL cert for free.

---

## Troubleshooting

**Build fails with `PrismaClient is unable to run in this browser environment`.** Vercel runs the build in an edge context by default for some routes. Every route that touches the DB in this project uses `export const dynamic = "force-dynamic"` so this shouldn't happen — but if it does, add that line to the file mentioned in the error.

**`DATABASE_URL not found`.** Make sure both `DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel's env vars for **Production** (and Preview if you use branch deploys).

**Login fails on the deployed site but works locally.** You probably still have `SESSION_SECRET` set to the placeholder `generate-a-random-secret`. Regenerate and redeploy.

**Slack DMs aren't sending.** Bot needs the `chat:write` scope. Also, Slack requires the bot to share a channel with the user OR the user to have DM'd the bot at least once before the bot can DM them.

**Members change but the page doesn't update.** Vercel caches server-rendered pages. Every dynamic page in this project already opts out with `force-dynamic`, but if you added a new page, add that export.

**How do I update the app?** Push to `main` → Vercel auto-redeploys. Schema changes: run `prisma db push` locally against the Turso URL after each schema edit.
