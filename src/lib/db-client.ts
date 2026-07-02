// Async database client backed by @libsql/client (SQLite-compatible).
// Uses Turso when TURSO_DATABASE_URL is set, otherwise a local /tmp file.
// /tmp is ephemeral per cold-start on Vercel — add TURSO_DATABASE_URL for persistence.
import { createClient, type InValue } from "@libsql/client";

let _client: ReturnType<typeof createClient> | null = null;
let _initPromise: Promise<void> | null = null;

function getClient() {
  if (_client) return _client;
  _client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:/tmp/cheers.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return _client;
}

const SCHEMA = `
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
CREATE INDEX IF NOT EXISTS idx_posts_board ON board_posts(board_id);
CREATE INDEX IF NOT EXISTS idx_boards_token ON boards(share_token);
CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status);
CREATE INDEX IF NOT EXISTS idx_badges_board ON badges(board_id);
CREATE INDEX IF NOT EXISTS idx_badges_email ON badges(person_email);
`;

const EXPIRES_AT = "2026-08-25";

async function seed(client: ReturnType<typeof createClient>) {
  const { rows } = await client.execute("SELECT COUNT(*) as c FROM boards");
  if ((rows[0] as Record<string, unknown>).c !== 0) return;
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
    await client.execute({
      sql: `INSERT OR IGNORE INTO boards
        (id,honoree_name,honoree_email,honoree_avatar_color,type,title,description,values_tag,
         is_private,public_share_enabled,share_token,requires_gift_approval,gift_manager_email,
         status,created_by,created_by_name,expires_at,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: b as InValue[],
    });
  }

  const posts: InValue[][] = [
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
    await client.execute({
      sql: `INSERT OR IGNORE INTO board_posts
        (id,board_id,author_name,author_email,author_avatar_color,is_manager_note,
         message,gif_url,gif_title,photo_url,reaction,reactions_json,values_tag,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: p,
    });
  }

  const gifts: InValue[][] = [
    ["gift-1","board-alex-bday","Jordan Smith","jordan.smith@applied.co","time_off_hours",8,
      "Take a long weekend on us — you've earned it!","pending",null,120,n],
    ["gift-2","board-alex-bday","Maya Patel","maya.patel@applied.co","time_off_hours",4,
      "A little extra rest for your birthday week!","approved",null,88,n],
  ];
  for (const g of gifts) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO board_gifts
        (id,board_id,from_name,from_email,gift_type,amount,note,status,approved_by,workday_balance,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      args: g,
    });
  }

  const bgs: InValue[][] = [
    ["alex.chen@applied.co","Alex Chen","birthday_star","board-alex-bday","Celebrated by 5 teammates!",n],
    ["jordan.smith@applied.co","Jordan Smith","cheer_champion","board-alex-bday","Kicked off 2 boards",n],
    ["maya.patel@applied.co","Maya Patel","generous_soul","board-alex-bday","Gifted time off hours",n],
    ["sam.lee@applied.co","Sam Lee","rising_star","board-sam-promo","Earned a well-deserved promotion!",n],
    ["yomi.ogbalaja@applied.co","Yomi Ogbalaja","team_player","board-alex-bday","Showed up for 3 teammates",n],
  ];
  for (const b of bgs) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO badges (person_email,person_name,badge_type,board_id,reason,awarded_at)
        VALUES (?,?,?,?,?,?)`,
      args: b,
    });
  }
}

async function doInit(): Promise<void> {
  const client = getClient();
  // Run schema one statement at a time (libsql doesn't support multi-statement in one execute)
  const stmts = SCHEMA.split(";").map(s => s.trim()).filter(Boolean);
  for (const sql of stmts) {
    await client.execute(sql);
  }
  await seed(client);
}

export async function ensureDb(): Promise<void> {
  if (!_initPromise) {
    _initPromise = doInit().catch(err => { _initPromise = null; throw err; });
  }
  return _initPromise;
}

// Execute with one retry after a short delay (transient Turso network blips).
async function exec(sql: string, args: InValue[]) {
  const client = getClient();
  try {
    return await client.execute({ sql, args });
  } catch {
    await new Promise(r => setTimeout(r, 150));
    return await client.execute({ sql, args });
  }
}

export async function dbGet<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T | null> {
  await ensureDb();
  const result = await exec(sql, args);
  return (result.rows[0] as unknown as T) ?? null;
}

export async function dbAll<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ensureDb();
  const result = await exec(sql, args);
  return result.rows as unknown as T[];
}

export async function dbRun(sql: string, args: InValue[] = []): Promise<{ rowsAffected: number; lastInsertRowid?: bigint | number }> {
  await ensureDb();
  const result = await exec(sql, args);
  return { rowsAffected: result.rowsAffected, lastInsertRowid: result.lastInsertRowid };
}
