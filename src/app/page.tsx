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

function fmtMilestoneDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

interface MilestoneItem {
  board_id: string; honoree_name: string; type: string;
  milestone_date: string; days_until: number; title: string;
}

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [badgeGroups, setBadgeGroups] = useState<BadgeGroup[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/boards").then(r => r.json()).catch(() => []),
      fetch("/api/badges").then(r => r.json()).catch(() => []),
      fetch("/api/calendar").then(r => r.json()).catch(() => ({ upcoming: [] })),
    ]).then(([b, bg, cal]) => {
      setBoards(Array.isArray(b) ? b : []);
      setBadgeGroups(Array.isArray(bg) ? bg : []);
      setMilestones(Array.isArray(cal?.upcoming) ? cal.upcoming : []);
      setLoading(false);
    });
  }, []);

  const recentBadges = badgeGroups
    .flatMap(g => g.badges.map(b => ({ ...b, person_name: g.person_name })))
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
    .slice(0, 8);

  const totalCheers = boards.reduce((s, b) => s + (b.post_count || 0), 0);
  const totalBadges = badgeGroups.reduce((s, g) => s + g.badges.length, 0);

  const stats = [
    { label: "Active Boards", value: boards.length },
    { label: "Total Cheers", value: totalCheers },
    { label: "Badges Awarded", value: totalBadges },
  ];

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
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
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              One place for birthdays, promotions, anniversaries and every win in between
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 pb-1 select-none" aria-hidden="true" style={{ opacity: 0.35 }}>
            <span className="text-3xl">🎂</span>
            <span className="text-3xl">🥂</span>
            <span className="text-3xl">🚀</span>
            <span className="text-3xl">🌟</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-8 flex items-stretch" style={{ borderTop: "1px solid var(--border)" }}>
          {loading
            ? stats.map((s, i) => (
                <div key={s.label} className="flex-1 py-4 pr-6"
                  style={i > 0 ? { borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" } : undefined}>
                  <div className="h-6 w-10 rounded animate-pulse mb-1.5" style={{ background: "var(--border-light)" }} />
                  <div className="h-3 w-20 rounded animate-pulse" style={{ background: "var(--border-light)" }} />
                </div>
              ))
            : stats.map((s, i) => (
                <div key={s.label} className="flex-1 py-4 pr-6"
                  style={i > 0 ? { borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" } : undefined}>
                  <div className="text-xl font-bold leading-tight" style={{ color: "var(--text)" }}>{s.value}</div>
                  <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: "var(--muted)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
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
              <div key={i} className="rounded-lg overflow-hidden animate-pulse"
                style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                <div className="h-[3px]" style={{ background: "var(--border)" }} />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: "var(--border-light)" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded w-3/4" style={{ background: "var(--border-light)" }} />
                      <div className="h-3 rounded w-1/2" style={{ background: "var(--border-light)" }} />
                    </div>
                  </div>
                  <div className="h-5 rounded w-2/3" style={{ background: "var(--border-light)" }} />
                </div>
              </div>
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
                  className="block rounded-lg overflow-hidden"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(21,88,214,0.12)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>

                  {/* Accent bar */}
                  <div className="h-[3px]" style={{ background: board.honoree_avatar_color }} />

                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ background: board.honoree_avatar_color }}>
                        {initials(board.honoree_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate leading-tight" style={{ color: "var(--text)" }}>
                          {board.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                          {board.honoree_name}
                        </p>
                      </div>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: "var(--accent-light)" }}>
                        {TYPE_EMOJI[board.type] ?? "🎉"}
                      </span>
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
                      {dl !== null && dl <= 7 && (
                        <span className="text-xs ml-auto px-2 py-0.5 rounded-full font-medium"
                          style={dl < 3
                            ? { background: "rgba(220,38,38,0.10)", color: "#DC2626" }
                            : { background: "rgba(217,119,6,0.10)", color: "#D97706" }}>
                          {dl}d left
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Upcoming milestones */}
        {!loading && milestones.length > 0 && (
          <div className="mt-12">
            <div style={{ borderTop: "1px solid var(--border)" }} className="mb-6" />
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                Upcoming Milestones
              </h2>
              <Link href="/calendar" className="text-xs" style={{ color: "var(--accent)" }}>View calendar →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {milestones.map(m => (
                <Link key={`${m.board_id}-${m.milestone_date}`} href={`/board/${m.board_id}`}
                  className="flex-shrink-0 w-44 rounded-lg p-3.5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(21,88,214,0.10)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2"
                    style={{ background: "var(--accent-light)" }}>
                    {TYPE_EMOJI[m.type] ?? "🎉"}
                  </span>
                  <p className="text-sm font-medium truncate leading-tight" style={{ color: "var(--text)" }}>
                    {m.honoree_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {fmtMilestoneDate(m.milestone_date)}
                    <span className="mx-1">·</span>
                    {m.days_until === 0 ? "today" : m.days_until === 1 ? "tomorrow" : `in ${m.days_until} days`}
                  </p>
                </Link>
              ))}
            </div>
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
                    className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[13px]"
                      style={{ background: "var(--accent-light)" }}>
                      {meta.icon}
                    </span>
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
