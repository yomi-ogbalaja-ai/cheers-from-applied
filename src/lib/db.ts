// src/lib/db.ts — in-memory store (Vercel-compatible, no native bindings)

type Row = Record<string, unknown>;

const tables: Record<string, Row[]> = {
  boards: [],
  board_posts: [],
  board_gifts: [],
  badges: [],
};

let badgeAutoId = 1;

function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

/** Trim SQL to a single line for pattern matching */
function normSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

/** Extract table name from a FROM/INTO/UPDATE clause */
function extractTable(sql: string): string {
  const m =
    sql.match(/FROM\s+(\w+)/i) ||
    sql.match(/INTO\s+(\w+)/i) ||
    sql.match(/UPDATE\s+(\w+)/i);
  return m ? m[1] : "";
}

/** Parse column list from INSERT: INSERT [OR IGNORE] INTO tbl (col1, col2, ...) */
function extractInsertCols(sql: string): string[] {
  const m = sql.match(/\(\s*([^)]+)\)\s*VALUES/i);
  if (!m) return [];
  return m[1].split(",").map((c) => c.trim());
}

/**
 * Zip positional VALUES params with column names.
 * Handles both named (@col) and positional (?) placeholders.
 */
function buildRowFromPositional(cols: string[], args: unknown[]): Row {
  const row: Row = {};
  cols.forEach((col, i) => {
    row[col] = args[i] !== undefined ? args[i] : null;
  });
  return row;
}

/**
 * Extract named params from an object passed to .run({ @key: val, ... })
 * The SQLite named syntax uses @key or :key in the SQL; the object keys
 * are the bare names (no @ prefix).
 */
function buildRowFromNamed(cols: string[], params: Row): Row {
  const row: Row = {};
  for (const col of cols) {
    row[col] = col in params ? params[col] : null;
  }
  return row;
}

/** Apply simple WHERE clauses to filter a table array */
function applyWhere(rows: Row[], sql: string, args: unknown[]): Row[] {
  const ns = normSql(sql);
  let argIdx = 0;

  // WHERE x = ? filters (chained with AND)
  const whereMatch = ns.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
  if (!whereMatch) return rows;

  const whereClause = whereMatch[1].trim();

  // Split on AND to get individual conditions
  const conditions = whereClause.split(/\s+AND\s+/i);

  return rows.filter((row) => {
    let argsUsed = argIdx;
    let match = true;
    for (const cond of conditions) {
      const eqMatch = cond.match(/(\w+)\s*=\s*\?/);
      const eqVal = cond.match(/(\w+)\s*=\s*'([^']*)'/);
      const eqInt = cond.match(/(\w+)\s*=\s*(\d+)/);

      if (eqMatch) {
        const col = eqMatch[1];
        const val = args[argsUsed++];
        if (row[col] !== val) match = false;
      } else if (eqVal) {
        const col = eqVal[1];
        const val = eqVal[2];
        if (row[col] !== val) match = false;
      } else if (eqInt) {
        const col = eqInt[1];
        const val = Number(eqInt[2]);
        if (row[col] !== val) match = false;
      }
    }
    return match;
  });
}

