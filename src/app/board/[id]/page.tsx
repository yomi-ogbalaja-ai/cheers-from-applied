"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Board {
  id: string; title: string; honoree_name: string; honoree_email: string;
  honoree_avatar_color: string; type: string; description: string;
  milestone_date: string; values_tag: string; is_private: number;
  share_token: string;
  status: string; created_by: string; created_by_name: string; expires_at: string;
}
interface Post {
  id: string; board_id: string; author_name: string; author_email: string;
  author_avatar_color: string; message: string | null; gif_url: string | null;
  gif_title: string | null; photo_url: string | null; audio_url: string | null;
  reaction: string | null; is_manager_note: number; created_at: string;
  values_tag: string | null; reactions_json: string | null;
}
interface Badge {
  id: string; person_email: string; person_name: string; badge_type: string;
  board_id: string; reason: string; awarded_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const EXPECTED_TEAM = ["Ali Chen","Bree Santos","Carlos Diaz","Dani Park","Erin Walsh","Femi Okafor","Grace Liu","Hana Morita"];

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

const GIF_SETS: Record<string, string[]> = {
  birthday: [
    "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif",
    "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    "https://media.giphy.com/media/3ohs4wE4DqXw84xAMo/giphy.gif",
    "https://media.giphy.com/media/l3q2LH45XElELRzRm/giphy.gif",
    "https://media.giphy.com/media/5P0ddDiKzMwIKQ7Bmq/giphy.gif",
  ],
  wedding: [
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/xT0GqtpF1NWd9VbstO/giphy.gif",
    "https://media.giphy.com/media/l3q2zbskZp2j8wniE/giphy.gif",
    "https://media.giphy.com/media/26uf9QPzzlKPvQG5y/giphy.gif",
    "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
    "https://media.giphy.com/media/26BRrSvJeNeAxa4La/giphy.gif",
  ],
  new_baby: [
    "https://media.giphy.com/media/26xBI73gWquCBBCDe/giphy.gif",
    "https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif",
    "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",
    "https://media.giphy.com/media/3o7abBP0nMjrdIgSD2/giphy.gif",
    "https://media.giphy.com/media/26ufp9EIXL5RLKJK8/giphy.gif",
    "https://media.giphy.com/media/xT9IgG50Lg7rusUxVm/giphy.gif",
  ],
  work_anniversary: [
    "https://media.giphy.com/media/3oEdvd7Fz3PzN4fcHK/giphy.gif",
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    "https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif",
    "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
    "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
    "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
  ],
  promotion: [
    "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif",
    "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
    "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
    "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
    "https://media.giphy.com/media/xT9IgG50Lg7rusUxVm/giphy.gif",
    "https://media.giphy.com/media/26BRrSvJeNeAxa4La/giphy.gif",
  ],
  get_well: [
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/3ohs4wE4DqXw84xAMo/giphy.gif",
    "https://media.giphy.com/media/5P0ddDiKzMwIKQ7Bmq/giphy.gif",
    "https://media.giphy.com/media/xT0GqtpF1NWd9VbstO/giphy.gif",
    "https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif",
    "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",
  ],
  new_hire: [
    "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    "https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif",
    "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    "https://media.giphy.com/media/3oEdvd7Fz3PzN4fcHK/giphy.gif",
    "https://media.giphy.com/media/xT9IgG50Lg7rusUxVm/giphy.gif",
  ],
  personal_achievement: [
    "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif",
    "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
    "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
    "https://media.giphy.com/media/l3q2zbskZp2j8wniE/giphy.gif",
    "https://media.giphy.com/media/26uf9QPzzlKPvQG5y/giphy.gif",
    "https://media.giphy.com/media/3o7abBP0nMjrdIgSD2/giphy.gif",
  ],
};

const AUTO_MESSAGES: Record<string, { label: string; text: string }[]> = {
  birthday: [
    { label: "Warm wish", text: "Wishing you a wonderful birthday filled with joy and laughter!" },
    { label: "Team love", text: "The whole team is cheering for you today. Happy Birthday!" },
    { label: "Fun one", text: "Another year wiser, another year more awesome. Happy Birthday!" },
    { label: "Heartfelt", text: "So grateful to have you on the team. Hope your day is amazing!" },
    { label: "Short & sweet", text: "Happy Birthday! Hope it's a great one." },
    { label: "Milestone", text: "Celebrating you today and every day. Happy Birthday!" },
  ],
  wedding: [
    { label: "Congratulations", text: "Wishing you both a lifetime of happiness and love. Congratulations!" },
    { label: "Team toast", text: "The whole team is raising a glass to you both. Cheers!" },
    { label: "Joy-filled", text: "May your marriage be filled with laughter, love, and endless adventures!" },
    { label: "Heartfelt", text: "So happy for you both. This is just the beginning of something beautiful." },
    { label: "Classic", text: "Congratulations on your wedding! Wishing you all the best." },
    { label: "Work fam", text: "You're gaining a partner and keeping your work family. Congrats!" },
  ],
  new_baby: [
    { label: "Welcome", text: "Welcome to the world, little one! Congratulations to the whole family!" },
    { label: "Team hug", text: "The team is over the moon for you. Congrats on the new arrival!" },
    { label: "Joyful", text: "A new baby means new adventures. Congrats and enjoy every moment!" },
    { label: "Heartfelt", text: "So excited for this new chapter of your life. Congratulations!" },
    { label: "Classic", text: "Congratulations on your new baby! Wishing your family all the best." },
    { label: "Warm", text: "Sending so much love to your growing family. Congratulations!" },
  ],
  work_anniversary: [
    { label: "Milestone", text: "What a journey it's been! Thank you for all you bring to the team." },
    { label: "Grateful", text: "Year after year, you show up and make a difference. We're lucky to have you." },
    { label: "Celebratory", text: "Another year of awesomeness! Here's to many more together." },
    { label: "Reflective", text: "It's amazing what we've built together. Happy work anniversary!" },
    { label: "Fun", text: "Still here, still crushing it. Happy work anniversary!" },
    { label: "Team love", text: "The team wouldn't be the same without you. Happy anniversary!" },
  ],
  promotion: [
    { label: "Congrats", text: "This is so well deserved. Congratulations on the promotion!" },
    { label: "Team pride", text: "We always knew you'd get here. So proud of you!" },
    { label: "Inspired", text: "You inspire us all with your dedication. Congrats on leveling up!" },
    { label: "Excited", text: "The next chapter is going to be incredible. Congratulations!" },
    { label: "Brief", text: "Congrats on the promotion! Can't wait to see what you do next." },
    { label: "Warm", text: "Nobody deserves this more. Wishing you all the best in your new role!" },
  ],
  get_well: [
    { label: "Caring", text: "Sending healing thoughts your way. Take good care of yourself!" },
    { label: "Team support", text: "The whole team is rooting for a speedy recovery. We miss you!" },
    { label: "Warm", text: "Rest up and get better soon. We'll hold things down until you're back." },
    { label: "Hopeful", text: "Wishing you strength and a swift recovery. Thinking of you!" },
    { label: "Gentle", text: "Take all the time you need to heal. We'll be here when you're ready." },
    { label: "Supportive", text: "Sending you good energy and warm wishes for a quick recovery." },
  ],
  new_hire: [
    { label: "Welcome", text: "Welcome to Applied! So excited to have you on the team." },
    { label: "Team hug", text: "The team has been looking forward to meeting you. Welcome!" },
    { label: "Warm", text: "You're going to love it here. Welcome aboard!" },
    { label: "Excited", text: "We can't wait to see everything you bring to the table. Welcome!" },
    { label: "Fun", text: "Fair warning: this team is a little extra. Welcome to the family!" },
    { label: "Heartfelt", text: "So glad you chose Applied. Looking forward to building great things together." },
  ],
  personal_achievement: [
    { label: "Proud", text: "This is a huge deal and you should be so proud. Congrats!" },
    { label: "Inspired", text: "You set a goal and you crushed it. That's incredibly inspiring." },
    { label: "Team cheer", text: "The team is cheering loud for you. What an achievement!" },
    { label: "Motivating", text: "This is what dedication looks like. Congratulations on your achievement!" },
    { label: "Brief", text: "You did it! So happy for you. Well deserved." },
    { label: "Warm", text: "It takes grit to reach this level. So proud of everything you've accomplished." },
  ],
};

const BADGE_META: Record<string, { icon: string; color: string; label: string }> = {
  team_player:      { icon: "🤝", color: "#6366f1", label: "Team Player" },
  hype_person:      { icon: "📣", color: "#ec4899", label: "Hype Person" },
  culture_add:      { icon: "✨", color: "#f59e0b", label: "Culture Add" },
  early_bird:       { icon: "🌅", color: "#10b981", label: "Early Bird" },
  creative_spark:   { icon: "💡", color: "#8b5cf6", label: "Creative Spark" },
  people_first:     { icon: "💛", color: "#f97316", label: "People First" },
  milestone_maker:  { icon: "🏆", color: "#0ea5e9", label: "Milestone Maker" },
};

const REACTIONS = ["❤️","🎉","🙌","😂","🔥","😍","👏","💯","🥳","✨"];

const VALUE_CONFETTI: Record<string, string[]> = {
  "Win Together":      ["#1558D6","#93B4FF","#EDF2FC","#ffffff"],
  "Be Bold":          ["#1558D6","#F59E0B","#FEF3C7","#ffffff"],
  "Move with Urgency":["#1558D6","#10B981","#D1FAE5","#ffffff"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = url;
  });
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, color, size = 8 }: { name: string; color: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ backgroundColor: color, width: size * 4, height: size * 4, fontSize: size * 1.5 }}>
      {initials(name)}
    </div>
  );
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(dateStr: string) {
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return fmtDate(dateStr);
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(dateStr);
}

