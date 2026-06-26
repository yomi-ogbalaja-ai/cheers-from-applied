"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

const BADGE_META: Record<string, { icon: string }> = {
  cheer_champion: { icon: "🏆" },
  generous_soul:  { icon: "💝" },
  birthday_star:  { icon: "⭐" },
  rising_star:    { icon: "🚀" },
  team_player:    { icon: "🤝" },
  heartwarmer:    { icon: "❤️" },
  welcome_wagon:  { icon: "👋" },
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysLeft(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface Board {
  id: string; honoree_name: string; honoree_email: string; honoree_avatar_color: string;
  type: string; title: string; description: string; values_tag: string; expires_at: string;
  post_count: number; gift_count: number; approved_hours: number;
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
      fetch("/api/boards").then((r) => r.json()),
      fetch("/api/badges").then((r) => r.json()),
    ]).then(([b, bg]) => {
      setBoards(b);
      setBadgeGroups(bg);
      setLoading(false);
    });
  }, []);

  const recentBadges = badgeGroups
    .flatMap((g) => g.badges.map((b) => ({ ...b, person_name: g.person_name })))
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden py-20 px-4" style={{ background: "var(--navy)" }}>
        {/* subtle grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="max-w-6xl mx-auto text-center text-white relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(21,87,255,0.25)", border: "1px solid rgba(21,87,255,0.4)", color: "#93B4FF" }}>
            🎉 Employee Celebration Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Cheers <span style={{ color: "#93B4FF" }}>from Applied</span>
          </h1>
          <p className="text-lg mb-8" style={{ color: "#93B4FF" }}>Celebrate milestones with your team — birthdays, promotions, new hires &amp; more</p>
          <Link
            href="/board/new"
            className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-full text-lg shadow-lg transition-all hover:scale-105 hover:opacity-90"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + Start a Celebration Board
          </Link>
        </div>
        {/* decorative dots */}
        <div className="absolute top-8 left-12 w-2 h-2 rounded-full opacity-30" style={{ background: "var(--accent)" }} />
        <div className="absolute top-16 right-20 w-3 h-3 rounded-full opacity-20" style={{ background: "#93B4FF" }} />
        <div className="absolute bottom-8 left-1/3 w-2 h-2 rounded-full opacity-25" style={{ background: "var(--accent)" }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Active Boards</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {boards.length} celebration{boards.length !== 1 ? "s" : ""} in progress
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white border animate-pulse h-52" style={{ borderColor: "var(--border)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => {
              const dl = daysLeft(board.expires_at);
              return (
                <Link
                  key={board.id}
                  href={`/board/${board.id}`}
                  className="group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* accent strip */}
                  <div className="h-1.5" style={{ background: "var(--accent)" }} />
                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-3xl">{TYPE_EMOJI[board.type] ?? "🎉"}</div>
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: board.honoree_avatar_color }}
                      >
                        {initials(board.honoree_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate" style={{ color: "var(--text)", fontSize: "0.95rem" }}>{board.title}</div>
                        <div className="text-sm" style={{ color: "var(--muted)" }}>{board.honoree_name}</div>
                      </div>
                    </div>
                    {board.description && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>{board.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        {board.values_tag}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                        💬 {board.post_count} cheer{board.post_count !== 1 ? "s" : ""}
                      </span>
                      {board.approved_hours > 0 && (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          🎁 {board.approved_hours}h gifted
                        </span>
                      )}
                      {dl !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dl <= 3 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
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

        {/* Empty state */}
        {!loading && boards.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-lg mb-2" style={{ color: "var(--text)", fontWeight: 600 }}>No boards yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Start celebrating your team&apos;s milestones</p>
            <Link href="/board/new"
              className="inline-block px-6 py-2 rounded-full text-white font-semibold text-sm"
              style={{ background: "var(--accent)" }}>
              Create first board
            </Link>
          </div>
        )}

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Recent Badges</h2>
              <Link href="/badges" className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>View all →</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentBadges.map((b) => {
                const meta = BADGE_META[b.badge_type] ?? { icon: "🏅" };
                return (
                  <div key={b.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white border shadow-sm"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                    <span>{meta.icon}</span>
                    <span>{b.person_name}</span>
                    <span style={{ color: "var(--muted)" }} className="capitalize">{b.badge_type.replace(/_/g, " ")}</span>
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
