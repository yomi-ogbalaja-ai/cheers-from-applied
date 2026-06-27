# Cheers from Applied — Work Context

> Update this doc every session. Most recent work at the top.

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
