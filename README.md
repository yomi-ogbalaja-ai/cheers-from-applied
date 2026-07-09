# Cheers from Applied

Employee celebration boards for Applied Intuition. Send shout-outs, milestone cards, and peer recognition that actually sticks.

## ⚠️ Read before touching persistence or deploying

**Boards created by real users must survive every deploy and every restart. This has failed in production before — see [CONTEXT.md](./CONTEXT.md) for the full incident writeup. Do not repeat it.**

Hard rules for anyone (human or AI) working on this app:

0. **`project.toml` must always have `enable_postgres = true`. Do not remove it, even temporarily, even on a branch.** This is not a formality — it is the literal, confirmed cause of the 2026-07-02 incident: a branch that forked before this line was added got deployed, Apps Platform's deploy-time reconciliation read "no database declared" from that `project.toml`, and tore down this app's Postgres schema/tables as part of reconciling to that state — destroying real user data, automatically, with no human running any SQL. If you ever see a diff touching `project.toml` that removes or doesn't include `enable_postgres = true`, treat it as a production-data-loss bug, not a cleanup. Before merging or deploying any branch, check: `grep enable_postgres project.toml`.
1. **Never let the primary persistence path be ephemeral.** Nothing in the request path may depend on local disk (`/tmp`), in-memory state, or any storage that resets on cold start/redeploy. If you see a fallback like `?? "file:/tmp/..."` or `:memory:` in the DB layer, that fallback firing in production is a data-loss bug, not a convenience.
2. **Don't assume what's provisioned — check.** This app deploys via Applied's internal `apps-platform` to Cloud Run, not Fly/Vercel/Railway (those configs existed at various points and have been removed — they were never the real deploy target). `project.toml`'s `enable_postgres` flag controls whether a real Cloud SQL Postgres database is provisioned for this app. Before changing the DB layer, confirm what's actually wired up in the live environment:
   ```bash
   gcloud run services describe cheers-from-applied --project=experimental-apps-v2 --region=us-west1 \
     --format="yaml(spec.template.spec.containers[0].env)"
   ```
   If `INSTANCE_CONNECTION_NAME` / `DB_USER` / `DB_NAME` are present, a Postgres instance is provisioned and should be the source of truth — don't introduce a second, disconnected persistence layer alongside it.
3. **Never run destructive SQL (`DROP TABLE`, `TRUNCATE`, unscoped `DELETE`) against the production database without explicit human sign-off.** The Postgres instance backing this app (`exp-db` in `experimental-apps-v2`) is a **shared, multi-tenant instance used by 100+ other Applied apps** — there is no per-app isolation beyond schema/table naming. A mistake here doesn't just affect this app.
4. **Before deploying, sync with the remote first — every time:**
   ```bash
   git fetch origin
   git merge origin/main   # or rebase — just don't deploy code built on a stale/diverged base
   ```
   This repo has a documented history of two people building forward from different, diverged points in `main` without ever reconciling — one branch's persistence work silently never made it into what got deployed. Confirm you're building on top of the latest `origin/main`, not a local branch that has quietly forked from it (`git log --all --oneline --graph` will show if history has split).
5. **Local dev fallbacks are fine locally, never in prod.** It's fine for `getDb()`/`getClient()` to fall back to `:memory:` or a temp file when no production DB is configured, *for local development*. It is not fine for that same fallback to be what production silently runs on because a required env var/secret was never set. If a persistence-critical env var is missing in production, fail loudly (crash/error) rather than falling back silently.

## What It Does

Cheers from Applied lets teams create rich celebration boards for colleagues — birthdays, work anniversaries, promotions, farewells, or any moment worth marking. Each board lives at a shareable link and collects posts from teammates before the big reveal.

### Features

- **Multiple post types** — text messages, GIFs (via search), photos, and voice recordings
- **Badges** — attach a recognition badge (e.g. "Innovator", "Team Player") to any post
- **Manager approval queue** — managers see all incoming posts and can approve/hide before the recipient views the board
- **Three board views**
  - **Manager view** — full moderation queue with approve/hide controls
  - **Contributor view** — add a post, see what others have written
  - **Receiver view** — the final celebration experience, with confetti
