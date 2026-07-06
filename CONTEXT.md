# Cheers from Applied — Work Context

> Update this doc every session. Most recent work at the top.

---

## 2026-07-06 — GIF picker restored, Harris board data recreated, repo cleanup

### GIF picker
The live composer's GIF tab used to be a Tenor-search box (`19d7459`), but without `TENOR_API_KEY` set (it never was — undocumented anywhere) it silently always showed the same 8 static fallback GIFs regardless of search query. Replaced with the paste-a-Giphy-link picker that used to exist on the other, now-abandoned branch (`2089d95`) — ported forward (not merged wholesale, see below), not re-fetched from that branch. Paste any `giphy.com/gifs/...` or `media.giphy.com/media/...` link, `giphyToMediaUrl()` extracts the ID and resolves it to a direct, embeddable URL with a live preview. No API key needed. `/api/gif-search` and the dead `GIF_SETS` preset-grid constant it had already superseded were removed.

Also added text labels under each composer tab's emoji (Message / Add Gif / Add photos / Voice) — icon-only wasn't clear enough.

### Delete post restored
Same pattern as the GIF picker: "Add delete post functionality" (`6b49ad8`) was another feature that only ever existed on the abandoned branch and never made it into what's deployed — live had an Edit button on posts but no Delete. Ported forward: `DELETE /api/boards/[id]/posts` (takes `{ postId }`, scoped to the board), and Edit/Delete buttons with an inline "Delete? Yes / No" confirm on hover, on both `PostTile` and `CheerSnippet`.

