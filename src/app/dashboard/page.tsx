"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂",
  work_anniversary: "🏆",
  farewell: "👋",
  milestone: "🌟",
  shoutout: "📣",
  welcome: "🎉",
  other: "💛",
};

const VALUE_COLORS = ["#1558D6", "#4D8EFF", "#93B4FF"];
const MEDALS = ["🥇", "🥈", "🥉"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "24px 28px",
        flex: 1,
        minWidth: 180,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            marginBottom: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "var(--text)",
            lineHeight: 1,
            transition: "all 0.4s ease",
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--accent-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {icon}
      </div>
    </div>
  );
}

function Skeleton({ height, width = "100%" }: { height: number; width?: string | number }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: 12,
        background: "var(--accent-light)",
        opacity: 0.6,
        animation: "cheersPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uniqueContributors = data
    ? new Set(data.top_contributors?.map((c: any) => c.author_name)).size
    : 0;

  const valuesTotal = data
    ? (Object.values(data.values_breakdown || {}).reduce(
        (s: any, v: any) => s + v,
        0
      ) as number)
    : 0;

  const maxPosts = data
    ? Math.max(...(data.participation ?? []).map((r: any) => r.post_count || 0), 1)
    : 1;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes cheersPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 6,
          }}
        >
          Applied Intuition
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Manager Dashboard
        </h1>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <Skeleton height={104} />
            <Skeleton height={104} />
            <Skeleton height={104} />
          </div>
          <Skeleton height={240} />
          <Skeleton height={160} />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stats Row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 44, flexWrap: "wrap" }}>
            <StatCard label="Active Boards" value={data.total_active ?? 0} icon="🗂️" />
            <StatCard
              label="Avg Posts / Board"
              value={data.avg_posts_per_board ?? 0}
              icon="✍️"
            />
            <StatCard label="Total Contributors" value={uniqueContributors} icon="👥" />
          </div>

          {/* Active Boards Table */}
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 14,
              }}
            >
              Active Boards
            </h2>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--card)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {["Board", "Honoree", "Type", "Value Tag", "Participation", "Expires"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700 }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(data.participation ?? []).map((row: any, i: number) => (
                    <tr
                      key={row.board_id}
                      onMouseEnter={() => setHoveredRow(row.board_id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--border-light)",
                        background:
                          hoveredRow === row.board_id ? "var(--accent-light)" : "transparent",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        <Link
                          href={`/board/${row.board_id}`}
                          style={{ color: "var(--accent)", textDecoration: "none" }}
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text)" }}>
                        {row.honoree_name}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 18 }}>
                        {TYPE_EMOJI[row.type] ?? "💛"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {row.values_tag ? (
                          <span
                            style={{
                              background: "var(--accent-light)",
                              color: "var(--accent)",
                              borderRadius: 20,
                              padding: "3px 11px",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.values_tag}
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 13 }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", minWidth: 140 }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 10 }}
                          title={`${row.post_count} posts`}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 999,
                              background: "var(--border)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.round(
                                  ((row.post_count || 0) / maxPosts) * 100
                                )}%`,
                                height: "100%",
                                borderRadius: 999,
                                background: "var(--accent)",
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: "var(--text)",
                              fontWeight: 700,
                              fontSize: 13,
                              minWidth: 18,
                              textAlign: "right",
                            }}
                          >
                            {row.post_count}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "var(--muted)",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.expires_at
                          ? new Date(row.expires_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {(data.participation ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "28px 16px",
                          textAlign: "center",
                          color: "var(--muted)",
                          fontSize: 14,
                        }}
                      >
                        No active boards found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Contributors */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
              Top Contributors
            </h2>
            {(data.top_contributors ?? []).length === 0 ? (
              <span style={{ color: "var(--muted)", fontSize: 14 }}>No contributors yet.</span>
            ) : (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "var(--card)",
                }}
              >
                {(data.top_contributors ?? []).map((c: any, i: number) => (
                  <div
                    key={c.author_name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 18px",
                      borderTop: i === 0 ? "none" : "1px solid var(--border-light)",
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        textAlign: "center",
                        fontSize: i < 3 ? 18 : 13,
                        fontWeight: 700,
                        color: "var(--muted)",
                      }}
                    >
                      {i < 3 ? MEDALS[i] : i + 1}
                    </span>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "var(--accent-light)",
                        color: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials(c.author_name)}
                    </span>
                    <span
                      style={{ flex: 1, fontWeight: 600, color: "var(--text)", fontSize: 14 }}
                    >
                      {c.author_name}
                    </span>
                    <span
                      style={{
                        background: "var(--accent)",
                        color: "#fff",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Values Breakdown */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
              Values Breakdown
            </h2>
            {valuesTotal === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 14 }}>
                No values-tagged posts yet.
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "20px 22px",
                  background: "var(--card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: 28,
                    borderRadius: 999,
                    overflow: "hidden",
                    marginBottom: 16,
                    background: "var(--border-light)",
                  }}
                >
                  {Object.entries(data.values_breakdown).map(
                    ([tag, count]: [string, any], i) => {
                      const pct = valuesTotal > 0 ? (count / valuesTotal) * 100 : 0;
                      return (
                        <div
                          key={tag}
                          title={`${tag}: ${count}`}
                          style={{
                            width: `${pct}%`,
                            background: VALUE_COLORS[i % VALUE_COLORS.length],
                            transition: "width 0.4s ease",
                            minWidth: count > 0 ? 4 : 0,
                          }}
                        />
                      );
                    }
                  )}
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {Object.entries(data.values_breakdown).map(
                    ([tag, count]: [string, any], i) => (
                      <div
                        key={tag}
                        style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 4,
                            background: VALUE_COLORS[i % VALUE_COLORS.length],
                            display: "inline-block",
                          }}
                        />
                        <span style={{ color: "var(--text)", fontWeight: 600 }}>{tag}</span>
                        <span style={{ color: "var(--muted)" }}>
                          {count} ({valuesTotal > 0 ? Math.round((count / valuesTotal) * 100) : 0}
                          %)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
