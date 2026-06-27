"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";

interface Board {
  id: string; title: string; honoree_name: string; honoree_avatar_color: string;
  type: string; description: string | null; values_tag: string;
  public_share_enabled: number; share_token: string; expires_at: string;
}
interface Post {
  id: string; board_id: string; author_name: string; author_email: string | null;
  author_avatar_color: string; message: string | null; gif_url: string | null;
  gif_title: string | null; photo_url: string | null; audio_url: string | null;
  reaction: string | null; is_manager_note: number; values_tag: string | null;
  created_at: string;
}
interface Gift {
  id: string; status: string; amount: number;
}

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, color, size = 8 }: { name: string; color: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ backgroundColor: color, width: size * 4, height: size * 4, fontSize: size * 1.5 }}>
      {initials(name)}
    </div>
  );
}

export default function SharedBoardPage() {
  const { token } = useParams<{ token: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [notFound, setNotFound] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setBoard(data.board);
        setPosts(data.posts ?? []);
        setGifts(data.gifts ?? []);
        if (!confettiFired.current) {
          confettiFired.current = true;
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.3 },
            colors: ["#6366f1", "#ec4899", "#f59e0b", "#10b981"] });
        }
      })
      .catch(() => setNotFound(true));
  }, [token]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold text-gray-800">Board not found</h1>
        <p className="text-gray-500">This link may have expired or never existed.</p>
        <a href="/" className="text-sm mt-2" style={{ color: "var(--accent)" }}>← Go home</a>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 animate-pulse">Loading board…</p>
      </div>
    );
  }

  const approvedHrs = gifts.filter(g => g.status === "approved").reduce((s, g) => s + g.amount, 0);
  const cheerPosts = posts.filter(p => !p.is_manager_note);
  const typeEmoji = TYPE_EMOJI[board.type] ?? "🎉";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-base">🎉 Cheers from Applied</span>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">Shared board</span>
      </header>

      {/* Hero banner */}
      <div className="w-full px-6 py-12 flex flex-col items-center gap-4 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${board.honoree_avatar_color}cc 0%, ${board.honoree_avatar_color} 100%)` }}>
        <p className="text-5xl">{typeEmoji}</p>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
          style={{ background: "rgba(255,255,255,0.25)", border: "3px solid rgba(255,255,255,0.6)" }}>
          {initials(board.honoree_name)}
        </div>
        <h1 className="text-3xl font-extrabold drop-shadow">{board.title}</h1>
        {board.description && (
          <p className="text-xl font-semibold opacity-90 max-w-lg leading-snug">{board.description}</p>
        )}
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {board.values_tag && (
            <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
              {board.values_tag}
            </span>
          )}
          <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
            {cheerPosts.length} cheer{cheerPosts.length !== 1 ? "s" : ""}
          </span>
          {approvedHrs > 0 && (
            <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
              ⏱ {approvedHrs}h gifted
            </span>
          )}
        </div>
      </div>

      {/* Posts masonry */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-4">
              {post.is_manager_note ? (
                <div className="rounded-2xl p-5 shadow-sm text-white" style={{ background: "var(--accent)" }}>
                  <p className="text-sm font-semibold mb-2 opacity-80">📌 Manager note</p>
                  <p className="text-sm leading-relaxed">{post.message}</p>
                  <p className="text-xs opacity-60 mt-3">{post.author_name}</p>
                </div>
              ) : post.photo_url ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <img src={post.photo_url} alt={`${post.author_name}'s photo`} className="w-full object-cover" />
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Avatar name={post.author_name} color={post.author_avatar_color} size={6} />
                    <p className="text-xs text-gray-500">{post.author_name}</p>
                    {post.reaction && <span className="ml-auto text-base">{post.reaction}</span>}
                  </div>
                </div>
              ) : post.gif_url ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <img src={post.gif_url} alt={post.gif_title ?? "GIF"} className="w-full object-cover max-h-56" />
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Avatar name={post.author_name} color={post.author_avatar_color} size={6} />
                    <p className="text-xs text-gray-500">{post.author_name}</p>
                    {post.reaction && <span className="ml-auto text-base">{post.reaction}</span>}
                  </div>
                </div>
              ) : post.audio_url ? (
                <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">🎙 Voice message</p>
                  <audio controls className="w-full h-8" src={post.audio_url} />
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar name={post.author_name} color={post.author_avatar_color} size={6} />
                    <p className="text-xs text-gray-400">{post.author_name}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{post.author_name}</p>
                      {post.values_tag && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                          {post.values_tag}
                        </span>
                      )}
                    </div>
                  </div>
                  {post.message && <p className="text-gray-700 text-sm leading-relaxed">{post.message}</p>}
                  {post.reaction && <p className="text-lg mt-3">{post.reaction}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center flex flex-col items-center gap-1">
        <p className="text-sm text-gray-500">Made with ❤️ at Applied</p>
        <a href="/" className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
          Create your own board →
        </a>
      </footer>
    </div>
  );
}
