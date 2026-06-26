"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

const VALUES_COLORS: Record<string, string> = {
  "Win Together": "bg-indigo-100 text-indigo-700",
  "Move with Urgency": "bg-violet-100 text-violet-700",
  "Be Bold": "bg-pink-100 text-pink-700",
  "default": "bg-gray-100 text-gray-600",
};

const BADGE_META: Record<string, { icon: string; color: string }> = {
  cheer_champion: { icon: "🏆", color: "bg-purple-100 text-purple-700" },
  generous_soul: { icon: "💝", color: "bg-pink-100 text-pink-700" },
  birthday_star: { icon: "⭐", color: "bg-yellow-100 text-yellow-700" },
  rising_star: { icon: "🚀", color: "bg-violet-100 text-violet-700" },
  team_player: { icon: "🤝", color: "bg-blue-100 text-blue-700" },
  heartwarmer: { icon: "❤️", color: "bg-red-100 text-red-700" },
  welcome_wagon: { icon: "👋", color: "bg-teal-100 text-teal-700" },
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

  // Flatten recent badges
  const recentBadges = badgeGroups
    .flatMap((g) => g.badges.map((b) => ({ ...b, person_name: g.person_name })))
    .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-4" style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}>
        <div className="max-w-6xl mx-auto text-center text-white relative z-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Cheers from Applied</h1>
          <p className="text-xl text-indigo-100 mb-8">Where milestones meet meaning</p>
          <Link
            href="/board/new"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            + Start a Celebration Board
          </Link>
        </div>
        {/* decorative bubbles */}
        <div className="absolute top-4 left-8 text-5xl opacity-20 rotate-12">🎊</div>
        <div className="absolute bottom-4 right-12 text-5xl opacity-20 -rotate-12">✨</div>
        <div className="absolute top-8 right-24 text-4xl opacity-15">🌟</div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Board count */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Active Celebration Boards</h2>
            <p className="text-gray-500 text-sm mt-1">{boards.length} board{boards.length !== 1 ? "s" : ""} open right now</p>
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
              const vcls = VALUES_COLORS[board.values_tag] ?? VALUES_COLORS["default"];
              return (
                <Link
                  key={board.id}
                  href={`/board/${board.id}`}
                  className="group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* card header strip */}
                  <div className="h-2" style={{ background: `linear-gradient(90deg, ${board.honoree_avatar_color}, #ec4899)` }} />
                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="text-3xl">{TYPE_EMOJI[board.type] ?? "🎉"}</div>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: board.honoree_avatar_color }}
                      >
                        {initials(board.honoree_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{board.title}</div>
                        <div className="text-sm text-gray-500">{board.honoree_name}</div>
                      </div>
                    </div>
                    {board.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{board.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${vcls}`}>{board.values_tag}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        💬 {board.post_count} messages
                      </span>
                      {board.approved_hours > 0 && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
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

        {/* Recent Badges Strip */}
        {recentBadges.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Badges</h2>
              <Link href="/badges" className="text-sm text-indigo-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {recentBadges.map((b) => {
                const meta = BADGE_META[b.badge_type] ?? { icon: "🏅", color: "bg-gray-100 text-gray-600" };
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${meta.color} shadow-sm`}
                  >
                    <span>{meta.icon}</span>
                    <span>{b.person_name}</span>
                    <span className="opacity-60 capitalize">{b.badge_type.replace(/_/g, " ")}</span>
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
