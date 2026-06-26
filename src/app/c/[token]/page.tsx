"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

interface Board {
  id: string; honoree_name: string; honoree_avatar_color: string;
  type: string; title: string; description: string; values_tag: string;
  expires_at: string; share_token: string;
}
interface Post {
  id: string; author_name: string; author_avatar_color: string;
  message: string; gif_url: string; reaction: string; is_manager_note: number; created_at: string;
}
interface Gift { id: string; from_name: string; amount: number; status: string; }

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<{ board: Board; posts: Post[]; gifts: Gift[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎉</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center" style={{ background: "var(--bg)" }}>
        <div>
          <div className="text-7xl mb-6">😢</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Board not found</h1>
          <p className="text-gray-500 max-w-sm">This board doesn't exist or isn't shared publicly.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { board, posts, gifts } = data;
  const approvedHrs = gifts.filter((g) => g.status === "approved").reduce((s, g) => s + g.amount, 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Minimal header */}
      <div className="px-4 py-3 border-b bg-white flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <span className="text-xl">🎉</span>
        <span className="font-bold text-gray-700 text-sm">Cheers from Applied</span>
        <span className="text-gray-300 text-sm ml-auto">Shared board</span>
      </div>

      {/* Hero */}
      <div
        className="py-12 px-4 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${board.honoree_avatar_color}dd, #ec4899cc)` }}
      >
        <div className="text-5xl mb-4">{TYPE_EMOJI[board.type] ?? "🎉"}</div>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-4 border-4 border-white/50 shadow-xl"
          style={{ background: board.honoree_avatar_color }}
        >
          {initials(board.honoree_name)}
        </div>
        <p className="text-white/70 text-sm mb-1">{board.honoree_name}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{board.title}</h1>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            {board.values_tag}
          </span>
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            {posts.length} messages 💬
          </span>
          {approvedHrs > 0 && (
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
              🎁 {approvedHrs} hrs gifted
            </span>
          )}
        </div>
        {board.description && <p className="text-white/70 mt-4 max-w-lg mx-auto text-sm">{board.description}</p>}
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div style={{ columns: "2", columnGap: "1.5rem" }} className="md:columns-3">
          {posts.map((post) => (
            <div key={post.id} style={{ breakInside: "avoid", marginBottom: "1.5rem" }}>
              {post.is_manager_note === 1 ? (
                <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
                  <div className="text-xs font-bold text-white/60 mb-2">📌 Manager Note</div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: post.author_avatar_color }}>
                      {initials(post.author_name)}
                    </div>
                    <span className="text-sm font-semibold">{post.author_name}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/90">{post.message}</p>
                  {post.reaction && <div className="text-2xl mt-2">{post.reaction}</div>}
                </div>
              ) : post.gif_url ? (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: "var(--border)" }}>
                  <img src={post.gif_url} alt="gif" className="w-full object-cover" />
                  <div className="p-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: post.author_avatar_color }}>
                      {initials(post.author_name)}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{post.author_name}</span>
                    {post.message && <span className="text-xs text-gray-400 truncate">{post.message}</span>}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: post.author_avatar_color }}>
                      {initials(post.author_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{post.author_name}</div>
                      <div className="text-gray-400 text-xs">{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {post.message && <p className="text-sm text-gray-700 leading-relaxed">{post.message}</p>}
                  {post.reaction && <div className="text-2xl mt-2">{post.reaction}</div>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center border-t pt-8" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-gray-400 text-sm">Made with love at Applied</p>
        </div>
      </div>
    </div>
  );
}
