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

const TYPE_LABEL: Record<string, string> = {
  birthday: "Birthday",
  work_anniversary: "Work Anniversary",
  farewell: "Farewell",
  milestone: "Milestone",
  shoutout: "Shoutout",
  welcome: "Welcome",
  other: "Celebration",
};

function urgencyStyle(daysUntil: number): React.CSSProperties {
  if (daysUntil < 7) {
    return { background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" };
  } else if (daysUntil <= 14) {
    return { background: "#fefce8", color: "#ca8a04", border: "1px solid #fde68a" };
  }
  return { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" };
}

function MilestoneRow({ item }: { item: any }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <span style={{ fontSize: 24, width: 32, textAlign: "center" }}>
        {TYPE_EMOJI[item.type] ?? "💛"}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 15 }}>
          {item.honoree_name}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
          {TYPE_LABEL[item.type] ?? item.type} · {item.title}
        </div>
      </div>
      <span
        style={{
          ...urgencyStyle(item.days_until),
          borderRadius: 20,
          padding: "3px 12px",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {item.days_until === 0
          ? "Today!"
          : item.days_until === 1
          ? "Tomorrow"
          : `${item.days_until}d`}
      </span>
    </div>
  );
}

export default function CalendarPage() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        setUpcoming(d.upcoming ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const thisMonthItems = upcoming.filter((item) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() + item.days_until);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const nextMonthItems = upcoming.filter((item) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() + item.days_until);
    const nm = (thisMonth + 1) % 12;
    const nmYear = thisMonth === 11 ? thisYear + 1 : thisYear;
    return d.getMonth() === nm && d.getFullYear() === nmYear;
  });

  const monthName = (offset: number) =>
    new Date(thisYear, thisMonth + offset, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ padding: "32px 40px", maxWidth: 820, margin: "0 auto" }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", margin: 0 }}>
            Milestone Calendar
          </h1>
          <Link
            href="/board/new"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            + New Board
          </Link>
        </div>
      </div>

      {loading && (
        <div style={{ color: "var(--muted)", fontSize: 15 }}>Loading milestones…</div>
      )}

      {!loading && upcoming.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 32px",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
            No upcoming milestones found
          </div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>
            Create boards to track your team's important dates.
          </div>
          <Link
            href="/board/new"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Create a Board
          </Link>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <>
          {/* This Month */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              {monthName(0)}
            </h2>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {thisMonthItems.length === 0 ? (
                <div style={{ padding: "18px 20px", color: "var(--muted)", fontSize: 14 }}>
                  No milestones this month.
                </div>
              ) : (
                thisMonthItems.map((item) => (
                  <MilestoneRow key={item.board_id} item={item} />
                ))
              )}
            </div>
          </section>

          {/* Next Month */}
          <section>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              {monthName(1)}
            </h2>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {nextMonthItems.length === 0 ? (
                <div style={{ padding: "18px 20px", color: "var(--muted)", fontSize: 14 }}>
                  No milestones next month.
                </div>
              ) : (
                nextMonthItems.map((item) => (
                  <MilestoneRow key={item.board_id} item={item} />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
