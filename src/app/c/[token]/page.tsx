"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";

interface Post {
  id: string;
  type: "manager_note" | "photo" | "gif" | "audio" | "text";
  author_name: string;
  author_avatar?: string;
  message?: string;
  photo_url?: string;
  audio_url?: string;
  gif_url?: string;
  reaction?: string;
}

interface Board {
  id: string;
  title: string;
  honoree_name: string;
  honoree_initials: string;
  honoree_avatar_color: string;
  type_emoji: string;
  values_tag?: string;
  description?: string;
  posts: Post[];
  approved_hrs?: number;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function SharedBoardPage() {
  const { token } = useParams<{ token: string }>();
  const [board, setBoard] = useState<Board | null>(null);
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
        setBoard(data);
        if (!confettiFired.current) {
          confettiFired.current = true;
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.3 },
            colors: ["#6366f1", "#ec4899", "#f59e0b", "#10b981"],
          });
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
        <a href="https://cheers-from-applied.vercel.app" className="text-indigo-600 hover:underline text-sm mt-2">← Go home</a>
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-base">🎉 Cheers from Applied</span>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">Shared board</span>
      </header>

      {/* Hero banner */}
      <div
        className="w-full px-6 py-12 flex flex-col items-center gap-4 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${board.honoree_avatar_color}cc 0%, ${board.honoree_avatar_color} 100%)` }}
      >
        <p className="text-4xl">{board.type_emoji}</p>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
          style={{ background: "rgba(255,255,255,0.25)", border: "3px solid rgba(255,255,255,0.6)" }}
        >
          {board.honoree_initials || getInitials(board.honoree_name)}
        </div>
        <h1 className="text-3xl font-extrabold drop-shadow">{board.honoree_name}</h1>
        <p className="text-xl font-semibold opacity-90">{board.title}</p>
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {board.values_tag && (
            <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
              {board.values_tag}
            </span>
          )}
          <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
            {board.posts.length} post{board.posts.length !== 1 ? "s" : ""}
          </span>
          {board.approved_hrs !== undefined && board.approved_hrs > 0 && (
            <span className="bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
              ⏱ {board.approved_hrs}h approved
            </span>
          )}
        </div>
        {board.description && (
          <p className="max-w-lg text-sm opacity-80 mt-1">{board.description}</p>
        )}
      </div>

      {/* Posts masonry */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-0">
          {board.posts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-4">
              {post.type === "manager_note" && (
                <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm">
                  <p className="text-sm font-semibold text-indigo-700 mb-2">📌 Manager note</p>
                  <p className="text-gray-800 text-sm leading-relaxed">{post.message}</p>
                  <p className="text-xs text-gray-400 mt-3">— {post.author_name}</p>
                </div>
              )}
              {(post.type === "photo" || post.type === "gif") && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  {(post.photo_url || post.gif_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.photo_url || post.gif_url}
                      alt={`${post.author_name}'s ${post.type}`}
                      className="w-full object-cover"
                    />
                  )}
                  <p className="text-xs text-gray-500 px-3 py-2">— {post.author_name}</p>
                </div>
              )}
              {post.type === "audio" && (
                <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-3">🎙 Voice message</p>
                  {post.audio_url && (
                    <audio controls className="w-full h-8" src={post.audio_url} />
                  )}
                  <p className="text-xs text-gray-400 mt-2">— {post.author_name}</p>
                </div>
              )}
              {post.type === "text" && (
                <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: board.honoree_avatar_color }}
                    >
                      {getInitials(post.author_name)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{post.author_name}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{post.message}</p>
                  {post.reaction && <p className="text-lg mt-3">{post.reaction}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center flex flex-col items-center gap-1">
        <p className="text-sm text-gray-500">Made with ❤️ at Applied</p>
        <a
          href="https://cheers-from-applied.vercel.app"
          className="text-indigo-600 hover:underline text-sm font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create your own board →
        </a>
      </footer>
    </div>
  );
}
