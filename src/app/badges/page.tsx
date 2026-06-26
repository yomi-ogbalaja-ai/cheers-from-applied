"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface BadgeItem {
  id: number;
  badge_type: string;
  board_id: number;
  reason: string;
  awarded_at: string;
}

interface PersonGroup {
  person_name: string;
  person_email: string;
  badges: BadgeItem[];
}

const BADGE_META: Record<string, { icon: string; color: string; label: string }> = {
  kudos:       { icon: "👏", color: "bg-yellow-100 text-yellow-700", label: "Kudos" },
  star:        { icon: "⭐", color: "bg-orange-100 text-orange-700", label: "Star" },
  heart:       { icon: "❤️", color: "bg-red-100 text-red-700",    label: "Heart" },
  fire:        { icon: "🔥", color: "bg-rose-100 text-rose-700",   label: "Fire" },
  rocket:      { icon: "🚀", color: "bg-blue-100 text-blue-700",   label: "Rocket" },
  lightbulb:   { icon: "💡", color: "bg-green-100 text-green-700", label: "Lightbulb" },
  handshake:   { icon: "🤝", color: "bg-purple-100 text-purple-700", label: "Handshake" },
};

const AVATAR_COLORS = [
  "#1557FF", "#0A3FD4", "#2E74FF", "#0D47C9",
  "#1040B0", "#3B8BFF", "#0A2E99", "#1E5FE8",
];

const STRIP_COLORS = AVATAR_COLORS;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function colorIdx(email: string) {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % AVATAR_COLORS.length;
  return h;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BadgesPage() {
  const [groups, setGroups] = useState<PersonGroup[] | null>(null);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => r.json())
      .then((data: PersonGroup[]) => {
        const sorted = [...data].sort((a, b) => b.badges.length - a.badges.length);
        setGroups(sorted);
      })
      .catch(() => setGroups([]));
  }, []);

  const totalBadges = groups ? groups.reduce((s, g) => s + g.badges.length, 0) : 0;
  const uniqueEarners = groups ? groups.length : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <div className="py-12 px-6" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "var(--accent)" }}>Applied Intuition</p>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--text)" }}>Badge Showcase</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Celebrating the people who show up for each other</p>
          <div className="flex gap-8">
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{groups === null ? "—" : totalBadges}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Total Badges</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{groups === null ? "—" : uniqueEarners}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Unique Earners</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Loading */}
        {groups === null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-2 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-200" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {groups !== null && groups.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🎖️</div>
            <p className="text-lg mb-4" style={{ color: "var(--muted)" }}>No badges yet. Start celebrating!</p>
            <Link href="/" className="inline-block text-white px-6 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)" }}>
              Go to Homepage
            </Link>
          </div>
        )}

        {/* Grid */}
        {groups !== null && groups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => {
              const ci = colorIdx(g.person_email);
              const color = AVATAR_COLORS[ci];
              return (
                <div key={g.person_email} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ border: "1px solid var(--border)" }}>
                  <div className="h-1.5" style={{ background: color }} />
                  <div className="p-5 flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: color }}>
                        {getInitials(g.person_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate" style={{ color: "var(--text)" }}>{g.person_name}</div>
                        <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{g.person_email}</div>
                      </div>
                      <span className="ml-auto text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0"
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        {g.badges.length} badge{g.badges.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {g.badges.map((b) => {
                        const meta = BADGE_META[b.badge_type] ?? { icon: "🏷️", color: "bg-gray-100 text-gray-700", label: b.badge_type };
                        return (
                          <li key={b.id} className="flex items-start gap-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </span>
                            <div className="min-w-0">
                              {b.reason && <p className="text-sm leading-snug truncate" style={{ color: "var(--text)" }}>{b.reason}</p>}
                              <p className="text-xs" style={{ color: "var(--muted)" }}>{fmtDate(b.awarded_at)}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
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
