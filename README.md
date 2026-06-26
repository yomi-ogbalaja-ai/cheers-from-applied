# Cheers from Applied

Employee celebration boards for Applied Intuition. Send shout-outs, milestone cards, and peer recognition that actually sticks.

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
- **Seed data** — a sample board auto-loads on first run so you can explore immediately

---

## Local Development

### Prerequisites

- Node.js 18+
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

The SQLite database (`data/cheers.db`) is created automatically on first run. Seed data is loaded automatically — no manual step needed.

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

## Deploying to Fly.io

### First deploy

```bash
# Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/

# Create the app (once)
fly apps create cheers-from-applied

# Create a persistent volume for SQLite
fly volumes create cheers_data --region iad --size 1

# Set secrets (optional — only if using email)
fly secrets set SMTP_HOST=smtp.example.com --app cheers-from-applied
fly secrets set SMTP_PORT=587 --app cheers-from-applied
fly secrets set SMTP_USER=user@example.com --app cheers-from-applied
fly secrets set SMTP_PASS=yourpassword --app cheers-from-applied

# Deploy
fly deploy
```

### Subsequent deploys

```bash
fly deploy
```

The `fly.toml` is already configured with:
- Region: `iad` (US East)
- Port: `8080`
- Persistent volume mounted at `/data` for the SQLite database
- Auto-stop/start for cost efficiency on low-traffic apps

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite via better-sqlite3 |
| Animations | canvas-confetti |
| Email | nodemailer |
| Runtime | Node.js 18+ |
| Deploy | Fly.io (Docker) |

---

## Health Check

`GET /api/health` returns `{ status: "ok", app: "cheers-from-applied", ts: "<iso timestamp>" }`
