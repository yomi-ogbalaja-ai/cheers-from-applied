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

function daysAwayStyle(daysUntil: number): React.CSSProperties {
  if (daysUntil <= 3) {
    return { background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" };
  }
  if (daysUntil <= 7) {
    return { background: "rgba(202, 138, 4, 0.12)", color: "#b45309" };
  }
  return { background: "var(--accent-light)", color: "var(--accent)" };
}

function daysAwayLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}

function eventDate(daysUntil: number): Date {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() + daysUntil);
  return d;
}

function MilestoneRow({ item, isLast }: { item: any; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const d = eventDate(item.days_until);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--border-light)",
        background: hovered ? "var(--accent-light)" : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      {/* Date badge */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--card)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
          {d.getDate()}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginTop: 2,
          }}
        >
          {d.toLocaleString("en-US", { month: "short" })}
        </span>
      </div>

      <span style={{ fontSize: 24, width: 30, textAlign: "center" }}>
        {TYPE_EMOJI[item.type] ?? "💛"}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 15 }}>
          {item.honoree_name}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
          {TYPE_LABEL[item.type] ?? item.type} · {item.title}
        </div>
      </div>

      <span
        style={{
          ...daysAwayStyle(item.days_until),
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {daysAwayLabel(item.days_until)}
      </span>

      <Link
        href="/board/new"
        style={{
          border: "1px solid var(--accent)",
          color: hovered ? "#fff" : "var(--accent)",
          background: hovered ? "var(--accent)" : "transparent",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "all 0.15s ease",
        }}
      >
        Create board
      </Link>
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

  // Group by month
  const groups: { key: string; label: string; items: any[] }[] = [];
  for (const item of upcoming) {
    const d = eventDate(item.days_until);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 820, margin: "0 auto" }}>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", margin: 0 }}>
            Milestone Calendar
          </h1>
          <Link
            href="/board/new"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + New Board
          </Link>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 80,
                borderRadius: 12,
                background: "var(--accent-light)",
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      {!loading && upcoming.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "72px 32px",
            border: "1px dashed var(--border)",
            borderRadius: 16,
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
            No upcoming milestones
          </div>
          <div style={{ fontSize: 14, marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
            Nothing on the horizon yet. Create a board to start tracking your team's
            birthdays, anniversaries, and big moments.
          </div>
          <Link
            href="/board/new"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 10,
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

      {!loading &&
        groups.map((group) => (
          <section key={group.key} style={{ marginBottom: 36 }}>
            <h2
              style={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                background: "var(--bg)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: 0,
                padding: "12px 0 10px",
              }}
            >
              {group.label}
            </h2>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
                background: "var(--card)",
              }}
            >
              {group.items.map((item, i) => (
                <MilestoneRow
                  key={item.board_id}
                  item={item}
                  isLast={i === group.items.length - 1}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