**Worth noting for whoever picks this up next:** two features independently vanished the same way (present on the old branch, silently absent from what's live) because that branch was never merged and nobody had a full inventory of what it contained. Checked the rest of that branch's commit log (`git log cb3edcc`, still reachable by SHA even though no branch points at it anymore) for anything else in the same situation, and found one more: `1e72c0c` replaced the honoree-initials avatar with the Applied logo (`public/applied-logo.png`) on the public share page (`/c/[token]`) — live still showed initials. Ported that too. The rest of that branch's commits (Postgres persistence, Tenor-search GIF picker, a README update) are superseded by what's already in `origin/main`, not missing features.

### Harris/wedding board recreated
The board recovered via browser-tab transcription + original posters' own copies (see 2026-07-02 entry, `recovery/board-harris-wedding.json`) was manually re-inserted directly into production Postgres (17 posts, 2 badges, 1 photo, 2 GIFs — the GIF links converted through the same `giphyToMediaUrl()` logic to match how they were actually originally posted). Board id `b0b68621-1404-487e-8121-dadcf123d7e9`. This is a reconstruction, not a restore — exact post times are best-effort (only day-level dates survived the recovery), and it's disclosed as such in the board's own `description` field. The actual point-in-time recovery from `#eng-apps-platform-v2` (see below) would supersede this if it happens.

### Repo/branch cleanup
Local `main` on this machine had drifted to a stale, never-pushed pointer at the old abandoned Postgres branch (`cb3edcc`) while all actual work landed on `origin/main` from a detached HEAD. Confirmed via `git ls-remote` that GitHub's `main` was never actually forked — it's the single source of truth and already had every fix from this session. Reset local `main` to match `origin/main` and checked it out properly (no more detached HEAD on this machine). The old branch's commits are no longer under any branch name (still recoverable via reflog for a while) — deliberately not merged wholesale, since it would have reintroduced the already-replaced Postgres implementation and produced heavy conflicts against files both branches independently rewrote. Anyone cloning fresh from `origin/main` gets the correct, current state.

### Still outstanding
- `#eng-apps-platform-v2` still hasn't been contacted for the point-in-time recovery of any boards beyond Harris's (see 2026-07-02 entry) — that data, if it existed, is still only recoverable through them.

---

## 2026-07-02 — Incident: production board data lost, root cause + partial recovery

### What happened (confirmed via git history + GCP logs, not speculation)

Two people built forward from the same commit (`adbcaac`, 2026-06-26) without ever reconciling:

- **Gabriel** (2026-06-26 21:13 → 2026-06-27 00:10, ending at commit `cb3edcc` on local branch `main`): migrated persistence to **Cloud SQL Postgres** via `@google-cloud/cloud-sql-connector` + IAM auth, specifically so boards would survive deploys/restarts. `project.toml` had `enable_postgres = true`. This revision (Cloud Run revision `cheers-from-applied-00017-qgr`) deployed 2026-06-27 and **worked correctly for 5 days**, serving real user-created boards (confirmed via Cloud Run logs — e.g. board UUIDs `5804dabf-5dc9-482e-a8f9-14d9e3981390`, `b68659d2-73eb-457a-b07b-83acbd98f8c0`, not seed data).
- **Yomi** (starting 2026-07-01, 5 days later): branched forward from `adbcaac` **before** Gabriel's Postgres work existed, built several rounds of new features, and in commit `19d7459` switched persistence to `@libsql/client` (Turso), falling back to ephemeral `file:/tmp/cheers.db` if `TURSO_DATABASE_URL` isn't set. This line was pushed to `origin/main`, entirely superseding Gabriel's history there — Gabriel's Postgres commits never made it into what's deployed. `project.toml`'s `enable_postgres` flag was also dropped in this line.

**The actual data-loss event:** Cloud Run logs show the `boards`/`badges`/etc. tables existed and were being read successfully by revision `00017` as late as **2026-07-02T20:47:32Z**. Between then and **20:50:20Z**, the tables were dropped out from under the still-live old revision, which immediately started throwing `relation "boards" does not exist`.

**Root cause of the drop, confirmed via Cloud Audit Logs, not a manual `DROP TABLE`:** at **20:49:52Z**, `yomi.ogbalaja@applied.co` ran `apps-platform app deploy` (`google.cloud.run.v1.Services.ReplaceService`). Yomi's branch's `project.toml` had no `enable_postgres = true` line (it forked before Gabriel added it). Seventeen seconds later (20:50:09Z), Apps Platform's internal provisioning service (`trident@experimental-apps-v2.iam.gserviceaccount.com`) connected to its own control-plane database (`exp-provisioner-db`) to reconcile the app's infrastructure against the newly-deployed `project.toml` — and within the next ~10 seconds, the app's tables in the shared `exp-db` instance were gone. The mechanism strongly appears to be: **Apps Platform's deploy-time reconciliation treats the absence of `enable_postgres = true` as "this app no longer wants a database" and tears down/drops the objects owned by the app's DB role as part of that reconciliation** — automatically, without any human running SQL, and without the deploying engineer (who had no idea Postgres was involved) doing anything unusual. Revision `00018` (the libsql/Turso code, which never touches Postgres at all) then rolled out four minutes later at 20:54:00Z. **This is inferred from log correlation, not confirmed by the platform team — flag it to `#eng-apps-platform-v2` for confirmation; if true, it's a sharp, undocumented edge in their tooling worth them knowing about regardless of this incident.**

Compounding factors that made this possible:
- Three unused deploy configs (`fly.toml`, `vercel.json`, `railway.json`) existed alongside the real deploy mechanism (Applied's internal `apps-platform` → Cloud Run), creating ambiguity about what was actually live. **These have been deleted.**
- The original Postgres implementation (`main:src/lib/db.ts`) wrote to the shared `public` schema instead of Apps Platform's documented per-app-schema convention (`SET search_path TO <app_name_with_underscores>`) — not what caused the drop, but it meant this app's data had no schema-level isolation on a 100+-tenant instance. **Fixed** — see below.
- `git log --all` shows the diverged history was never surfaced/merged — `main` (local) and `origin/main` disagreed by 8/7 commits at the time of writing.

### Recovery status

`exp-db` has point-in-time recovery enabled (7-day transaction log retention), so the dropped data is very likely recoverable via a **point-in-time clone** of the instance to `2026-07-02T20:49:00Z` (before the drop), extracting the `cheers-from-applied`-owned rows from `public.boards`/`board_posts`/`board_gifts`/`badges`, then re-importing them. This does **not** require restoring the shared instance in place — `exp-db` serves 100+ other apps.

Blocked on: cloning the instance requires Cloud SQL instance-admin IAM permissions that an individual app owner (`gabriel.acosta@applied.co`) doesn't have. **Needs `#eng-apps-platform-v2` to either run the clone or grant temporary permission.** Target restore point: `2026-07-02T20:49:00Z` UTC. **Not yet done as of this entry** — this is the one piece of the incident that isn't resolved by the code fix below; the fix prevents recurrence, it doesn't bring back what's already gone.

**Fallback manual recovery complete for one board:** Gabriel had a browser tab still rendering one lost board client-side (never reloaded after the drop). Fully transcribed to `recovery/board-harris-wedding.json` — all 17 posts recovered (14 with full text from the page; 3 were image/GIF-only posts, recovered separately: Gabriel's original image file from his own `~/Downloads` — now also copied into `recovery/images/` — plus Giphy links for Steven's and Matia's). This is a fallback, not authoritative — prefer the point-in-time clone if/when it succeeds (real emails, exact timestamps, actual media). Not yet re-inserted into any running instance of the app. If more boards were open in other tabs, transcribe those the same way before they get reloaded/closed.

### Fix implemented (this entry)

- `src/lib/db-client.ts` rewritten to use Postgres (`pg` + `@google-cloud/cloud-sql-connector`, IAM auth) as the real backend — the exact connection pattern proven in Gabriel's original `00017` revision — instead of libsql/Turso. Scoped to the Apps Platform per-app schema convention (`cheers_from_applied`, falling back to `public` since that schema isn't provisioned until a deploy with `enable_postgres = true` runs).
- **Production now fails loudly instead of silently falling back to ephemeral storage** if no DB is configured — this is the single most important change; a repeat of this exact incident (deploy landing without DB config) will now crash on startup instead of quietly serving from `/tmp`.
- Local dev: zero-config still works (ephemeral SQLite fallback, now clearly logged as such), or run against the real DB via `apps-platform app connect-db` + `DB_USER`/`DB_NAME`/`K_SERVICE` env vars — both verified working end-to-end (board create, post create, badge auto-award, schema defaults) against production `exp-db` during this session, then cleaned up.
- Fixed a real regression that would've shipped otherwise: Postgres returns `COUNT(*)` as a stringified bigint by default; `pg`'s type parser for OID 20 is now overridden to return a number, since the landing page does `boards.reduce((s, b) => s + b.post_count, 0)` which would silently turn into string concatenation otherwise.
- `project.toml` has `enable_postgres = true` again.
- Deleted dead code: `src/lib/db.ts`, `src/lib/seed.ts` (old better-sqlite3 implementation, unused by any route), `better-sqlite3` dependency.
- **Not yet deployed** — this is all local/tested-against-prod-via-tunnel, not yet shipped via `apps-platform app deploy`. Deploying it is what will re-provision (or confirm) the `cheers_from_applied` schema and grants.

### Follow-up work still needed
- Get apps-platform team to perform the point-in-time clone + extract the pre-drop data, and confirm/deny the deploy-time-teardown theory above.
- Deploy this fix (after `git fetch`/merge to latest `origin/main` per the new README rule — check for further drift first).
- Once deployed, verify boards created going forward actually survive a redeploy (create a test board, redeploy, confirm it's still there) — the actual proof this incident can't repeat.

---

## 2026-06-26 — Persistence + UX fixes

### What was done
1. **Replaced in-memory DB with real SQLite** (`better-sqlite3@12.11.1`)
   - Data now writes to `/data/cheers.db` on the Fly.io persistent volume
   - Falls back to `:memory:` if `DATA_DIR` is not set (local dev without a volume)
   - Seeds demo boards only when the DB is empty on first boot
   - Config: `next.config.ts` → `serverExternalPackages: ["better-sqlite3"]`
   - Dockerfile: explicitly copies `node_modules/better-sqlite3` to the standalone output

2. **Fixed board loading-forever bug**
   - `fetchBoard()` in `board/[id]/page.tsx` was not calling `setLoading(false)` on 404 responses
   - Page would spin forever when board ID wasn't in DB (e.g. after a restart)
   - Fixed: now calls `setLoading(false)` before returning on non-OK responses

3. **Fixed apostrophe SQL injection bug**
   - `boards/[id]/posts/route.ts` had a literal `'Showed up for a teammate's milestone'` in SQL
   - Would crash real SQLite — fixed by making `reason` a bind parameter

4. **Post editing**
   - Added `PATCH /api/boards/[id]/posts` endpoint (takes `{ postId, message }`)
   - `PostTile` and `CheerSnippet` both get an inline Edit button (appears on hover)
   - Only text/message field is editable; photo/gif/audio attachments are not changed
   - Manager notes are not editable through this UI

5. **Removed expand/collapse from posts**
   - `CheerSnippet` no longer collapses — posts are always fully shown
   - Removed "See more ↓" / "Show less ↑" toggle
   - Media (photo, gif, audio) always visible in the highlights grid

---

## Known issues / next up
- Public share page (`/c/[token]`) doesn't support editing (intentional — read-only)
- Fly.io `auto_stop_machines = true` with `min_machines_running = 0` — machine cold starts in ~2–3s, data persists on `/data` volume
- No authentication — anyone with the board URL can post or edit

---

## Deployment
- **Platform**: Fly.io (`cheers-from-applied` app, region `iad`)
- **Deploy**: `fly deploy --app cheers-from-applied`
- **Data volume**: `cheers_data` → `/data/cheers.db`
- **Node**: 20 (Docker `node:20-bookworm-slim`)

## URLs
- Internal board: `/board/{uuid}`
- Public share: `/c/{share_token}`
- Live app: `https://cheers-from-applied.experimental.apps.applied.dev`
