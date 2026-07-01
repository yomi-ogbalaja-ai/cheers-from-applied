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
};

const APPLIED_VALUES = ["Win Together", "Be Bold", "Move with Urgency"];

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

export default function ReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review?year=2026")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--muted)" }}>
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", color: "var(--muted)" }}>
        Could not load review data.
      </div>
    );
  }

  const maxMonth = Math.max(...data.by_month.map((m) => m.count), 1);
  const maxValue = Math.max(...APPLIED_VALUES.map((v) => data.by_value[v] ?? 0), 1);

  const topValue = APPLIED_VALUES.reduce((best, v) =>
    (data.by_value[v] ?? 0) > (data.by_value[best] ?? 0) ? v : best,
    APPLIED_VALUES[0]
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem", color: "var(--text)" }}>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "0.4rem" }}>
          Applied Intuition
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          Year in Review
        </h1>
        <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontSize: "0.95rem" }}>
          {data.year} · Celebrating the people who make Applied great
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Boards created", value: data.total_boards },
          { label: "Posts written", value: data.total_posts },
          { label: "Top value", value: topValue },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "1.25rem 1rem",
              background: "var(--bg)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.4rem", fontWeight: 500 }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "var(--text)", lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* By Value */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.5rem",
          background: "var(--bg)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>By Applied Value</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {APPLIED_VALUES.map((v) => {
            const count = data.by_value[v] ?? 0;
            const pct = Math.round((count / maxValue) * 100);
            return (
              <div key={v}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.875rem" }}>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                  <span style={{ color: "var(--muted)" }}>{count}</span>
                </div>
                <div style={{ background: "var(--border)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "var(--accent)",
                      borderRadius: 4,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Month bar chart */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.5rem",
          background: "var(--bg)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>Boards by Month</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: 120 }}>
          {data.by_month.map((m) => {
            const heightPct = m.count > 0 ? Math.max(8, Math.round((m.count / maxMonth) * 100)) : 4;
            return (
              <div
                key={m.month}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}
                title={m.boards.join(", ") || "No boards"}
              >
                <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 96 }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      background: m.count > 0 ? "var(--accent)" : "var(--border)",
                      borderRadius: "4px 4px 0 0",
                      opacity: m.count > 0 ? 1 : 0.4,
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 500 }}>{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent boards */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.5rem",
          background: "var(--bg)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1.25rem" }}>All Boards</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {data.boards.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No boards yet for {data.year}.</p>
          )}
          {data.boards.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--bg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>{TYPE_EMOJI[b.type] ?? "🎉"}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem" }}>{b.title}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                    {b.honoree_name}
                    {b.values_tag ? ` · ${b.values_tag}` : ""}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "0.8rem", color: "var(--muted)" }}>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{b.post_count}</span> posts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
