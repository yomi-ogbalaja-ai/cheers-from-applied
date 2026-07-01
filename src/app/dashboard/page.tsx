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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "24px 28px",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    ? Object.values(data.values_breakdown || {}).reduce((s: any, v: any) => s + v, 0) as number
    : 0;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
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
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Manager Dashboard
        </h1>
      </div>

      {loading && (
        <div style={{ color: "var(--muted)", fontSize: 15 }}>Loading dashboard…</div>
      )}

      {!loading && data && (
        <>
          {/* Stats Row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
            <StatCard label="Active Boards" value={data.total_active ?? 0} />
            <StatCard label="Avg Posts / Board" value={data.avg_posts_per_board ?? 0} />
            <StatCard label="Total Contributors" value={uniqueContributors} />
          </div>

          {/* Active Boards Table */}
          <section style={{ marginBottom: 40 }}>
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
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "var(--accent-light)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {["Board", "Honoree", "Type", "Value Tag", "Posts", "Expires"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700 }}
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
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid var(--border)",
                        background: i % 2 === 0 ? "var(--bg)" : "var(--accent-light)",
                      }}
                    >
                      <td style={{ padding: "12px 16px", color: "var(--text)", fontWeight: 500 }}>
                        <Link
                          href={`/board/${row.board_id}`}
                          style={{ color: "var(--accent)", textDecoration: "none" }}
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text)" }}>
                        {row.honoree_name}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 18 }}>
                        {TYPE_EMOJI[row.type] ?? "💛"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {row.values_tag ? (
                          <span
                            style={{
                              background: "var(--accent-light)",
                              color: "var(--accent)",
                              borderRadius: 20,
                              padding: "2px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px solid var(--accent)",
                            }}
                          >
                            {row.values_tag}
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {row.post_count < 3 && (
                            <span
                              title="Low participation"
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#ef4444",
                                display: "inline-block",
                              }}
                            />
                          )}
                          <span style={{ color: "var(--text)", fontWeight: 600 }}>
                            {row.post_count}
                          </span>
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--muted)",
                          fontSize: 13,
                        }}
                      >
                        {row.expires_at
                          ? new Date(row.expires_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {(data.participation ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "24px 16px",
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
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
              Top Contributors
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {(data.top_contributors ?? []).length === 0 && (
                <span style={{ color: "var(--muted)", fontSize: 14 }}>No contributors yet.</span>
              )}
              {(data.top_contributors ?? []).map((c: any) => (
                <div
                  key={c.author_name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "6px 14px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>
                    {c.author_name}
                  </span>
                  <span
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      borderRadius: 20,
                      padding: "1px 8px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Values Breakdown */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
              Values Breakdown
            </h2>
            {valuesTotal === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 14 }}>No values-tagged posts yet.</div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    height: 32,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    marginBottom: 12,
                  }}
                >
                  {Object.entries(data.values_breakdown).map(([tag, count]: [string, any], i) => {
                    const pct = valuesTotal > 0 ? (count / valuesTotal) * 100 : 0;
                    const colors = ["#1558D6", "#3b82f6", "#93c5fd"];
                    return (
                      <div
                        key={tag}
                        title={`${tag}: ${count}`}
                        style={{
                          width: `${pct}%`,
                          background: colors[i % colors.length],
                          transition: "width 0.4s ease",
                          minWidth: pct > 0 ? 4 : 0,
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {Object.entries(data.values_breakdown).map(([tag, count]: [string, any], i) => {
                    const colors = ["#1558D6", "#3b82f6", "#93c5fd"];
                    return (
                      <div
                        key={tag}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: colors[i % colors.length],
                            display: "inline-block",
                          }}
                        />
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>{tag}</span>
                        <span style={{ color: "var(--muted)" }}>({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
