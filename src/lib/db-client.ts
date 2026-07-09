// Async database client. See README.md "Read before touching persistence or
// deploying" before changing anything in this file — a misconfigured fallback
// here is exactly what caused a real production data-loss incident on
// 2026-07-02 (see CONTEXT.md).
//
// Backend selection, in order:
//   1. DATABASE_URL set            → connect directly (generic escape hatch).
//   2. INSTANCE_CONNECTION_NAME set → production on Cloud Run. Apps Platform
//      provisions this (project.toml `enable_postgres = true`) and injects
//      INSTANCE_CONNECTION_NAME/DB_USER/DB_NAME. Connects via Cloud SQL
//      Connector with IAM auth (no password ever touches this code).
//   3. DB_USER set (no INSTANCE_CONNECTION_NAME) → local dev against the real
//      database through `apps-platform app connect-db cheers-from-applied`,
//      which tunnels to localhost:5432 and handles auth itself.
//   4. NODE_ENV=production and none of the above → throw. Refusing to fall
//      back to ephemeral storage in production is the whole point.
//   5. Otherwise (local dev, nothing configured) → local SQLite file for
//      zero-config quick start. Local-dev-only; unreachable in prod. This
//      file lives in the repo (`.local/cheers-dev.db`, gitignored), NOT
//      `/tmp` — it accumulates real board data across dev sessions (and
//      across agents working in this repo), so it must not be treated as
//      scratch space. Do not `rm` it, and do not point it at `/tmp` again:
//      see "Read before touching persistence or deploying" in README.md.
import { createClient as createLibsqlClient, type InValue } from "@libsql/client";
import { Pool, type PoolClient, types as pgTypes } from "pg";
import { mkdirSync } from "fs";
import { join } from "path";

// pg returns COUNT(*)/bigint columns as strings by default (avoids precision
// loss above Number.MAX_SAFE_INTEGER). SQLite/libsql returned these as native
// numbers, and callers (e.g. the landing page's `reduce((s, b) => s + b.post_count)`)
// rely on that — a stringified count there silently turns `+` into concatenation.
// This app never has counts anywhere near unsafe-integer range, so parse as number.
pgTypes.setTypeParser(20 /* int8/bigint */, (val: string) => parseInt(val, 10));

type Row = Record<string, unknown>;

interface Backend {
  kind: "pg" | "sqlite";
  query(sql: string, args: unknown[]): Promise<Row[]>;
  exec(sql: string): Promise<void>;
}

function toPositional(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Apps Platform convention: each app gets an isolated schema named after the
// service (hyphens → underscores), provisioned and granted to the app's DB
// role by Apps Platform itself when `enable_postgres = true` (the app's role
// has no privilege to create schemas on its own — least privilege on a shared
// instance). `public` is kept as a fallback in the search_path so this still
// works before/without that provisioning having run.
const PG_SCHEMA_NAME = (process.env.K_SERVICE ?? "cheers-from-applied").replace(/-/g, "_");

async function makePgBackend(pool: Pool): Promise<Backend> {
  // pg.Pool multiplexes queries across physical connections. Relying on a
  // pool-wide `SET search_path` (e.g. a `pool.on('connect', ...)` listener)
  // depends on internal emit-ordering to guarantee it runs before the next
  // query on that same connection — not worth the risk on the persistence
  // layer that caused the last incident. Instead, set it explicitly on the
  // same checked-out client immediately before every query.
  async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${PG_SCHEMA_NAME}, public`);
      return await fn(client);
    } finally {
      client.release();
    }
  }

  return {
    kind: "pg",
    async query(sql, args) {
      return withClient(async client => {
        const res = await client.query(toPositional(sql), args);
        return res.rows;
      });
    },
    async exec(sql) {
      await withClient(async client => {
        await client.query(sql);
      });
    },
  };
}

function makeSqliteBackend(client: ReturnType<typeof createLibsqlClient>): Backend {
  return {
    kind: "sqlite",
    async query(sql, args) {
      const res = await client.execute({ sql, args: args as InValue[] });
      return res.rows as unknown as Row[];
    },
    async exec(sql) {
      await client.execute(sql);
    },
  };
}

const NOW_PG = "to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')";

const SCHEMA_PG = `
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  honoree_name TEXT NOT NULL,
  honoree_email TEXT,
  honoree_avatar_color TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_date TEXT,
  values_tag TEXT,
  is_private INTEGER DEFAULT 0,
  public_share_enabled INTEGER DEFAULT 1,
  share_token TEXT,
  requires_gift_approval INTEGER DEFAULT 0,
  gift_manager_email TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_by_name TEXT,
  created_at TEXT DEFAULT ${NOW_PG},
  expires_at TEXT
);
CREATE TABLE IF NOT EXISTS board_posts (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_avatar_color TEXT,
  message TEXT,
  gif_url TEXT,
  gif_title TEXT,
  photo_url TEXT,
  audio_url TEXT,
  reaction TEXT,
  reactions_json TEXT DEFAULT '{}',
  is_manager_note INTEGER DEFAULT 0,
  values_tag TEXT,
  created_at TEXT DEFAULT ${NOW_PG}
);
CREATE TABLE IF NOT EXISTS board_gifts (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  gift_type TEXT,
  amount DOUBLE PRECISION,
  note TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  workday_balance DOUBLE PRECISION,
  created_at TEXT DEFAULT ${NOW_PG}
);
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  person_email TEXT NOT NULL,
  person_name TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  board_id TEXT,
  reason TEXT,
  awarded_at TEXT DEFAULT ${NOW_PG}
);
CREATE TABLE IF NOT EXISTS celebration_views (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  viewed_at TEXT DEFAULT ${NOW_PG},
  UNIQUE (board_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_posts_board ON board_posts(board_id);
CREATE INDEX IF NOT EXISTS idx_boards_token ON boards(share_token);
CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status);
CREATE INDEX IF NOT EXISTS idx_badges_board ON badges(board_id);
CREATE INDEX IF NOT EXISTS idx_badges_email ON badges(person_email);
CREATE INDEX IF NOT EXISTS idx_celebration_views_board ON celebration_views(board_id);
`;

const SCHEMA_SQLITE = `
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  honoree_name TEXT NOT NULL,
  honoree_email TEXT,
  honoree_avatar_color TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_date TEXT,
  values_tag TEXT,
  is_private INTEGER DEFAULT 0,
  public_share_enabled INTEGER DEFAULT 1,
  share_token TEXT,
  requires_gift_approval INTEGER DEFAULT 0,
  gift_manager_email TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_by_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);
