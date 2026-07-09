// Single source of truth for badge types. Previously this list was
// duplicated (and had drifted out of sync) across the award-badge API route,
// the give-badge dropdown, and three separate display components — the
// dropdown was missing options for badge types the API already accepted,
// and the display maps used keys that didn't match any real badge_type,
// so most badges rendered with a generic fallback icon/label instead of
// their own.
export const BADGE_TYPES = [
  "team_player",
  "cheer_champion",
  "birthday_star",
  "rising_star",
  "generous_soul",
  "milestone_maker",
  "culture_carrier",
  "heartwarmer",
  "welcome_wagon",
] as const;

export type BadgeType = typeof BADGE_TYPES[number];

// Keyed by string (not BadgeType) so callers can safely look up a badge_type
// read back from the database without a cast, and fall back gracefully if it
// doesn't match a known type.
export const BADGE_META: Record<string, { icon: string; color: string; label: string }> = {
  team_player:     { icon: "🤝", color: "#6366f1", label: "Team Player" },
  cheer_champion:  { icon: "📣", color: "#f59e0b", label: "Cheer Champion" },
  birthday_star:   { icon: "🎂", color: "#ec4899", label: "Birthday Star" },
  rising_star:     { icon: "🚀", color: "#0ea5e9", label: "Rising Star" },
  generous_soul:   { icon: "💛", color: "#f97316", label: "Generous Soul" },
  milestone_maker: { icon: "🏆", color: "#10b981", label: "Milestone Maker" },
  culture_carrier: { icon: "🌟", color: "#8b5cf6", label: "Culture Carrier" },
  heartwarmer:     { icon: "❤️", color: "#ef4444", label: "Heartwarmer" },
  welcome_wagon:   { icon: "👋", color: "#14b8a6", label: "Welcome Wagon" },
};
