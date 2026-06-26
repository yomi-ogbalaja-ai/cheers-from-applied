"use client";
import { useEffect, useState } from "react";

const BADGE_META: Record<string, { icon: string; color: string; label: string }> = {
  cheer_champion: { icon: "🏆", color: "bg-purple-100 text-purple-700", label: "Cheer Champion" },
  generous_soul: { icon: "💝", color: "bg-pink-100 text-pink-700", label: "Generous Soul" },
  birthday_star: { icon: "⭐", color: "bg-yellow-100 text-yellow-700", label: "Birthday Star" },
  rising_star: { icon: "🚀", color: "bg-violet-100 text-violet-700", label: "Rising Star" },
  team_player: { icon: "🤝", color: "bg-blue-100 text-blue-700", label: "Team Player" },
  heartwarmer: { icon: "❤️", color: "bg-red-100 text-red-700", label: "Heartwarmer" },
  welcome_wagon: { icon: "👋", color: "bg-teal-100 text-teal-700", label: "Welcome Wagon" },
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS: Record<string, string> = {
  "Alex Chen": "#6366f1",
  "Jordan Smith": "#3b82f6",
  "Maya Patel": "#ec4899",
  "Sam Lee": "#8b5cf6",
  "Yomi Ogbalaja": "#f59e0b",
};

interface BadgeItem {
  id: number; badge_type: string; board_id: string; reason: string; awarded_at: string;
}
interface PersonGroup {
  person_name: string; person_email: string; badges: BadgeItem[];
}

export default function BadgesPage() {
  const [groups, setGroups] = useState<PersonGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/badges").then((r) => r.json()).then((d) => { setGroups(d); setLoading(false); });
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="py-14 px-4 text-center text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
        <div className="text-5xl mb-4">🏅</div>
        <h1 className="text-4xl font-extrabold mb-2">Badge Showcase</h1>
        <p className="text-indigo-100">Celebrating the people who show up for each other</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl border h-40 animate-pulse" style={{ borderColor: "#e5e7eb" }} />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🌟</div>
            <p>No badges awarded yet. Start celebrating to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => {
              const avatarColor = AVATAR_COLORS[g.person_name] ?? "#6366f1";
              return (
                <div key={g.person_email} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ borderColor: "#e5e7eb" }}>
                  {/* Header */}
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${avatarColor}, #ec4899)` }} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: avatarColor }}
                      >
                        {initials(g.person_name)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{g.person_name}</div>
                        <div className="text-xs text-gray-400">{g.person_email}</div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {g.badges.map((b) => {
                        const meta = BADGE_META[b.badge_type] ?? { icon: "🏅", color: "bg-gray-100 text-gray-600", label: b.badge_type };
                        return (
                          <div key={b.id} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl ${meta.color}`}>
                            <span className="text-xl flex-shrink-0">{meta.icon}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm">{meta.label}</div>
                              {b.reason && <div className="text-xs opacity-70 leading-snug mt-0.5">{b.reason}</div>}
                              <div className="text-xs opacity-50 mt-1">{new Date(b.awarded_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-gray-400 text-right">
                      {g.badges.length} badge{g.badges.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