- **Public share links** — each board gets a unique URL; no login required to post or view
- **Email notifications** — notify the recipient when their board is ready (requires SMTP config)
- **View tracking** — unique (anonymous, deduped-by-browser) views per board are recorded and shown in the Manager Dashboard (`/dashboard`) as a "Total Views" stat and a per-board "Views" column
- **Seed data** — a sample board auto-loads on first run so you can explore immediately

---

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# 1. Install dependencies (legacy peer deps needed for React 19 compat)
npm install --legacy-peer-deps

# 2. Copy env file and fill in any optional values
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

App runs at **http://localhost:3001**.

With no database env vars set, data is written to a local SQLite file at **`.local/cheers-dev.db`** (created automatically, gitignored) — fine for local dev, **not fine in production** (see the warning above; production throws instead of using this path). Seed data loads automatically on first run — no manual step needed.

**This file is not scratch space — don't delete it casually.** It persists across restarts by design, so boards you (or an agent working in this repo) create locally accumulate there over time. Deleting it silently wipes all of that with no way to recover it (this has actually happened — an agent ran `rm -f` on the old `/tmp`-based version of this file during "cleanup" after a test, on the assumption that anything in `/tmp` or labeled "ephemeral" is disposable; it wasn't, and real local test boards were lost). If you need a clean slate, ask first, and prefer moving the file aside (`mv .local/cheers-dev.db .local/cheers-dev.db.bak`) over deleting it outright. It intentionally no longer lives in `/tmp` for this reason.

To develop against the real production database instead (e.g. to test a schema change safely — it's isolated per-app, see the persistence warning above — **note this is genuinely production data, not a separate dev instance; don't create test/throwaway boards through it**):

```bash
apps-platform app connect-db cheers-from-applied   # in one terminal, leave running
DB_USER="cheers-from-applied-sa@experimental-apps-v2.iam" DB_NAME="postgres" K_SERVICE="cheers-from-applied" npm run dev
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run seed` | Re-seed the database with sample data |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values as needed.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | No | Public base URL (defaults to `http://localhost:3001`) |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From address for notification emails |
| `WORKDAY_API_URL` | No | Workday API base URL for gift balance lookup |
| `WORKDAY_API_TOKEN` | No | Workday API token |

Email and Workday integrations are fully optional. If SMTP is not configured, email notifications fall back to console logging.

---

## Deploying

This app deploys on **Applied's internal Apps Platform**, which runs it on Google Cloud Run. There is no Fly.io, Vercel, or Railway deployment — configs for those were removed; they were leftover experiments, not real deploy targets.

- Live app: `https://cheers-from-applied.experimental.apps.applied.dev`
- GCP project: `experimental-apps-v2`, region `us-west1`
- Docs: https://apps.applied.dev · Slack: `#eng-apps-platform-v2`

**Before every deploy:**

```bash
git fetch origin
git merge origin/main    # make sure you're building on the latest remote history, not a stale fork
```

**Deploy:**

```bash
apps-platform auth login          # once
apps-platform app deploy --service cheers-from-applied
```

`project.toml` declares what infrastructure Apps Platform provisions for this app (`enable_postgres`, `enable_secrets`, etc.). If `enable_postgres = true`, Cloud Run gets `INSTANCE_CONNECTION_NAME`, `DB_USER`, `DB_NAME` env vars for a Cloud SQL Postgres database automatically — check current provisioning with:

```bash
gcloud run services describe cheers-from-applied --project=experimental-apps-v2 --region=us-west1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

To connect to the production database locally for debugging (read-only unless you know what you're doing — see the persistence rules above):

```bash
apps-platform app connect-db cheers-from-applied --connect
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | `src/lib/db-client.ts` — Postgres (via `pg` + `@google-cloud/cloud-sql-connector` with IAM auth) against the Cloud SQL instance Apps Platform provisions for this app (`project.toml` `enable_postgres = true`), scoped to a per-app schema (`cheers_from_applied`, falling back to `public`). Falls back to an ephemeral local SQLite file (`@libsql/client`) only in local dev with no DB configured, and throws instead of silently falling back if that would happen in production. |
| Animations | canvas-confetti |
| Email | nodemailer |
| Runtime | Node.js 20+ |
| Deploy | Applied Apps Platform → Google Cloud Run |

---

## Health Check

`GET /api/health` returns `{ status: "ok", app: "cheers-from-applied", ts: "<iso timestamp>" }`