const QUICK_REACTS = ["❤️","🔥","🙌","😂","👏","🎉"];

function PostReactions({ post, onUpdate }: { post: Post; onUpdate?: () => Promise<void> }) {
  const [reactions, setReactions] = useState<Record<string, number>>(
    () => { try { return JSON.parse(post.reactions_json ?? "{}"); } catch { return {}; } }
  );
  const [animating, setAnimating] = useState<string | null>(null);

  async function react(emoji: string) {
    setAnimating(emoji);
    setTimeout(() => setAnimating(null), 400);
    const res = await fetch(`/api/boards/${post.board_id}/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const d = await res.json();
      setReactions(d.reactions ?? {});
      await onUpdate?.();
    }
  }

  const hasAny = Object.values(reactions).some(v => v > 0);
  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {QUICK_REACTS.map(e => {
        const count = reactions[e] ?? 0;
        return (
          <button key={e} onClick={() => react(e)}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${animating === e ? "scale-125" : ""}`}
            style={count > 0
              ? { background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--accent)" }
              : { background: "transparent", border: "1px solid var(--border)", color: "var(--muted)" }}>
            <span>{e}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Post Tile (full, used in wall view + receiver view) ─────────────────────
function PostTile({ post, onUpdate }: { post: Post; onUpdate?: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [editMsg, setEditMsg] = useState(post.message ?? "");
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/boards/${post.board_id}/posts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, message: editMsg }),
    });
    setSaving(false);
    setEditing(false);
    await onUpdate?.();
  }

  const editBtn = onUpdate && !post.is_manager_note ? (
    <button onClick={() => { setEditMsg(post.message ?? ""); setEditing(true); }}
      className="ml-auto text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
      Edit
    </button>
  ) : null;

  const editBox = (
    <div className="mt-2 space-y-1.5">
      <textarea value={editMsg} onChange={e => setEditMsg(e.target.value)} rows={3}
        className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
        style={{ border: "1px solid var(--accent)" }} />
      <div className="flex gap-1.5">
        <button onClick={saveEdit} disabled={saving}
          className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-50"
          style={{ background: "var(--accent)" }}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => setEditing(false)}
          className="px-3 py-1 text-xs rounded-lg"
          style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
          Cancel
        </button>
      </div>
    </div>
  );

  if (post.is_manager_note) {
    return (
      <div className="relative rounded-2xl p-5 text-white break-inside-avoid mb-4"
        style={{ background: "var(--accent)" }}>
        <span className="absolute top-3 right-3 text-lg">📌</span>
        <div className="flex items-center gap-2 mb-3">
          <Avatar name={post.author_name} color="rgba(255,255,255,0.25)" size={8} />
          <div>
            <p className="font-semibold text-sm">{post.author_name}</p>
            <p className="text-xs opacity-70">Manager note</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed">{post.message}</p>
        {post.reaction && <p className="mt-3 text-xl">{post.reaction}</p>}
      </div>
    );
  }
  if (post.photo_url) {
    return (
      <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <img src={post.photo_url} alt="Post photo" className="w-full object-cover max-h-64" />
        <div className="flex items-center gap-2 p-3">
          <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{post.author_name}</p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>{timeAgo(post.created_at)}</p>
          </div>
          {post.reaction && <span className="ml-auto text-lg">{post.reaction}</span>}
          {editBtn}
        </div>
        {editing && <div className="px-3 pb-3">{editBox}</div>}
      </div>
    );
  }
  if (post.gif_url) {
    return (
      <div className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <img src={post.gif_url} alt={post.gif_title ?? "GIF"} className="w-full object-cover max-h-56" />
        <div className="flex items-center gap-2 p-3">
          <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{post.author_name}</p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>{timeAgo(post.created_at)}</p>
          </div>
          {post.reaction && <span className="ml-auto text-lg">{post.reaction}</span>}
          {editBtn}
        </div>
        {editing && <div className="px-3 pb-3">{editBox}</div>}
      </div>
    );
  }
  if (post.audio_url) {
    return (
      <div className="group rounded-2xl p-4 break-inside-avoid mb-4 shadow-sm hover:shadow-md transition-shadow" style={{ background: "var(--accent-light)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎙</span>
          <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>Voice message</span>
          {editBtn}
        </div>
        <audio controls src={post.audio_url} className="w-full h-8" />
        <div className="flex items-center gap-2 mt-3">
          <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{post.author_name}</p>
          <p className="text-xs ml-auto" style={{ color: "var(--muted)" }}>{timeAgo(post.created_at)}</p>
        </div>
        {editing && editBox}
      </div>
    );
  }
  return (
    <div className="group rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{post.author_name}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(post.created_at)}</p>
        </div>
        {post.values_tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "var(--accent-light)", color: "var(--muted)", border: "1px solid var(--border-light)" }}>
            {post.values_tag}
          </span>
        )}
        {editBtn}
      </div>
      {editing ? editBox : (
        <>
          {post.message && <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text)" }}>{post.message}</p>}
          {post.reaction && <p className="mt-2 text-xl">{post.reaction}</p>}
          <PostReactions post={post} onUpdate={onUpdate} />
        </>
      )}
    </div>
  );
}