/** Apply ORDER BY (single col, ASC/DESC) */
function applyOrder(rows: Row[], sql: string): Row[] {
  const m = normSql(sql).match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (!m) return rows;
  const col = m[1];
  const dir = (m[2] || "ASC").toUpperCase();
  return [...rows].sort((a, b) => {
    const av = String(a[col] ?? "");
    const bv = String(b[col] ?? "");
    return dir === "ASC" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

/** Boards SELECT with sub-selects for post_count, gift_count, approved_hours */
function selectBoards(sql: string, args: unknown[]): Row[] {
  const ns = normSql(sql);
  let rows = [...tables.boards];

  // Filter by status if WHERE present without ?
  if (/WHERE\s+b\.status\s*=\s*'active'/i.test(ns)) {
    rows = rows.filter((r) => r.status === "active");
  }

  if (/WHERE\s+b\.id\s*=\s*\?/i.test(ns) || /WHERE\s+id\s*=\s*\?/i.test(ns)) {
    rows = rows.filter((r) => r.id === args[0]);
  }

  if (/share_token\s*=\s*\?/i.test(ns)) {
    rows = rows.filter((r) => r.share_token === args[0]);
    if (/public_share_enabled\s*=\s*1/i.test(ns)) {
      rows = rows.filter((r) => r.public_share_enabled === 1);
    }
    if (/status\s*=\s*'active'/i.test(ns)) {
      rows = rows.filter((r) => r.status === "active");
    }
  }

  // If the query includes post_count etc., enrich each row
  if (/post_count/i.test(ns)) {
    rows = rows.map((b) => ({
      ...b,
      post_count: tables.board_posts.filter((p) => p.board_id === b.id).length,
      gift_count: tables.board_gifts.filter((g) => g.board_id === b.id).length,
      approved_hours: tables.board_gifts
        .filter((g) => g.board_id === b.id && g.status === "approved")
        .reduce((sum, g) => sum + (Number(g.amount) || 0), 0),
    }));
  }

  // ORDER BY b.created_at DESC
  if (/ORDER\s+BY\s+b\.created_at\s+DESC/i.test(ns)) {
    rows = [...rows].sort((a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
    );
  }

  return rows;
}

/** Gifts aggregate SELECT with COALESCE SUM */
function selectGiftsAgg(sql: string, args: unknown[]): Row {
  const boardId = args[0];
  const gifts = tables.board_gifts.filter((g) => g.board_id === boardId);
  const pendingHrs = gifts
    .filter((g) => g.status === "pending")
    .reduce((s, g) => s + (Number(g.amount) || 0), 0);
  const approvedHrs = gifts
    .filter((g) => g.status === "approved")
    .reduce((s, g) => s + (Number(g.amount) || 0), 0);
  return { total_pending_hrs: pendingHrs, total_approved_hrs: approvedHrs };
}

/** SUM of amount for a giver on a board */
function selectGiftTotal(sql: string, args: unknown[]): Row {
  const boardId = args[0];
  const email = args[1];
  const total = tables.board_gifts
    .filter((g) => g.board_id === boardId && g.from_email === email)
    .reduce((s, g) => s + (Number(g.amount) || 0), 0);
  return { total };
}

function handleSelect(sql: string, args: unknown[]): Row[] | Row | null {
  const ns = normSql(sql);

  // PRAGMA table_info
  if (/PRAGMA\s+table_info/i.test(ns)) return [];

  // COUNT(*) on boards
  if (/SELECT\s+COUNT\(\*\)\s+as\s+c\s+FROM\s+boards/i.test(ns)) {
    return { c: tables.boards.length } as unknown as Row;
  }

  // Boards queries — check FIRST because they contain subqueries that would
  // otherwise match the COALESCE patterns below
  if (/FROM\s+boards\b/i.test(ns)) {
    return selectBoards(sql, args);
  }

  // Gifts aggregate with COALESCE SUM CASE (simple query, no subqueries)
  if (/SELECT\s+COALESCE\(SUM\(CASE/i.test(ns) && /FROM\s+board_gifts/i.test(ns)) {
    return selectGiftsAgg(sql, args) as unknown as Row;
  }

  // Gift total for giver: SELECT COALESCE(SUM(amount), 0) as total FROM board_gifts WHERE ...
  if (/SELECT\s+COALESCE\(SUM\(amount\)/i.test(ns) && /FROM\s+board_gifts/i.test(ns)) {
    return selectGiftTotal(sql, args) as unknown as Row;
  }

  // Generic table select
  const table = extractTable(sql);
  if (!tables[table]) return [];
  let rows = [...tables[table]];
  rows = applyWhere(rows, sql, args);
  rows = applyOrder(rows, sql);
  return rows;
}

function handleInsert(sql: string, args: unknown[]): void {
  const ns = normSql(sql);
  const table = extractTable(sql);
  if (!tables[table]) return;

  const cols = extractInsertCols(sql);

  let row: Row;
  // Named params: args[0] is a plain object with bare key names
  if (
    args.length === 1 &&
    typeof args[0] === "object" &&
    args[0] !== null &&
    !Array.isArray(args[0])
  ) {
    row = buildRowFromNamed(cols, args[0] as Row);
  } else {
    row = buildRowFromPositional(cols, args);
  }

  // Add defaults
  if (!row.created_at) row.created_at = nowIso();
  if (table === "badges" && !row.id) {
    row.id = badgeAutoId++;
  }
  if (table === "badges" && !row.awarded_at) {
    row.awarded_at = nowIso();
  }

  // INSERT OR IGNORE — skip if primary key already exists
  if (/INSERT\s+OR\s+IGNORE/i.test(ns)) {
    const pkField = table === "badges" ? "id" : "id";
    if (row.id !== undefined && row.id !== null) {
      const exists = tables[table].some((r) => r.id === row.id);
      if (exists) return;
    }
  }

  tables[table].push(row);
}

function handleUpdate(sql: string, args: unknown[]): void {
  const ns = normSql(sql);
  const table = extractTable(sql);
  if (!tables[table]) return;

  // UPDATE board_gifts SET status = ?, approved_by = ? WHERE id = ? AND board_id = ?
  if (/UPDATE\s+board_gifts\s+SET\s+status\s*=\s*\?,\s*approved_by\s*=\s*\?/i.test(ns)) {
    const [status, approved_by, id, board_id] = args;
    tables.board_gifts.forEach((g) => {
      if (g.id === id && g.board_id === board_id) {
        g.status = status;
        g.approved_by = approved_by;
      }
    });
    return;
  }

  // Generic UPDATE: SET col = ? WHERE id = ?
  const setMatch = ns.match(/SET\s+(.+?)\s+WHERE/i);
  const whereMatch = ns.match(/WHERE\s+id\s*=\s*\?/i);
  if (setMatch && whereMatch) {
    const setPairs = setMatch[1].split(",").map((s) => s.trim());
    const setCols = setPairs.map((p) => p.split(/\s*=\s*\?/)[0].trim());
    const id = args[setCols.length];
    tables[table].forEach((row) => {
      if (row.id === id) {
        setCols.forEach((col, i) => {
          row[col] = args[i];
        });
      }
    });
  }
}

function prepare(sql: string) {
  return {
    run(...args: unknown[]): void {
      const ns = normSql(sql);
      if (/^\s*INSERT/i.test(ns)) {
        handleInsert(sql, args);
      } else if (/^\s*UPDATE/i.test(ns)) {
        handleUpdate(sql, args);
      }
      // DELETE / other statements: no-op for now
    },

    get(...args: unknown[]): Row | undefined | null {
      const result = handleSelect(sql, args);
      if (Array.isArray(result)) return result[0] ?? null;
      return result as Row | null;
    },

    all(...args: unknown[]): Row[] {
      const result = handleSelect(sql, args);
      if (Array.isArray(result)) return result;
      return result ? [result as Row] : [];
    },
  };
}

const EXPIRES_AT = "2026-08-25"; // 30 days from 2026-07-26

function seedData() {
  const insertBoard = (row: Row) => {
    if (!row.created_at) row.created_at = nowIso();
    tables.boards.push(row);
  };

  insertBoard({ id: "board-alex-bday", honoree_name: "Alex Chen", honoree_email: "alex.chen@applied.co", honoree_avatar_color: "#6366f1", type: "birthday", title: "Happy Birthday, Alex! 🎂", description: "Alex has been an absolute rockstar this year.", values_tag: "Win Together", is_private: 0, public_share_enabled: 1, share_token: "share-alex-bday-2026", requires_gift_approval: 1, gift_manager_email: "jordan.smith@applied.co", status: "active", created_by: "jordan.smith@applied.co", created_by_name: "Jordan Smith", expires_at: EXPIRES_AT });
  insertBoard({ id: "board-sam-promo", honoree_name: "Sam Lee", honoree_email: "sam.lee@applied.co", honoree_avatar_color: "#8b5cf6", type: "promotion", title: "Congrats on the promo, Sam! 🚀", description: "Sam crushed it this cycle — from IC3 to IC4.", values_tag: "Move with Urgency", is_private: 0, public_share_enabled: 1, share_token: "share-sam-promo-2026", requires_gift_approval: 0, gift_manager_email: null, status: "active", created_by: "yomi.ogbalaja@applied.co", created_by_name: "Yomi Ogbalaja", expires_at: EXPIRES_AT });
  insertBoard({ id: "board-chris-welcome", honoree_name: "Chris Wong", honoree_email: "chris.wong@applied.co", honoree_avatar_color: "#10b981", type: "new_hire", title: "Welcome to Applied, Chris! 👋", description: "Chris joins us as ML Engineer on the Perception team!", values_tag: "Win Together", is_private: 0, public_share_enabled: 1, share_token: "share-chris-welcome-2026", requires_gift_approval: 1, gift_manager_email: "jordan.smith@applied.co", status: "active", created_by: "jordan.smith@applied.co", created_by_name: "Jordan Smith", expires_at: EXPIRES_AT });

  const insertPost = (row: Row) => {
    if (!row.created_at) row.created_at = nowIso();
    tables.board_posts.push(row);
  };

  insertPost({ id: "post-1", board_id: "board-alex-bday", author_name: "Jordan Smith", author_email: "jordan.smith@applied.co", author_avatar_color: "#3b82f6", is_manager_note: 1, message: "Alex — you've been an incredible force on the team this past year. Your dedication, creativity, and genuine care for everyone around you make Applied a better place. Happy Birthday! 🎂", gif_url: null, gif_title: null, reaction: "🎉" });
  insertPost({ id: "post-2", board_id: "board-alex-bday", author_name: "Maya Patel", author_email: "maya.patel@applied.co", author_avatar_color: "#ec4899", is_manager_note: 0, message: "Happy birthday to my favourite backend genius! 🥳 Here's to another year of you making all our systems actually work 😂", gif_url: "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif", gif_title: "Birthday Confetti", reaction: null });
  insertPost({ id: "post-3", board_id: "board-alex-bday", author_name: "Sam Lee", author_email: "sam.lee@applied.co", author_avatar_color: "#8b5cf6", is_manager_note: 0, message: "Happy birthday Alex!! Can't believe it's already been a year since you joined. The team wouldn't be the same without you. 🫶", gif_url: null, gif_title: null, reaction: "❤️" });
  insertPost({ id: "post-4", board_id: "board-alex-bday", author_name: "Chris Wong", author_email: "chris.wong@applied.co", author_avatar_color: "#10b981", is_manager_note: 0, message: "Still the new guy here but already learned so much from you Alex — thank you and happy birthday! 🙏", gif_url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", gif_title: null, reaction: null });
  insertPost({ id: "post-5", board_id: "board-alex-bday", author_name: "Yomi Ogbalaja", author_email: "yomi.ogbalaja@applied.co", author_avatar_color: "#f59e0b", is_manager_note: 0, message: "Alex — the energy you bring to every room (virtual or not!) is infectious. Hope your day is as incredible as you are! Happy birthday! 🎂🎉", gif_url: null, gif_title: null, reaction: "🔥" });
  insertPost({ id: "post-6", board_id: "board-sam-promo", author_name: "Jordan Smith", author_email: "jordan.smith@applied.co", author_avatar_color: "#3b82f6", is_manager_note: 1, message: "Sam — this promotion has been long overdue. You consistently deliver above expectations, mentor the team without being asked, and make every project better. IC4 and beyond! 🚀", gif_url: null, gif_title: null, reaction: "🎉" });
  insertPost({ id: "post-7", board_id: "board-sam-promo", author_name: "Maya Patel", author_email: "maya.patel@applied.co", author_avatar_color: "#ec4899", is_manager_note: 0, message: "Sammmm!!! IC4!!! 🚀🚀🚀 You absolutely earned this. Let's celebrate properly soon!", gif_url: "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif", gif_title: null, reaction: null });
  insertPost({ id: "post-8", board_id: "board-sam-promo", author_name: "Alex Chen", author_email: "alex.chen@applied.co", author_avatar_color: "#6366f1", is_manager_note: 0, message: "Sam you've been such a great mentor to me. This is SO deserved. Congrats!! 🏆", gif_url: null, gif_title: null, reaction: "👏" });
  insertPost({ id: "post-9", board_id: "board-chris-welcome", author_name: "Jordan Smith", author_email: "jordan.smith@applied.co", author_avatar_color: "#3b82f6", is_manager_note: 1, message: "Chris — so glad to have you on the Perception team! You're joining a group of incredibly talented engineers who are excited to work with you. Welcome to Applied! 👋", gif_url: null, gif_title: null, reaction: null });
  insertPost({ id: "post-10", board_id: "board-chris-welcome", author_name: "Maya Patel", author_email: "maya.patel@applied.co", author_avatar_color: "#ec4899", is_manager_note: 0, message: "Welcome Chris! The design & ML teams are gonna do amazing things together — super excited! 🎨🤖", gif_url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXppYWR1NWc2cDJxMHN1bm50MXpvaHFqeDNoeXd6MXR2MXB2aXdxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XDAY1NNG2VvobAp9o1/giphy.gif", gif_title: null, reaction: null });

  const insertGift = (row: Row) => {
    if (!row.created_at) row.created_at = nowIso();
    tables.board_gifts.push(row);
  };

  insertGift({ id: "gift-1", board_id: "board-alex-bday", from_name: "Jordan Smith", from_email: "jordan.smith@applied.co", gift_type: "time_off_hours", amount: 8, note: "Take a long weekend on us — you've earned it! Happy birthday 🎁", status: "pending", workday_balance: 120 });
  insertGift({ id: "gift-2", board_id: "board-alex-bday", from_name: "Maya Patel", from_email: "maya.patel@applied.co", gift_type: "time_off_hours", amount: 4, note: "A little extra rest for your birthday week! 💤", status: "approved", workday_balance: 88 });

  const insertBadge = (row: Omit<Row, "id" | "awarded_at">) => {
    tables.badges.push({ ...row, id: badgeAutoId++, awarded_at: nowIso() });
  };

  insertBadge({ person_email: "alex.chen@applied.co", person_name: "Alex Chen", badge_type: "birthday_star", board_id: "board-alex-bday", reason: "Celebrated by 5 teammates on their birthday!" });
  insertBadge({ person_email: "jordan.smith@applied.co", person_name: "Jordan Smith", badge_type: "cheer_champion", board_id: "board-alex-bday", reason: "Kicked off 2 celebration boards for the team" });
  insertBadge({ person_email: "maya.patel@applied.co", person_name: "Maya Patel", badge_type: "generous_soul", board_id: "board-alex-bday", reason: "Gifted time off hours to a teammate" });
  insertBadge({ person_email: "sam.lee@applied.co", person_name: "Sam Lee", badge_type: "rising_star", board_id: "board-sam-promo", reason: "Earned a well-deserved promotion!" });
  insertBadge({ person_email: "yomi.ogbalaja@applied.co", person_name: "Yomi Ogbalaja", badge_type: "team_player", board_id: "board-alex-bday", reason: "Showed up for 3 teammates' milestones" });
}

let seeded = false;

export function getDb() {
  if (!seeded) {
    seedData();
    seeded = true;
  }
  return {
    prepare,
    exec(_sql: string) {},
    pragma(_s: string) {},
  };
}
