import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(path.join(dataDir, "cheers.db"));
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      honoree_name TEXT NOT NULL,
      honoree_email TEXT,
      honoree_avatar_color TEXT DEFAULT '#6366f1',
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      milestone_date TEXT,
      values_tag TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      public_share_enabled INTEGER DEFAULT 1,
      share_token TEXT UNIQUE,
      requires_gift_approval INTEGER DEFAULT 1,
      gift_manager_email TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_by_name TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS board_posts (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT,
      author_avatar_color TEXT DEFAULT '#6366f1',
      message TEXT,
      gif_url TEXT,
      gif_title TEXT,
      photo_url TEXT,
      audio_url TEXT,
      reaction TEXT,
      is_manager_note INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS board_gifts (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      from_name TEXT NOT NULL,
      from_email TEXT NOT NULL,
      gift_type TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      workday_balance REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
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
  `);

  // Migrations
  if (!hasColumn(db, "boards", "created_by_name")) {
    db.exec(`ALTER TABLE boards ADD COLUMN created_by_name TEXT`);
  }

  // Auto-seed if empty
  const count = (db.prepare("SELECT COUNT(*) as c FROM boards").get() as { c: number }).c;
  if (count === 0) {
    seedDb(db);
  }
}

function seedDb(db: Database.Database) {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const insertBoard = db.prepare(`INSERT OR IGNORE INTO boards
    (id, honoree_name, honoree_email, honoree_avatar_color, type, title, description, values_tag,
     is_private, public_share_enabled, share_token, requires_gift_approval, gift_manager_email,
     status, created_by, created_by_name, expires_at)
    VALUES (@id, @honoree_name, @honoree_email, @honoree_avatar_color, @type, @title, @description,
     @values_tag, @is_private, @public_share_enabled, @share_token, @requires_gift_approval,
     @gift_manager_email, @status, @created_by, @created_by_name, @expires_at)`);

  insertBoard.run({ id: "board-alex-bday", honoree_name: "Alex Chen", honoree_email: "alex.chen@applied.co", honoree_avatar_color: "#6366f1", type: "birthday", title: "Happy Birthday, Alex! 🎂", description: "Alex has been an absolute rockstar this year.", values_tag: "Win Together", is_private: 0, public_share_enabled: 1, share_token: "share-alex-bday-2026", requires_gift_approval: 1, gift_manager_email: "jordan.smith@applied.co", status: "active", created_by: "jordan.smith@applied.co", created_by_name: "Jordan Smith", expires_at: expires });
  insertBoard.run({ id: "board-sam-promo", honoree_name: "Sam Lee", honoree_email: "sam.lee@applied.co", honoree_avatar_color: "#8b5cf6", type: "promotion", title: "Congrats on the promo, Sam! 🚀", description: "Sam crushed it this cycle — from IC3 to IC4.", values_tag: "Move with Urgency", is_private: 0, public_share_enabled: 1, share_token: "share-sam-promo-2026", requires_gift_approval: 0, gift_manager_email: null, status: "active", created_by: "yomi.ogbalaja@applied.co", created_by_name: "Yomi Ogbalaja", expires_at: expires });
  insertBoard.run({ id: "board-chris-welcome", honoree_name: "Chris Wong", honoree_email: "chris.wong@applied.co", honoree_avatar_color: "#10b981", type: "new_hire", title: "Welcome to Applied, Chris! 👋", description: "Chris joins us as ML Engineer on the Perception team!", values_tag: "Win Together", is_private: 0, public_share_enabled: 1, share_token: "share-chris-welcome-2026", requires_gift_approval: 1, gift_manager_email: "jordan.smith@applied.co", status: "active", created_by: "jordan.smith@applied.co", created_by_name: "Jordan Smith", expires_at: expires });

  const insertPost = db.prepare(`INSERT OR IGNORE INTO board_posts
    (id, board_id, author_name, author_email, author_avatar_color, message, gif_url, gif_title, reaction, is_manager_note)
    VALUES (@id, @board_id, @author_name, @author_email, @author_avatar_color, @message, @gif_url, @gif_title, @reaction, @is_manager_note)`);

  insertPost.run({ id: "post-1", board_id: "board-alex-bday", author_name: "Jordan Smith", author_email: "jordan.smith@applied.co", author_avatar_color: "#3b82f6", is_manager_note: 1, message: "Alex — you've been an incredible force on the team this past year. Your dedication, creativity, and genuine care for everyone around you make Applied a better place. Happy Birthday! 🎂", gif_url: null, gif_title: null, reaction: "🎉" });
  insertPost.run({ id: "post-2", board_id: "board-alex-bday", author_name: "Maya Patel", author_email: "maya.patel@applied.co", author_avatar_color: "#ec4899", is_manager_note: 0, message: "Happy birthday to my favourite backend genius! 🥳 Here's to another year of you making all our systems actually work 😂", gif_url: "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif", gif_title: "Birthday Confetti", reaction: null });
  insertPost.run({ id: "post-3", board_id: "board-alex-bday", author_name: "Sam Lee", author_email: "sam.lee@applied.co", author_avatar_color: "#8b5cf6", is_manager_note: 0, message: "Happy birthday Alex!! Can't believe it's already been a year since you joined. The team wouldn't be the same without you. 🫶", gif_url: null, gif_title: null, reaction: "❤️" });
  insertPost.run({ id: "post-4", board_id: "board-alex-bday", author_name: "Chris Wong", author_email: "chris.wong@applied.co", author_avatar_color: "#10b981", is_manager_note: 0, message: "Still the new guy here but already learned so much from you Alex — thank you and happy birthday! 🙏", gif_url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", gif_title: null, reaction: null });
  insertPost.run({ id: "post-5", board_id: "board-alex-bday", author_name: "Yomi Ogbalaja", author_email: "yomi.ogbalaja@applied.co", author_avatar_color: "#f59e0b", is_manager_note: 0, message: "Alex — the energy you bring to every room (virtual or not!) is infectious. Hope your day is as incredible as you are! Happy birthday! 🎂🎉", gif_url: null, gif_title: null, reaction: "🔥" });
  insertPost.run({ id: "post-6", board_id: "board-sam-promo", author_name: "Jordan Smith", author_email: "jordan.smith@applied.co", author_avatar_color: "#3b82f6", is_manager_note: 1, message: "Sam — this promotion has been long overdue. You consistently deliver above expectations, mentor the team without being asked, and make every project better. IC4 and beyond! 🚀", gif_url: null, gif_title: null, reaction: "🎉" });
  insertPost.run({ id: "post-7", board_id: "board-sam-promo", author_name: "Maya Patel", author_email: "maya.patel@applied.co", author_avatar_color: "#ec4899", is_manager_note: 0, message: "Sammmm!!! IC4!!! 🚀🚀🚀 You absolutely earned this. Let's celebrate properly soon!", gif_url: "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif", gif_title: null, reaction: null });
  insertPost.run({ id: "post-8", board_id: "board-sam-promo", author_name: "Alex Chen", author_email: "alex.chen@applied.co", author_avatar_color: "#6366f1", is_manager_note: 0, message: "Sam you've been such a great mentor to me. This is SO deserved. Congrats!! 🏆", gif_url: null, gif_title: null, reaction: "👏" });
  insertPost.run({ id: "post-9", board_id: "board-chris-welcome", author_name: "Jordan Smith", author_email: "jordan.smith@applied.co", author_avatar_color: "#3b82f6", is_manager_note: 1, message: "Chris — so glad to have you on the Perception team! You're joining a group of incredibly talented engineers who are excited to work with you. Welcome to Applied! 👋", gif_url: null, gif_title: null, reaction: null });
  insertPost.run({ id: "post-10", board_id: "board-chris-welcome", author_name: "Maya Patel", author_email: "maya.patel@applied.co", author_avatar_color: "#ec4899", is_manager_note: 0, message: "Welcome Chris! The design & ML teams are gonna do amazing things together — super excited! 🎨🤖", gif_url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXppYWR1NWc2cDJxMHN1bm50MXpvaHFqeDNoeXd6MXR2MXB2aXdxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XDAY1NNG2VvobAp9o1/giphy.gif", gif_title: null, reaction: null });

  const insertGift = db.prepare(`INSERT OR IGNORE INTO board_gifts
    (id, board_id, from_name, from_email, gift_type, amount, note, status, workday_balance)
    VALUES (@id, @board_id, @from_name, @from_email, @gift_type, @amount, @note, @status, @workday_balance)`);

  insertGift.run({ id: "gift-1", board_id: "board-alex-bday", from_name: "Jordan Smith", from_email: "jordan.smith@applied.co", gift_type: "time_off_hours", amount: 8, note: "Take a long weekend on us — you've earned it! Happy birthday 🎁", status: "pending", workday_balance: 120 });
  insertGift.run({ id: "gift-2", board_id: "board-alex-bday", from_name: "Maya Patel", from_email: "maya.patel@applied.co", gift_type: "time_off_hours", amount: 4, note: "A little extra rest for your birthday week! 💤", status: "approved", workday_balance: 88 });

  const insertBadge = db.prepare(`INSERT OR IGNORE INTO badges (person_email, person_name, badge_type, board_id, reason)
    VALUES (@person_email, @person_name, @badge_type, @board_id, @reason)`);

  insertBadge.run({ person_email: "alex.chen@applied.co", person_name: "Alex Chen", badge_type: "birthday_star", board_id: "board-alex-bday", reason: "Celebrated by 5 teammates on their birthday!" });
  insertBadge.run({ person_email: "jordan.smith@applied.co", person_name: "Jordan Smith", badge_type: "cheer_champion", board_id: "board-alex-bday", reason: "Kicked off 2 celebration boards for the team" });
  insertBadge.run({ person_email: "maya.patel@applied.co", person_name: "Maya Patel", badge_type: "generous_soul", board_id: "board-alex-bday", reason: "Gifted time off hours to a teammate" });
  insertBadge.run({ person_email: "sam.lee@applied.co", person_name: "Sam Lee", badge_type: "rising_star", board_id: "board-sam-promo", reason: "Earned a well-deserved promotion!" });
  insertBadge.run({ person_email: "yomi.ogbalaja@applied.co", person_name: "Yomi Ogbalaja", badge_type: "team_player", board_id: "board-alex-bday", reason: "Showed up for 3 teammates' milestones" });
}
