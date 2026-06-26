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
  "bg-indigo-500", "bg-pink-500", "bg-violet-500", "bg-sky-500",
  "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-teal-500",
];

const STRIP_COLORS = [
  "bg-indigo-400", "bg-pink-400", "bg-violet-400", "bg-sky-400",
  "bg-emerald-400", "bg-amber-400", "bg-rose-400", "bg-teal-400",
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-14 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-5xl mb-3">🏅</div>
          <h1 className="text-4xl font-bold mb-2">Badge Showcase</h1>
          <p className="text-lg text-indigo-100 mb-8">Celebrating the people who show up for each other</p>
          <div className="flex justify-center gap-12">
            <div>
              <div className="text-3xl font-bold">{groups === null ? "—" : totalBadges}</div>
              <div className="text-indigo-200 text-sm mt-1">Total Badges</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{groups === null ? "—" : uniqueEarners}</div>
              <div className="text-indigo-200 text-sm mt-1">Unique Earners</div>
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
            <p className="text-gray-500 text-lg mb-4">No badges yet — start celebrating!</p>
            <Link href="/" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Go to Homepage
            </Link>
          </div>
        )}

        {/* Grid */}
        {groups !== null && groups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => {
              const ci = colorIdx(g.person_email);
              return (
                <div key={g.person_email} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className={`h-2 ${STRIP_COLORS[ci]}`} />
                  <div className="p-5 flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${AVATAR_COLORS[ci]}`}>
                        {getInitials(g.person_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{g.person_name}</div>
                        <div className="text-xs text-gray-400 truncate">{g.person_email}</div>
                      </div>
                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
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
                              {b.reason && <p className="text-sm text-gray-600 leading-snug truncate">{b.reason}</p>}
                              <p className="text-xs text-gray-400">{fmtDate(b.awarded_at)}</p>
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
