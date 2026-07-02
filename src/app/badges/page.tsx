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

const BADGE_META: Record<string, { icon: string; label: string }> = {
  kudos:     { icon: "👏", label: "Kudos" },
  star:      { icon: "⭐", label: "Star" },
  heart:     { icon: "❤️", label: "Heart" },
  fire:      { icon: "🔥", label: "Fire" },
  rocket:    { icon: "🚀", label: "Rocket" },
  lightbulb: { icon: "💡", label: "Lightbulb" },
  handshake: { icon: "🤝", label: "Handshake" },
};

const AVATAR_COLORS = [
  "#1557FF", "#0A3FD4", "#2E74FF", "#0D47C9",
  "#1040B0", "#3B8BFF", "#0A2E99", "#1E5FE8",
];

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
  const leaders = groups ? groups.slice(0, 5) : [];

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
              <div key={i} className="rounded-xl overflow-hidden animate-pulse"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="h-2" style={{ background: "var(--border-light)" }} />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full" style={{ background: "var(--border-light)" }} />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 rounded w-3/4" style={{ background: "var(--border-light)" }} />
                      <div className="h-3 rounded w-1/2" style={{ background: "var(--border-light)" }} />
                    </div>
                  </div>
                  <div className="h-3 rounded" style={{ background: "var(--border-light)" }} />
                  <div className="h-3 rounded w-5/6" style={{ background: "var(--border-light)" }} />
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

        {groups !== null && groups.length > 0 && (
          <>
            {/* Top Cheerleader leaderboard */}
            <div className="mb-12">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--muted)" }}>
                Top Cheerleaders
              </h2>
              <div className="rounded-xl overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                {leaders.map((g, i) => {
                  const color = AVATAR_COLORS[colorIdx(g.person_email)];
                  const isFirst = i === 0;
                  return (
                    <div key={g.person_email}
                      className="flex items-center gap-4 px-5 py-3.5"
                      style={{
                        background: isFirst ? "var(--accent-light)" : "transparent",
                        borderTop: i > 0 ? "1px solid var(--border-light)" : "none",
                      }}>
                      <span className="w-6 text-sm font-bold text-center flex-shrink-0"
                        style={{ color: isFirst ? "var(--accent)" : "var(--muted)" }}>
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: color }}>
                        {getInitials(g.person_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                          {g.person_name}
                        </span>
                        {isFirst && <span className="ml-1.5">👑</span>}
                      </div>
                      <span className="text-xs font-medium rounded-full px-2.5 py-1 flex-shrink-0"
                        style={{
                          background: isFirst ? "var(--accent)" : "var(--accent-light)",
                          color: isFirst ? "#fff" : "var(--accent)",
                        }}>
                        {g.badges.length} badge{g.badges.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            <h2 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--muted)" }}>
              All Badge Earners
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((g) => {
                const color = AVATAR_COLORS[colorIdx(g.person_email)];
                return (
                  <div key={g.person_email}
                    className="rounded-xl overflow-hidden flex flex-col"
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
                      <ul className="space-y-2.5">
                        {g.badges.map((b) => {
                          const meta = BADGE_META[b.badge_type] ?? { icon: "🏷️", label: b.badge_type };
                          return (
                            <li key={b.id} className="flex items-start gap-2.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                                style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--border-light)" }}>
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
          </>
        )}
      </div>
    </div>
  );
}
