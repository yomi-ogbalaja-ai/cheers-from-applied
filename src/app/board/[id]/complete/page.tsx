import { notFound } from "next/navigation";
import CompletionConfetti from "./CompletionConfetti";

interface Board {
  id: string; title: string; honoree_name: string; honoree_avatar_color: string;
  type: string; share_token: string; values_tag: string | null;
}
interface Post {
  id: string; author_name: string; message: string | null; reaction: string | null;
  is_manager_note: number; gif_url: string | null;
}

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default async function BoardCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/boards/${id}`, { cache: "no-store" });
  if (!res.ok) notFound();

  const { board, posts, badges } = await res.json() as { board: Board; posts: Post[]; badges?: string[] };
  const cheers = posts.filter(p => !p.is_manager_note);
  const contributors = new Set(posts.map(p => p.author_name)).size;
  const managerNote = posts.find(p => p.is_manager_note);
  const typeEmoji = TYPE_EMOJI[board.type] ?? "🎉";
  const shareUrl = `${base}/c/${board.share_token}`;

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "var(--bg)" }}>
      <CompletionConfetti color={board.honoree_avatar_color} />

      {/* Hero */}
      <div className="w-full text-center py-16 px-6" style={{ background: "var(--accent-light)" }}>
        <p className="text-6xl mb-4">{typeEmoji}</p>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg"
          style={{ background: board.honoree_avatar_color }}>
          {initials(board.honoree_name)}
        </div>
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--text)" }}>
          {board.title}
        </h1>
        <p className="text-lg mb-4" style={{ color: "var(--muted)" }}>
          {cheers.length} cheer{cheers.length !== 1 ? "s" : ""} from the team
        </p>
        {board.values_tag && (
          <span className="inline-block text-sm font-medium px-4 py-1.5 rounded-full"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {board.values_tag}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="max-w-2xl w-full mx-auto mt-8 px-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-4 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>{cheers.length}</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Cheer{cheers.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>{contributors}</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Contributor{contributors !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
            {badges && badges.length > 0 ? badges.length : "🎉"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            {badges && badges.length > 0 ? `Badge${badges.length !== 1 ? "s" : ""} earned` : "Board complete"}
          </p>
        </div>
      </div>

      {/* Manager note */}
      {managerNote?.message && (
        <div className="max-w-2xl w-full mx-auto mt-10 px-6">
          <div className="rounded-2xl p-6 text-white" style={{ background: "var(--accent)" }}>
            <p className="text-xs font-semibold opacity-70 mb-2 uppercase tracking-wide">Manager note</p>
            <p className="text-base leading-relaxed">{managerNote.message}</p>
            <p className="text-xs opacity-60 mt-3">{managerNote.author_name}</p>
          </div>
        </div>
      )}

      {/* Cheer highlights */}
      <div className="max-w-2xl w-full mx-auto px-6 py-10">
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
          What the team said
        </h2>
        <div className="flex flex-col gap-4">
          {cheers.slice(0, 6).map(post => (
            <div key={post.id} className="rounded-xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: "var(--accent)" }}>
                  {post.author_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>{post.author_name}</p>
                  {post.message && <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{post.message}</p>}
                  {post.gif_url && <img src={post.gif_url} alt="GIF" className="mt-2 rounded-lg max-h-32 object-cover" />}
                  {post.reaction && <p className="text-lg mt-1">{post.reaction}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {cheers.length > 6 && (
          <p className="text-center mt-4 text-sm" style={{ color: "var(--muted)" }}>
            +{cheers.length - 6} more cheers
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="max-w-2xl w-full mx-auto px-6 pb-16 flex flex-col sm:flex-row gap-3 justify-center">
        <a href={shareUrl} target="_blank" rel="noopener noreferrer"
          className="text-center text-sm font-medium px-6 py-3 rounded-xl border transition-colors"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          View full board
        </a>
        <a href="/board/new"
          className="text-center text-sm font-medium px-6 py-3 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}>
          Create your own board
        </a>
      </div>
    </div>
  );
}