CREATE TABLE IF NOT EXISTS board_posts (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_avatar_color TEXT,
  message TEXT,
  gif_url TEXT,
  gif_title TEXT,
  photo_url TEXT,
  audio_url TEXT,
  reaction TEXT,
  reactions_json TEXT DEFAULT '{}',
  is_manager_note INTEGER DEFAULT 0,
  values_tag TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS board_gifts (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  gift_type TEXT,
  amount REAL,
  note TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  workday_balance REAL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_email TEXT NOT NULL,
  person_name TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  board_id TEXT,
  reason TEXT,
  awarded_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS celebration_views (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  viewed_at TEXT DEFAULT (datetime('now')),
  UNIQUE (board_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_posts_board ON board_posts(board_id);
CREATE INDEX IF NOT EXISTS idx_boards_token ON boards(share_token);
CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status);
CREATE INDEX IF NOT EXISTS idx_badges_board ON badges(board_id);
CREATE INDEX IF NOT EXISTS idx_badges_email ON badges(person_email);
CREATE INDEX IF NOT EXISTS idx_celebration_views_board ON celebration_views(board_id);
`;

const EXPIRES_AT = "2026-08-25";

async function seed(backend: Backend) {
  const rows = await backend.query("SELECT COUNT(*) as c FROM boards", []);
  if (Number((rows[0] as Row)?.c ?? 0) !== 0) return;
  const n = new Date().toISOString().replace("T", " ").slice(0, 19);

  const boards = [
    ["board-alex-bday", "Alex Chen", "alex.chen@applied.co", "#6366f1", "birthday",
      "Happy Birthday, Alex!", "Alex has been an absolute rockstar this year.", "Win Together",
      0, 1, "share-alex-bday-2026", 1, "jordan.smith@applied.co", "active",
      "jordan.smith@applied.co", "Jordan Smith", EXPIRES_AT, n],
    ["board-sam-promo", "Sam Lee", "sam.lee@applied.co", "#8b5cf6", "promotion",
      "Congrats on the promo, Sam!", "Sam crushed it this cycle — from IC3 to IC4.", "Move with Urgency",
      0, 1, "share-sam-promo-2026", 0, null, "active",
      "yomi.ogbalaja@applied.co", "Yomi Ogbalaja", EXPIRES_AT, n],
    ["board-chris-welcome", "Chris Wong", "chris.wong@applied.co", "#10b981", "new_hire",
      "Welcome to Applied, Chris!", "Chris joins us as ML Engineer on the Perception team!", "Win Together",
      0, 1, "share-chris-welcome-2026", 1, "jordan.smith@applied.co", "active",
      "jordan.smith@applied.co", "Jordan Smith", EXPIRES_AT, n],
  ];
  for (const b of boards) {
    await backend.query(
      `INSERT INTO boards
        (id,honoree_name,honoree_email,honoree_avatar_color,type,title,description,values_tag,
         is_private,public_share_enabled,share_token,requires_gift_approval,gift_manager_email,
         status,created_by,created_by_name,expires_at,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT (id) DO NOTHING`,
      b,
    );
  }

  const posts = [
    ["post-1","board-alex-bday","Jordan Smith","jordan.smith@applied.co","#3b82f6",1,
      "Alex — you've been an incredible force on the team this past year. Happy Birthday!",null,null,null,"🎉","{}",null,n],
    ["post-2","board-alex-bday","Maya Patel","maya.patel@applied.co","#ec4899",0,
      "Happy birthday to my favourite backend genius! Here's to another year of you making all our systems work.",
      "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif","Birthday Confetti",null,null,"{}",null,n],
    ["post-3","board-alex-bday","Sam Lee","sam.lee@applied.co","#8b5cf6",0,
      "Happy birthday Alex!! Can't believe it's already been a year since you joined.",null,null,null,"❤️","{}",null,n],
    ["post-4","board-alex-bday","Chris Wong","chris.wong@applied.co","#10b981",0,
      "Still the new guy here but already learned so much from you Alex — thank you and happy birthday!",
      "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",null,null,null,"{}",null,n],
    ["post-5","board-alex-bday","Yomi Ogbalaja","yomi.ogbalaja@applied.co","#f59e0b",0,
      "Alex — the energy you bring to every room is infectious. Hope your day is incredible! Happy birthday!",
      null,null,null,"🔥","{}",null,n],
    ["post-6","board-sam-promo","Jordan Smith","jordan.smith@applied.co","#3b82f6",1,
      "Sam — this promotion has been long overdue. IC4 and beyond!",null,null,null,"🎉","{}",null,n],
    ["post-7","board-sam-promo","Maya Patel","maya.patel@applied.co","#ec4899",0,
      "Sammmm!!! IC4!!! You absolutely earned this.",
      "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",null,null,null,"{}",null,n],
    ["post-8","board-sam-promo","Alex Chen","alex.chen@applied.co","#6366f1",0,
      "Sam you've been such a great mentor to me. This is SO deserved. Congrats!!",null,null,null,"👏","{}",null,n],
    ["post-9","board-chris-welcome","Jordan Smith","jordan.smith@applied.co","#3b82f6",1,
      "Chris — so glad to have you on the Perception team! Welcome to Applied!",null,null,null,null,"{}",null,n],
    ["post-10","board-chris-welcome","Maya Patel","maya.patel@applied.co","#ec4899",0,
      "Welcome Chris! The design & ML teams are gonna do amazing things together!",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXppYWR1NWc2cDJxMHN1bm50MXpvaHFqeDNoeXd6MXR2MXB2aXdxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XDAY1NNG2VvobAp9o1/giphy.gif",
      null,null,null,"{}",null,n],
  ];
  for (const p of posts) {
    await backend.query(
      `INSERT INTO board_posts
        (id,board_id,author_name,author_email,author_avatar_color,is_manager_note,
         message,gif_url,gif_title,photo_url,reaction,reactions_json,values_tag,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT (id) DO NOTHING`,
      p,
    );
  }

  const gifts = [
    ["gift-1","board-alex-bday","Jordan Smith","jordan.smith@applied.co","time_off_hours",8,
      "Take a long weekend on us — you've earned it!","pending",null,120,n],
    ["gift-2","board-alex-bday","Maya Patel","maya.patel@applied.co","time_off_hours",4,
      "A little extra rest for your birthday week!","approved",null,88,n],
  ];
  for (const g of gifts) {
    await backend.query(
      `INSERT INTO board_gifts
        (id,board_id,from_name,from_email,gift_type,amount,note,status,approved_by,workday_balance,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT (id) DO NOTHING`,
      g,
    );
  }

  const badges = [
    ["alex.chen@applied.co","Alex Chen","birthday_star","board-alex-bday","Celebrated by 5 teammates!",n],
    ["jordan.smith@applied.co","Jordan Smith","cheer_champion","board-alex-bday","Kicked off 2 boards",n],
    ["maya.patel@applied.co","Maya Patel","generous_soul","board-alex-bday","Gifted time off hours",n],
    ["sam.lee@applied.co","Sam Lee","rising_star","board-sam-promo","Earned a well-deserved promotion!",n],
    ["yomi.ogbalaja@applied.co","Yomi Ogbalaja","team_player","board-alex-bday","Showed up for 3 teammates",n],
  ];
  for (const b of badges) {
    await backend.query(
      `INSERT INTO badges (person_email,person_name,badge_type,board_id,reason,awarded_at)
        VALUES (?,?,?,?,?,?)`,
      b,
    );
  }
}

async function createBackend(): Promise<Backend> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return makePgBackend(pool);
  }

  if (process.env.INSTANCE_CONNECTION_NAME) {
    const { Connector, AuthTypes, IpAddressTypes } = await import("@google-cloud/cloud-sql-connector");
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
      authType: AuthTypes.IAM,
      ipType: IpAddressTypes.PRIVATE,
    });
    const pool = new Pool({
      ...clientOpts,
      user: process.env.DB_USER,
      database: process.env.DB_NAME ?? "postgres",
      max: 5,
    });
    return makePgBackend(pool);
  }

  if (process.env.DB_USER) {
    // Local dev tunneled to the real DB via `apps-platform app connect-db` — the
    // tunnel handles auth, so this is a plain local Postgres connection.
    const pool = new Pool({
      host: "localhost",
      port: 5432,
      user: process.env.DB_USER,
      database: process.env.DB_NAME ?? "postgres",
      ssl: false,
    });
    return makePgBackend(pool);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No database configured in production (missing DATABASE_URL / INSTANCE_CONNECTION_NAME). " +
      "Refusing to fall back to ephemeral storage — this is what caused the 2026-07-02 data loss. " +
      "See README.md 'Read before touching persistence or deploying'."
    );
  }

  // Deliberately NOT /tmp: that's OS-managed scratch space that gets treated
  // (by humans, agents, and the OS itself) as safe to wipe, which has
  // actually happened — see "Local Development" in README.md. Living inside
  // the repo (and gitignored via the `*.db` rule) makes clear this file
  // holds real accumulated local board data, not disposable temp state.
  const localDbDir = join(process.cwd(), ".local");
  mkdirSync(localDbDir, { recursive: true });
  const localDbPath = join(localDbDir, "cheers-dev.db");

  console.warn(
    `[db] No database configured — using a local SQLite file at ${localDbPath}. ` +
    "This is fine for local dev only (never in production), and persists across restarts " +
    "— see README.md before deleting it."
  );
  const client = createLibsqlClient({ url: `file:${localDbPath}` });
  return makeSqliteBackend(client);
}

let _backend: Backend | null = null;
let _initPromise: Promise<void> | null = null;

async function doInit(): Promise<void> {
  const backend = await createBackend();
  const schema = backend.kind === "pg" ? SCHEMA_PG : SCHEMA_SQLITE;
  const stmts = schema.split(";").map(s => s.trim()).filter(Boolean);
  for (const sql of stmts) {
    await backend.exec(sql);
  }
  await seed(backend);
  _backend = backend;
}

export async function ensureDb(): Promise<void> {
  if (!_initPromise) {
    _initPromise = doInit().catch(err => { _initPromise = null; throw err; });
  }
  return _initPromise;
}

// Reads retry once after a short delay (transient network blips) — a SELECT
// is always safe to repeat. Writes are never retried: if the first attempt's
// ack was lost but it actually committed on the server, blindly repeating it
// would silently double-execute (e.g. a second badge row with a new
// DB-generated id, since retrying an INSERT with no client-supplied primary
// key isn't caught by any constraint). A write that errors should surface
// the error rather than risk a silent duplicate.
async function execRead(sql: string, args: unknown[]) {
  await ensureDb();
  const backend = _backend!;
  try {
    return await backend.query(sql, args);
  } catch {
    await new Promise(r => setTimeout(r, 150));
    return await backend.query(sql, args);
  }
}

async function execWrite(sql: string, args: unknown[]) {
  await ensureDb();
  const backend = _backend!;
  return await backend.query(sql, args);
}

export async function dbGet<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T | null> {
  const rows = await execRead(sql, args);
  return (rows[0] as unknown as T) ?? null;
}

export async function dbAll<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> {
  const rows = await execRead(sql, args);
  return rows as unknown as T[];
}

export async function dbRun(sql: string, args: unknown[] = []): Promise<{ rowsAffected: number }> {
  const rows = await execWrite(sql, args);
  return { rowsAffected: rows.length };
}

// For an INSERT/UPDATE ... RETURNING whose caller needs the returned rows to
// tell whether the write applied (e.g. a conditional write guarded by a WHERE
// clause). Never retried — see execWrite.
export async function dbRunReturning<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> {
  const rows = await execWrite(sql, args);
  return rows as unknown as T[];
}
