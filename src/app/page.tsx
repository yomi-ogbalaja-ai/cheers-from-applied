"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

const BADGE_META: Record<string, { icon: string }> = {
  cheer_champion: { icon: "🏆" }, generous_soul: { icon: "💝" },
  birthday_star: { icon: "⭐" }, rising_star: { icon: "🚀" },
  team_player: { icon: "🤝" }, heartwarmer: { icon: "❤️" }, welcome_wagon: { icon: "👋" },
};

// Light value references shown on board cards
const VALUE_LABEL: Record<string, string> = {
  "Win Together":      "Win Together",
  "Be Bold":           "Be Bold",
  "Move with Urgency": "Move with Urgency",
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface Board {
  id: string; honoree_name: string; honoree_avatar_color: string;
  type: string; title: string; description: string; values_tag: string; expires_at: string;
  post_count: number; approved_hours: number;
}

interface BadgeGroup {
  person_name: string; person_email: string;
  badges: Array<{ id: number; badge_type: string; reason: string; awarded_at: string }>;
}

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [badgeGroups, setBadgeGroups] = useState<BadgeGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/boards").then(r => r.json()),
      fetch("/api/badges").then(r => r.json()),
    ]).then(([b, bg]) => { setBoards(b); setBadgeGroups(bg); setLoading(false); });
  }, []);

  const recentBadges = badgeGroups
    .flatMap(g => g.badges.map(b => ({ ...b, person_name: g.person_name })))
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
    .slice(0, 8);

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Hero — clean, white, typographic */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>
              Applied Intuition
            </p>
            <h1 className="text-4xl font-bold tracking-tight leading-none mb-2" style={{ color: "var(--text)" }}>
              Cheers from Applied
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Celebrate your team's milestones, big and small
            </p>
          </div>
          <Link href="/board/new"
            className="flex-shrink-0 text-sm font-medium px-4 py-2 rounded-md text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            New Board
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Section label */}
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
            Active Boards
          </h2>
          {!loading && boards.length > 0 && (
            <span className="text-xs" style={{ color: "var(--muted)" }}>{boards.length} open</span>
          )}
        </div>

        {/* Board grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg animate-pulse h-24" style={{ background: "var(--border-light)" }} />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>No boards yet</p>
            <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Start celebrating your team's milestones</p>
            <Link href="/board/new"
              className="inline-block px-4 py-2 rounded-md text-white text-sm font-medium"
              style={{ background: "var(--accent)" }}>
              Create first board
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {boards.map(board => {
              const dl = daysLeft(board.expires_at);
              return (
                <Link key={board.id} href={`/board/${board.id}`}
                  className="block bg-white rounded-lg p-4 transition-shadow"
                  style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(21,88,214,0.10)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)")}>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ background: board.honoree_avatar_color }}>
                      {initials(board.honoree_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate leading-tight" style={{ color: "var(--text)" }}>
                        {board.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {TYPE_EMOJI[board.type] ?? "🎉"} {board.honoree_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      {VALUE_LABEL[board.values_tag] ?? board.values_tag}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {board.post_count} cheer{board.post_count !== 1 ? "s" : ""}
                    </span>
                    {board.approved_hours > 0 && (
                      <span className="text-xs" style={{ color: "#16A34A" }}>{board.approved_hours}h gifted</span>
                    )}
                    {dl !== null && dl <= 5 && (
                      <span className="text-xs ml-auto" style={{ color: dl <= 2 ? "#DC2626" : "var(--muted)" }}>
                        {dl}d left
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="mt-12">
            <div style={{ borderTop: "1px solid var(--border)" }} className="mb-6" />
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                Recent Badges
              </h2>
              <Link href="/badges" className="text-xs" style={{ color: "var(--accent)" }}>See all →</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentBadges.map(b => {
                const meta = BADGE_META[b.badge_type] ?? { icon: "🏅" };
                return (
                  <div key={b.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-white"
                    style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
                    <span>{meta.icon}</span>
                    <span className="font-medium">{b.person_name}</span>
                    <span style={{ color: "var(--muted)" }}>{b.badge_type.replace(/_/g, " ")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
