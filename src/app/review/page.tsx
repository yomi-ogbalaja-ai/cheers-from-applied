"use client";

import { useEffect, useState } from "react";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂",
  wedding: "💍",
  new_baby: "👶",
  work_anniversary: "🥂",
  promotion: "🚀",
  get_well: "💐",
  new_hire: "👋",
  personal_achievement: "🌟",
  farewell: "👋",
  milestone: "🌟",
  shoutout: "📣",
  welcome: "🎉",
  other: "💛",
};

const TYPE_LABEL: Record<string, string> = {
  birthday: "Birthdays",
  wedding: "Weddings",
  new_baby: "New Babies",
  work_anniversary: "Work Anniversaries",
  promotion: "Promotions",
  get_well: "Get Well",
  new_hire: "New Hires",
  personal_achievement: "Achievements",
  farewell: "Farewells",
  milestone: "Milestones",
  shoutout: "Shoutouts",
  welcome: "Welcomes",
  other: "Other",
};

const APPLIED_VALUES = ["Win Together", "Be Bold", "Move with Urgency"];
const VALUE_COLORS = ["#1558D6", "#4D8EFF", "#93B4FF"];

interface BoardSummary {
  id: string;
  title: string;
  type: string;
  honoree_name: string;
  values_tag: string | null;
  post_count: number;
  date: string | null;
}

interface MonthData {
  month: string;
  count: number;
  boards: string[];
}

interface ReviewData {
  year: number;
  total_boards: number;
  total_posts: number;
  by_value: Record<string, number>;
  by_type: Record<string, number>;
  by_month: MonthData[];
  boards: BoardSummary[];
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "24px 26px",
  background: "var(--card)",
  marginBottom: 20,
};

export default function ReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setLoading(true);
    fetch("/api/review?year=2026")
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[200, 140, 180].map((h, i) => (
            <div
              key={i}
              style={{ height: h, borderRadius: 14, background: "var(--accent-light)", opacity: 0.6 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !data.by_month) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Couldn't load the year in review
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
          Check your connection and try again.
        </div>
        <button
          onClick={load}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const maxMonth = Math.max(...data.by_month.map((m) => m.count), 1);
  const peakIndex = data.by_month.reduce(
    (best, m, i) => (m.count > data.by_month[best].count ? i : best),
    0
  );
  const hasAnyMonth = data.by_month.some((m) => m.count > 0);

  const valuesTotal = APPLIED_VALUES.reduce((s, v) => s + (data.by_value[v] ?? 0), 0);

  const typeEntries = Object.entries(data.by_type ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px", color: "var(--text)" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: "0 0 6px",
          }}
        >
          Applied Intuition
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          Year in Review
        </h1>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 15 }}>
          {data.year} · Celebrating the people who make Applied great
        </p>
      </div>

      {/* Hero */}
      <div
        style={{
          ...cardStyle,
          textAlign: "center",
          padding: "48px 26px",
          background: "var(--accent-light)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "var(--accent)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {data.total_posts}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
            marginTop: 12,
          }}
        >
          Cheers this year
        </div>
      </div>

      {/* Monthly bar chart */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 22px" }}>Cheers by Month</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 150 }}>
          {data.by_month.map((m, i) => {
            const isPeak = hasAnyMonth && i === peakIndex && m.count > 0;
            const heightPct = m.count > 0 ? Math.max(8, Math.round((m.count / maxMonth) * 100)) : 3;
            return (
              <div
                key={m.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  height: "100%",
                }}
                title={`${m.month}: ${m.count} board${m.count === 1 ? "" : "s"}${
                  m.boards.length ? " — " + m.boards.join(", ") : ""
                }`}
              >
                {isPeak && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--accent-dark)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Peak month
                  </span>
                )}
                <div
                  style={{
                    width: "100%",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      background: isPeak
                        ? "var(--accent-dark)"
                        : m.count > 0
                        ? "var(--accent)"
                        : "var(--border)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.4s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: isPeak ? "var(--accent-dark)" : "var(--muted)",
                    fontWeight: isPeak ? 700 : 500,
                  }}
                >
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Value */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>By Applied Value</h2>
        {valuesTotal === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            No values-tagged boards yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {APPLIED_VALUES.map((v, i) => {
              const count = data.by_value[v] ?? 0;
              const pct = valuesTotal > 0 ? Math.round((count / valuesTotal) * 100) : 0;
              return (
                <div key={v}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{v}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {count} · {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      background: "var(--border-light)",
                      borderRadius: 999,
                      height: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: VALUE_COLORS[i % VALUE_COLORS.length],
                        borderRadius: 999,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By Type */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>Board Types</h2>
        {typeEntries.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>No boards yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 12,
            }}
          >
            {typeEntries.map(([type, count]) => (
              <div
                key={type}
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: 12,
                  padding: "16px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{TYPE_EMOJI[type] ?? "🎉"}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                  {TYPE_LABEL[type] ?? type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All boards */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px" }}>All Boards</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.boards.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
              No boards yet for {data.year}.
            </p>
          )}
          {data.boards.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                border: "1px solid var(--border-light)",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span style={{ fontSize: 20 }}>{TYPE_EMOJI[b.type] ?? "🎉"}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{b.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    {b.honoree_name}
                    {b.values_tag ? ` · ${b.values_tag}` : ""}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{b.post_count}</span> posts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shareable summary card */}
      <div
        style={{
          border: "2px solid var(--accent)",
          borderRadius: 18,
          padding: "36px 30px",
          background: "var(--card)",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 14,
          }}
        >
          Cheers from Applied · {data.year}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", lineHeight: 1.4 }}>
          {data.total_posts} cheers · {data.total_boards} boards ·{" "}
          {typeEntries.length} celebration types
        </div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 12 }}>
          Thanks for celebrating together this year.
        </div>
      </div>
    </div>
  );
}