// ─── Cheer Snippet (highlights view — always expanded) ────────────────────────
function CheerSnippet({ post, onUpdate }: { post: Post; onUpdate?: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [editMsg, setEditMsg] = useState(post.message ?? "");
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/boards/${post.board_id}/posts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, message: editMsg }),
    });
    setSaving(false);
    setEditing(false);
    await onUpdate?.();
  }

  return (
    <div className="group rounded-xl p-4 shadow-sm transition-all hover:shadow-md"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Avatar name={post.author_name} color={post.author_avatar_color} size={8} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{post.author_name}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(post.created_at)}</p>
        </div>
        {post.values_tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "var(--accent-light)", color: "var(--muted)", border: "1px solid var(--border-light)" }}>
            {post.values_tag}
          </span>
        )}
        {post.reaction && <span className="text-base flex-shrink-0">{post.reaction}</span>}
        {onUpdate && !editing && (
          <button onClick={() => { setEditMsg(post.message ?? ""); setEditing(true); }}
            className="text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--muted)", border: "1px solid var(--border)" }}>
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          <textarea value={editMsg} onChange={e => setEditMsg(e.target.value)} rows={3}
            className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
            style={{ border: "1px solid var(--accent)" }} />
          <div className="flex gap-1.5">
            <button onClick={saveEdit} disabled={saving}
              className="px-3 py-1 text-xs text-white rounded-lg disabled:opacity-50"
              style={{ background: "var(--accent)" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1 text-xs rounded-lg"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.message && <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{post.message}</p>}
          {post.photo_url && <img src={post.photo_url} alt="Photo" className="w-full rounded-lg object-cover max-h-48 mt-2" />}
          {post.gif_url && <img src={post.gif_url} alt="GIF" className="w-full rounded-lg object-cover max-h-40 mt-2" />}
          {post.audio_url && <audio controls src={post.audio_url} className="w-full h-8 mt-2" />}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view") ?? "board";

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const confettiFired = useRef(false);

  // Toast + mobile composer sheet
  const [toast, setToast] = useState<string | null>(null);
  const [showComposerSheet, setShowComposerSheet] = useState(false);
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  // Composer state
  const [tab, setTab] = useState<"text" | "gif" | "photo" | "voice">("text");
  const [message, setMessage] = useState("");
  const [reaction, setReaction] = useState("");
  const [selectedGif, setSelectedGif] = useState<{ url: string; title: string } | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [gifQuery, setGifQuery] = useState("celebration");
  const [gifResults, setGifResults] = useState<{url: string; title: string}[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [valueTag, setValueTag] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [recapText, setRecapText] = useState<string | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manager view state
  const [managerNote, setManagerNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Badge modal state
  const [badgeModal, setBadgeModal] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ person_name: "", person_email: "", badge_type: "team_player", reason: "" });
  const [badgeLoading, setBadgeLoading] = useState(false);

  async function searchGifs(q: string) {
    setGifLoading(true);
    try {
      const res = await fetch(`/api/gif-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setGifResults(data.gifs ?? []);
    } finally {
      setGifLoading(false);
    }
  }

  const fetchBoard = useCallback(async () => {
    const res = await fetch(`/api/boards/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setBoard(data.board);
    setPosts(data.posts);
    setBadges(data.badges);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    if (tab === "gif" && gifResults.length === 0 && !gifLoading) {
      searchGifs(gifQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!loading && !confettiFired.current) {
      confettiFired.current = true;
      setTimeout(() => confetti({ particleCount: 60, spread: 70, origin: { x: 0.2, y: 0.5 } }), 0);
      setTimeout(() => confetti({ particleCount: 60, spread: 70, origin: { x: 0.8, y: 0.5 } }), 300);
      setTimeout(() => confetti({ particleCount: 40, spread: 90, origin: { x: 0.5, y: 0.3 } }), 600);
    }
  }, [loading]);

  // ── Recording ─────────────────────────────────────────────────────────────
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRecRef.current = mr;
    setRecording(true);
    setRecSeconds(0);
    let secs = 0;
    recTimerRef.current = setInterval(() => {
      secs++;
      setRecSeconds(secs);
      if (secs >= 60) {
        clearInterval(recTimerRef.current!);
        mr.stop();
        setRecording(false);
      }
    }, 1000);
  }

  function stopRecording() {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    mediaRecRef.current?.stop();
    setRecording(false);
  }

  // ── Photo handler ─────────────────────────────────────────────────────────
  async function handlePhotoFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const compressed = await compressImage(file);
    setPhotoData(compressed);
  }

  // ── Submit post ───────────────────────────────────────────────────────────
  async function submitPost() {
    if (!authorName.trim()) return;
    setPosting(true);
    let audio_url: string | null = null;
    if (audioBlob) {
      const reader = new FileReader();
      audio_url = await new Promise(res => {
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });
    }
    const body: Record<string, unknown> = {
      author_name: anonymous ? "A teammate" : authorName.trim(),
      author_email: anonymous ? null : (authorEmail.trim() || null),
      author_avatar_color: anonymous ? "#545454" : `hsl(${Math.floor(Math.random() * 360)},70%,50%)`,
      reaction: reaction || null,
    };
    if (tab === "text" || (!selectedGif && !photoData && !audio_url)) {
      body.message = message.trim() || null;
    }
    if (selectedGif) { body.gif_url = selectedGif.url; body.gif_title = selectedGif.title; }
    if (photoData) body.photo_url = photoData;
    if (audio_url) body.audio_url = audio_url;
    if (valueTag) body.values_tag = valueTag;

    const res = await fetch(`/api/boards/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const confettiColors = VALUE_CONFETTI[valueTag] ?? VALUE_CONFETTI["Win Together"];
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: confettiColors });
      setMessage(""); setReaction(""); setSelectedGif(null); setPhotoData(null);
      setAudioBlob(null); setAudioUrl(null); setTab("text"); setValueTag(""); setAnonymous(false);
      setShowComposerSheet(false);
      showToast("Cheer posted 🎉");
      await fetchBoard();
    }
    setPosting(false);
  }

  // ── Manager note submit ───────────────────────────────────────────────────
  async function submitManagerNote() {
    if (!managerNote.trim()) return;
    setSavingNote(true);
    await fetch(`/api/boards/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "Manager",
        author_avatar_color: "#6366f1",
        message: managerNote.trim(),
        is_manager_note: true,
      }),
    });
    setManagerNote("");
    setSavingNote(false);
    await fetchBoard();
  }

  // ── Give Badge ────────────────────────────────────────────────────────────
  async function giveBadge(e: React.FormEvent) {
    e.preventDefault();
    setBadgeLoading(true);
    try {
      await fetch(`/api/boards/${id}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeForm),
      });
      setBadgeModal(false);
      setBadgeForm({ person_name: "", person_email: "", badge_type: "team_player", reason: "" });
      showToast("Badge awarded 🏅");
      fetchBoard();
    } finally {
      setBadgeLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">🎉</div>
        <p style={{ color: "var(--muted)" }}>Loading the board…</p>
      </div>
    </div>
  );
  if (!board) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <p style={{ color: "var(--muted)" }}>Board not found.</p>
    </div>
  );

  const autoMsgs = AUTO_MESSAGES[board.type] ?? AUTO_MESSAGES.birthday;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${board.share_token}` : "";
  const managerNotePost = posts.find(p => p.is_manager_note);
  const posters = [...new Set(posts.filter(p => !p.is_manager_note).map(p => p.author_name))];

  const views = [
    { key: "board", label: "🎉 The Board" },
    { key: "manager", label: "👥 Manager View" },
    { key: "receiver", label: "🌟 Your Board" },
  ];

  // Composer content — shared between the desktop sidebar and the mobile bottom sheet
  const composerContent = (
    <>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["text","gif","photo","voice"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-base transition-colors"
            style={tab === t
              ? { borderBottom: "2px solid var(--accent)", background: "var(--accent-light)" }
              : { color: "var(--muted)" }}>
            {t === "text" ? "💬" : t === "gif" ? "🎞" : t === "photo" ? "📷" : "🎙"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* TEXT TAB */}
        {tab === "text" && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {autoMsgs.map(m => (
                <button key={m.label} onClick={() => setMessage(m.text)}
                  className="px-2 py-1 rounded-full text-xs transition-colors"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                  {m.label}
                </button>
              ))}
            </div>
            {/* AI Message Generator */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--accent-light)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>✨ AI-generated cheer</p>
              <input value={aiContext} onChange={e => setAiContext(e.target.value)}
                placeholder="Optional: add context (e.g. 'worked on the sensor team')"
                className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" }} />
              <button disabled={aiLoading}
                onClick={async () => {
                  setAiLoading(true);
                  const res = await fetch(`/api/boards/${id}/ai-message`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ milestone_type: board?.type, honoree_name: board?.honoree_name, sender_context: aiContext }),
                  });
                  const d = await res.json();
                  if (d.message) setMessage(d.message);
                  setAiLoading(false);
                }}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)" }}>
                {aiLoading ? "Generating…" : "Generate a cheer"}
              </button>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Write your message…" rows={3}
              className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
              style={{ border: "1px solid var(--border)", outline: "none" }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px var(--accent)"}
              onBlur={e => e.target.style.boxShadow = ""} />
            <div className="flex flex-wrap gap-1">
              {REACTIONS.map(r => (
                <button key={r} onClick={() => setReaction(reaction === r ? "" : r)}
                  className="text-lg p-1 rounded-lg transition-colors"
                  style={reaction === r ? { background: "var(--accent-light)" } : {}}>
                  {r}
                </button>
              ))}
            </div>
          </>
        )}

        {/* GIF TAB */}
        {tab === "gif" && (
          <div className="space-y-2">
            <form onSubmit={e => { e.preventDefault(); searchGifs(gifQuery); }} className="flex gap-1.5">
              <input
                value={gifQuery}
                onChange={e => setGifQuery(e.target.value)}
                placeholder="Search GIFs…"
                className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none"
                style={{ border: "1px solid var(--border)" }} />
              <button type="submit"
                className="px-3 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}>
                {gifLoading ? "…" : "Go"}
              </button>
            </form>
            {gifLoading ? (
              <div className="flex items-center justify-center h-32 text-2xl animate-bounce">🎞</div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto">
                {gifResults.map((gif, i) => (
                  <button key={i} onClick={() => { setSelectedGif(gif); setTab("text"); }}
                    className="aspect-square rounded-lg overflow-hidden transition-all"
                    style={{ outline: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}>
                    <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                  </button>
                ))}
                {gifResults.length === 0 && !gifLoading && (
                  <p className="col-span-3 text-center text-xs py-8" style={{ color: "var(--muted)" }}>No GIFs found. Try a different search.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* PHOTO TAB */}
        {tab === "photo" && (
          <>
            {!photoData ? (
              <label
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) await handlePhotoFile(f); }}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl h-32 cursor-pointer transition-colors"
                style={{ borderColor: isDragging ? "var(--accent)" : "var(--border)", background: isDragging ? "var(--accent-light)" : "transparent" }}>
                <span className="text-2xl">📷</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>Drag & drop or click to choose</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={async e => { if (e.target.files?.[0]) await handlePhotoFile(e.target.files[0]); }} />
              </label>
            ) : (
              <div className="relative">
                <img src={photoData} alt="Preview" className="w-full rounded-xl object-cover max-h-48" />
                <button onClick={() => setPhotoData(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        {/* VOICE TAB */}
        {tab === "voice" && (
          <div className="flex flex-col items-center gap-3 py-2">
            {!audioUrl ? (
              <>
                {recording ? (
                  <>
                    <div className="flex items-end gap-1 h-10">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-1.5 rounded-full animate-pulse"
                          style={{ height: `${20 + (i % 3) * 10}px`, animationDelay: `${i * 0.1}s`, background: "var(--accent)" }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{recSeconds}s / 60s</p>
                    <button onClick={stopRecording}
                      className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors">
                      ⏹ Stop
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startRecording}
                      className="px-4 py-2 text-white rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                      style={{ background: "var(--accent)" }}>
                      🎙 Start Recording
                    </button>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Max 60s</p>
                  </>
                )}
              </>
            ) : (
              <div className="w-full space-y-2">
                <audio controls src={audioUrl} className="w-full h-8" />
                <div className="flex gap-2">
                  <button onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                    className="flex-1 py-1.5 text-xs rounded-lg"
                    style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                    Re-record
                  </button>
                  <button onClick={() => setTab("text")}
                    className="flex-1 py-1.5 text-xs text-white rounded-lg"
                    style={{ background: "var(--accent)" }}>
                    Use this ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected GIF preview (shown on text tab) */}
        {selectedGif && tab === "text" && (
          <div className="relative">
            <img src={selectedGif.url} alt={selectedGif.title} className="w-full rounded-xl max-h-32 object-cover" />
            <button onClick={() => setSelectedGif(null)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Value badge — optional */}
        <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>Tag a value <span className="opacity-60">(optional)</span></p>
          <div className="flex gap-1.5 flex-wrap">
            {["Win Together", "Be Bold", "Move with Urgency"].map(v => (
              <button key={v} type="button"
                onClick={() => setValueTag(valueTag === v ? "" : v)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={valueTag === v
                  ? { background: "var(--accent)", color: "#fff" }
                  : { background: "var(--accent-light)", color: "var(--accent)" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Author + Post */}
        <div className="space-y-2">
          {!anonymous && <>
            <input value={authorName} onChange={e => setAuthorName(e.target.value)}
              placeholder="Your name (required)"
              className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
              style={{ border: "1px solid var(--border)" }} />
            <input value={authorEmail} onChange={e => setAuthorEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
              style={{ border: "1px solid var(--border)" }} />
          </>}
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--muted)" }}>
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded" />
            Post anonymously
          </label>
          <button onClick={submitPost} disabled={posting || !authorName.trim()}
            className="w-full py-2.5 text-white rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)" }}>
            {posting ? "Posting…" : "Post 🎉"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Sub-nav */}
      <div className="sticky top-0 z-30 backdrop-blur px-4 py-3 flex items-center gap-3"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => router.push("/")} className="text-lg mr-1" style={{ color: "var(--muted)" }}>←</button>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate text-sm" style={{ color: "var(--text)" }}>{board.title}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>For {board.honoree_name}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(shareUrl); showToast("Link copied"); }}
          className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors"
          style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
          🔗 Share
        </button>
        <div className="flex gap-1 flex-shrink-0">
          {views.map(v => (
            <button key={v.key}
              onClick={() => router.push(`/board/${id}?view=${v.key}`)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={view === v.key
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--accent-light)", color: "var(--accent)" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOARD VIEW ─────────────────────────────────────────────── */}
      {view === "board" && (
        <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
          {/* Left: highlights or full wall */}
          <div className="flex-1 min-w-0">
            {/* Event collation header */}
            <div className="rounded-2xl p-6 mb-5"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl flex-shrink-0 mt-1">{TYPE_EMOJI[board.type] ?? "🎉"}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-extrabold text-3xl leading-tight">{board.title}</h1>
                  {board.description && (
                    <p className="text-xl font-medium mt-2 opacity-90 leading-snug">{board.description}</p>
                  )}
                  <p className="text-sm opacity-60 mt-2">{board.honoree_name} · {board.values_tag}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold">{posts.filter(p => !p.is_manager_note).length}</p>
                  <p className="text-xs opacity-60">cheers</p>
                </div>
              </div>
            </div>

            {/* Toggle between highlights and full wall */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {showAllPosts ? "All messages" : "Highlights"} · {posts.filter(p => !p.is_manager_note).length} contributions
              </p>
              <button
                onClick={() => setShowAllPosts(s => !s)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                {showAllPosts ? "↑ Collapse" : "View all messages →"}
              </button>
            </div>

            {/* Manager note always shown first */}
            {managerNotePost && <PostTile post={managerNotePost} onUpdate={fetchBoard} />}

            {posts.filter(p => !p.is_manager_note).length === 0 && (
              <div className="text-center py-16" style={{ color: "var(--muted)" }}>
                <p className="text-4xl mb-2">✉️</p>
                <p>No cheers yet. Be the first!</p>
              </div>
            )}

            {/* Highlights masonry (default) */}
            {!showAllPosts && (
              <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
                {posts.filter(p => !p.is_manager_note).map(p => (
                  <div key={p.id} className="break-inside-avoid mb-4">
                    <CheerSnippet post={p} onUpdate={fetchBoard} />
                  </div>
                ))}
              </div>
            )}

            {/* Full masonry wall */}
            {showAllPosts && (
              <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
                {posts.filter(p => !p.is_manager_note).map(p => (
                  <div key={p.id} className="break-inside-avoid mb-4">
                    <PostTile post={p} onUpdate={fetchBoard} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer sidebar (desktop) */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <div className="rounded-2xl shadow-sm overflow-hidden sticky top-20" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Leave a cheer</p>
              </div>
              {composerContent}
            </div>
          </div>

          {/* Mobile: floating action button */}
          {!showComposerSheet && (
            <button onClick={() => setShowComposerSheet(true)}
              className="md:hidden fixed bottom-6 right-5 z-40 px-5 py-3.5 rounded-full text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}>
              ＋ Add cheer
            </button>
          )}

          {/* Mobile: composer bottom sheet */}
          {showComposerSheet && (
            <div className="md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }}
                onClick={() => setShowComposerSheet(false)} />
              <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-xl"
                style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
                <div className="sticky top-0 pt-3 pb-2 px-4" style={{ background: "var(--card)" }}>
                  <div className="mx-auto w-10 h-1 rounded-full mb-3" style={{ background: "var(--border)" }} />
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Leave a cheer</p>
                    <button onClick={() => setShowComposerSheet(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                      style={{ background: "var(--accent-light)", color: "var(--muted)" }}>
                      ✕
                    </button>
                  </div>
                </div>
                {composerContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANAGER VIEW ───────────────────────────────────────────── */}
      {view === "manager" && (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>👥 Manager View</h2>

          {/* Manager note */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>📌 Manager Note</p>
            {managerNotePost ? (
              <div className="rounded-xl p-4 text-white text-sm" style={{ background: "var(--accent)" }}>
                {managerNotePost.message}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={managerNote} onChange={e => setManagerNote(e.target.value)}
                  placeholder="Pin a personal note at the top of the board…" rows={3}
                  className="w-full text-sm rounded-xl px-3 py-2 resize-none focus:outline-none"
                  style={{ border: "1px solid var(--border)" }} />
                <button onClick={submitManagerNote} disabled={savingNote || !managerNote.trim()}
                  className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)" }}>
                  {savingNote ? "Saving…" : "Pin Note"}
                </button>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={() => setBadgeModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-light)" }}>
                🏅 Give Badge
              </button>
            </div>
          </div>

          {/* Team participation checklist */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>✅ Team Participation</p>
            <div className="space-y-2">
              {EXPECTED_TEAM.map(name => {
                const posted = posters.includes(name);
                return (
                  <div key={name} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: posted ? "#ECFDF5" : "var(--bg)" }}>
                    <span className="text-lg">{posted ? "✅" : "⬜"}</span>
                    <span className="text-sm" style={{ color: "var(--text)" }}>{name}</span>
                    {posted && <span className="ml-auto text-xs text-emerald-600 font-medium">Posted</span>}
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>{posters.length} / {EXPECTED_TEAM.length} team members posted</p>
          </div>

          {/* AI Recap */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>✨ AI Highlights Recap</p>
            {recapText ? (
              <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: "var(--accent-light)", color: "var(--text)" }}>
                {recapText}
              </div>
            ) : (
              <button disabled={recapLoading}
                onClick={async () => {
                  setRecapLoading(true);
                  const res = await fetch(`/api/boards/${id}/ai-recap`, { method: "POST" });
                  const d = await res.json();
                  setRecapText(d.recap);
                  setRecapLoading(false);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)" }}>
                {recapLoading ? "Generating recap…" : "Generate AI highlights summary"}
              </button>
            )}
            {recapText && (
              <button onClick={() => setRecapText(null)} className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                Regenerate
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.print()}
              className="py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--bg)" }}>
              🖨️ Print / Save PDF
            </button>
            <a
              href={`/api/boards/${id}/export`}
              className="py-3 rounded-xl text-sm font-medium text-center transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--bg)" }}>
              📊 Export CSV
            </a>
            <button
              onClick={async () => {
                const res = await fetch(`/api/boards/${id}/slack`, { method: "POST" });
                const d = await res.json();
                showToast(d.stub ? `Slack not configured: ${d.message}` : d.sent ? "Posted to Slack!" : `Failed: ${d.error}`);
              }}
              className="py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--bg)" }}>
              💬 Post to Slack
            </button>
            <button
              onClick={async () => {
                const res = await fetch(`/api/boards/${id}/notify`, { method: "POST" });
                const d = await res.json();
                showToast(d.stub ? `Email stub, would send: ${d.preview?.subject ?? "notification"}` : d.sent ? "Email sent!" : `Failed: ${d.error}`);
              }}
              className="py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--bg)" }}>
              ✉️ Notify Honoree
            </button>
          </div>
          <button
            onClick={() => showToast("Workday export coming soon")}
            className="w-full py-3 rounded-2xl text-sm font-medium transition-colors"
            style={{ border: "2px dashed var(--border)", color: "var(--accent)" }}>
            📤 Export to Workday (stub)
          </button>
        </div>
      )}

      {/* ── RECEIVER VIEW ──────────────────────────────────────────── */}
      {view === "receiver" && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden p-8 text-white text-center"
            style={{ background: "var(--accent)" }}>
            <div className="mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-bold bg-white/20"
              style={{ width: 80, height: 80 }}>
              {initials(board.honoree_name)}
            </div>
            <h1 className="text-2xl font-bold mb-1">{board.title}</h1>
            <p className="text-white/80 text-sm mb-6">{board.honoree_name} · {board.values_tag}</p>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{posts.filter(p => !p.is_manager_note).length}</p>
                <p className="text-xs text-white/70">Messages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{badges.length}</p>
                <p className="text-xs text-white/70">Badges</p>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(shareUrl); showToast("Link copied"); }}
              className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors">
              🔗 Share Board
            </button>
          </div>

          {/* Badges showcase */}
          {badges.length > 0 && (
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="font-semibold mb-3" style={{ color: "var(--text)" }}>🏅 Your Badges</p>
              <div className="flex flex-wrap gap-2">
                {badges.map(b => {
                  const meta = BADGE_META[b.badge_type] ?? { icon: "⭐", color: "#1557FF", label: b.badge_type };
                  return (
                    <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ backgroundColor: meta.color + "15", border: `1px solid ${meta.color}30` }}>
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{b.person_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-3">
            <p className="font-semibold" style={{ color: "var(--text)" }}>💌 All cheers from your team</p>
            {posts.map(p => <PostTile key={p.id} post={p} onUpdate={fetchBoard} />)}
            {posts.length === 0 && (
              <div className="text-center py-10" style={{ color: "var(--muted)" }}>
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">No messages yet. Share the board link!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Give Badge Modal */}
      {badgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>🏅 Give a Badge</h2>
              <button onClick={() => setBadgeModal(false)} className="text-xl" style={{ color: "var(--muted)" }}>×</button>
            </div>
            <form onSubmit={giveBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Recipient name *</label>
                <input required type="text" value={badgeForm.person_name}
                  onChange={e => setBadgeForm(f => ({ ...f, person_name: e.target.value }))}
                  placeholder="e.g. Alex Johnson"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Recipient email</label>
                <input type="email" value={badgeForm.person_email}
                  onChange={e => setBadgeForm(f => ({ ...f, person_email: e.target.value }))}
                  placeholder="alex@company.com"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Badge type *</label>
                <select required value={badgeForm.badge_type}
                  onChange={e => setBadgeForm(f => ({ ...f, badge_type: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                  <option value="team_player">🤝 Team Player</option>
                  <option value="cheer_champion">📣 Cheer Champion</option>
                  <option value="birthday_star">🎂 Birthday Star</option>
                  <option value="rising_star">⭐ Rising Star</option>
                  <option value="generous_soul">💛 Generous Soul</option>
                  <option value="milestone_maker">🏆 Milestone Maker</option>
                  <option value="culture_carrier">🌟 Culture Carrier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Reason (optional)</label>
                <textarea rows={2} value={badgeForm.reason}
                  onChange={e => setBadgeForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Why are you giving this badge?"
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setBadgeModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={badgeLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)" }}>
                  {badgeLoading ? "Awarding…" : "Award Badge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: "var(--text)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
