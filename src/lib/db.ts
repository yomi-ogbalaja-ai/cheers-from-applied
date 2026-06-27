// src/lib/db.ts — SQLite persistence via better-sqlite3
// Writes to DATA_DIR/cheers.db when DATA_DIR env var is set (Fly.io /data volume),
// falls back to in-memory :memory: for local dev without a data dir.
import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";

let _db: Database.Database | null = null;

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
    created_at TEXT,
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
    is_manager_note INTEGER DEFAULT 0,
    values_tag TEXT,
    created_at TEXT
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
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_email TEXT NOT NULL,
    person_name TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    board_id TEXT,
    reason TEXT,
    awarded_at TEXT
  );
`;

const EXPIRES_AT = "2026-08-25";

function seed(db: Database.Database) {
  const { c } = db.prepare("SELECT COUNT(*) as c FROM boards").get() as { c: number };
  if (c > 0) return;

  const n = new Date().toISOString().replace("T", " ").slice(0, 19);

  const ib = db.prepare(`INSERT INTO boards
    (id, honoree_name, honoree_email, honoree_avatar_color, type, title, description, values_tag,
     is_private, public_share_enabled, share_token, requires_gift_approval, gift_manager_email,
     status, created_by, created_by_name, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  ib.run("board-alex-bday", "Alex Chen", "alex.chen@applied.co", "#6366f1", "birthday",
    "Happy Birthday, Alex! 🎂", "Alex has been an absolute rockstar this year.", "Win Together",
    0, 1, "share-alex-bday-2026", 1, "jordan.smith@applied.co", "active",
    "jordan.smith@applied.co", "Jordan Smith", EXPIRES_AT, n);
  ib.run("board-sam-promo", "Sam Lee", "sam.lee@applied.co", "#8b5cf6", "promotion",
    "Congrats on the promo, Sam! 🚀", "Sam crushed it this cycle — from IC3 to IC4.", "Move with Urgency",
    0, 1, "share-sam-promo-2026", 0, null, "active",
    "yomi.ogbalaja@applied.co", "Yomi Ogbalaja", EXPIRES_AT, n);
  ib.run("board-chris-welcome", "Chris Wong", "chris.wong@applied.co", "#10b981", "new_hire",
    "Welcome to Applied, Chris! 👋", "Chris joins us as ML Engineer on the Perception team!", "Win Together",
    0, 1, "share-chris-welcome-2026", 1, "jordan.smith@applied.co", "active",
    "jordan.smith@applied.co", "Jordan Smith", EXPIRES_AT, n);

  const ip = db.prepare(`INSERT INTO board_posts
    (id, board_id, author_name, author_email, author_avatar_color, is_manager_note,
     message, gif_url, gif_title, reaction, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  ip.run("post-1", "board-alex-bday", "Jordan Smith", "jordan.smith@applied.co", "#3b82f6", 1,
    "Alex — you've been an incredible force on the team this past year. Your dedication, creativity, and genuine care for everyone around you make Applied a better place. Happy Birthday! 🎂",
    null, null, "🎉", n);
  ip.run("post-2", "board-alex-bday", "Maya Patel", "maya.patel@applied.co", "#ec4899", 0,
    "Happy birthday to my favourite backend genius! 🥳 Here's to another year of you making all our systems actually work 😂",
    "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif", "Birthday Confetti", null, n);
  ip.run("post-3", "board-alex-bday", "Sam Lee", "sam.lee@applied.co", "#8b5cf6", 0,
    "Happy birthday Alex!! Can't believe it's already been a year since you joined. The team wouldn't be the same without you. 🫶",
    null, null, "❤️", n);
  ip.run("post-4", "board-alex-bday", "Chris Wong", "chris.wong@applied.co", "#10b981", 0,
    "Still the new guy here but already learned so much from you Alex — thank you and happy birthday! 🙏",
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", null, null, n);
  ip.run("post-5", "board-alex-bday", "Yomi Ogbalaja", "yomi.ogbalaja@applied.co", "#f59e0b", 0,
    "Alex — the energy you bring to every room (virtual or not!) is infectious. Hope your day is as incredible as you are! Happy birthday! 🎂🎉",
    null, null, "🔥", n);
  ip.run("post-6", "board-sam-promo", "Jordan Smith", "jordan.smith@applied.co", "#3b82f6", 1,
    "Sam — this promotion has been long overdue. You consistently deliver above expectations, mentor the team without being asked, and make every project better. IC4 and beyond! 🚀",
    null, null, "🎉", n);
  ip.run("post-7", "board-sam-promo", "Maya Patel", "maya.patel@applied.co", "#ec4899", 0,
    "Sammmm!!! IC4!!! 🚀🚀🚀 You absolutely earned this. Let's celebrate properly soon!",
    "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif", null, null, n);
  ip.run("post-8", "board-sam-promo", "Alex Chen", "alex.chen@applied.co", "#6366f1", 0,
    "Sam you've been such a great mentor to me. This is SO deserved. Congrats!! 🏆",
    null, null, "👏", n);
  ip.run("post-9", "board-chris-welcome", "Jordan Smith", "jordan.smith@applied.co", "#3b82f6", 1,
    "Chris — so glad to have you on the Perception team! You're joining a group of incredibly talented engineers who are excited to work with you. Welcome to Applied! 👋",
    null, null, null, n);
  ip.run("post-10", "board-chris-welcome", "Maya Patel", "maya.patel@applied.co", "#ec4899", 0,
    "Welcome Chris! The design & ML teams are gonna do amazing things together — super excited! 🎨🤖",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXppYWR1NWc2cDJxMHN1bm50MXpvaHFqeDNoeXd6MXR2MXB2aXdxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XDAY1NNG2VvobAp9o1/giphy.gif", null, null, n);

  const ig = db.prepare(`INSERT INTO board_gifts
    (id, board_id, from_name, from_email, gift_type, amount, note, status, workday_balance, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  ig.run("gift-1", "board-alex-bday", "Jordan Smith", "jordan.smith@applied.co",
    "time_off_hours", 8, "Take a long weekend on us — you've earned it! Happy birthday 🎁",
    "pending", 120, n);
  ig.run("gift-2", "board-alex-bday", "Maya Patel", "maya.patel@applied.co",
    "time_off_hours", 4, "A little extra rest for your birthday week! 💤",
    "approved", 88, n);

  const ibg = db.prepare(`INSERT INTO badges
    (person_email, person_name, badge_type, board_id, reason, awarded_at)
    VALUES (?, ?, ?, ?, ?, ?)`);

  ibg.run("alex.chen@applied.co", "Alex Chen", "birthday_star", "board-alex-bday",
    "Celebrated by 5 teammates on their birthday!", n);
  ibg.run("jordan.smith@applied.co", "Jordan Smith", "cheer_champion", "board-alex-bday",
    "Kicked off 2 celebration boards for the team", n);
  ibg.run("maya.patel@applied.co", "Maya Patel", "generous_soul", "board-alex-bday",
    "Gifted time off hours to a teammate", n);
  ibg.run("sam.lee@applied.co", "Sam Lee", "rising_star", "board-sam-promo",
    "Earned a well-deserved promotion!", n);
  ibg.run("yomi.ogbalaja@applied.co", "Yomi Ogbalaja", "team_player", "board-alex-bday",
    "Showed up for 3 teammates milestones", n);
}

export function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = process.env.DATA_DIR ?? "";
  let dbPath = ":memory:";

  if (dataDir) {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    dbPath = path.join(dataDir, "cheers.db");
  }

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.exec(SCHEMA);
  seed(_db);
  return _db;
}
