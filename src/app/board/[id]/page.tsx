"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Board {
  id: string; title: string; honoree_name: string; honoree_email: string;
  honoree_avatar_color: string; type: string; description: string;
  milestone_date: string; values_tag: string; is_private: number;
  share_token: string; requires_gift_approval: number; gift_manager_email: string;
  status: string; created_by: string; created_by_name: string; expires_at: string;
}
interface Post {
  id: string; board_id: string; author_name: string; author_email: string;
  author_avatar_color: string; message: string | null; gif_url: string | null;
  gif_title: string | null; photo_url: string | null; audio_url: string | null;
  reaction: string | null; is_manager_note: number; created_at: string;
}
interface Gift {
  id: string; board_id: string; from_name: string; from_email: string;
  gift_type: string; amount: number; note: string | null; status: string;
  approved_by: string | null; workday_balance: number | null; created_at: string;
}
interface Badge {
  id: string; person_email: string; person_name: string; badge_type: string;
  board_id: string; reason: string; awarded_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const EXPECTED_TEAM = ["Ali Chen","Bree Santos","Carlos Diaz","Dani Park","Erin Walsh","Femi Okafor","Grace Liu","Hana Morita"];

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

// ─── Post Tile ────────────────────────────────────────────────────────────────
function PostTile({ post }: { post: Post }) {
  if (post.is_manager_note) {
    return (
      <div className="relative rounded-2xl p-5 text-white break-inside-avoid mb-4"
        style={{ background: "linear-gradient(135deg,#6366f1,#ec4899)" }}>
        <span className="absolute top-3 right-3 text-lg">📌</span>
        <div className="flex items-center gap-2 mb-3">
          <Avatar name={post.author_name} color="rgba(255,255,255,0.3)" size={8} />
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
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm break-inside-avoid mb-4">
        <img src={post.photo_url} alt="Post photo" className="w-full object-cover max-h-64" />
        <div className="flex items-center gap-2 p-3">
          <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
          <p className="text-sm font-medium text-gray-700">{post.author_name}</p>
          {post.reaction && <span className="ml-auto text-lg">{post.reaction}</span>}
        </div>
      </div>
    );
  }
  if (post.gif_url) {
    return (
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm break-inside-avoid mb-4">
        <img src={post.gif_url} alt={post.gif_title ?? "GIF"} className="w-full object-cover max-h-56" />
        <div className="flex items-center gap-2 p-3">
          <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
          <p className="text-sm font-medium text-gray-700">{post.author_name}</p>
          {post.reaction && <span className="ml-auto text-lg">{post.reaction}</span>}
        </div>
      </div>
    );
  }
  if (post.audio_url) {
    return (
      <div className="rounded-2xl bg-indigo-50 p-4 break-inside-avoid mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎙</span>
          <span className="text-sm font-medium text-indigo-700">Voice message</span>
        </div>
        <audio controls src={post.audio_url} className="w-full h-8" />
        <div className="flex items-center gap-2 mt-3">
          <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
          <p className="text-sm font-medium text-gray-700">{post.author_name}</p>
          <p className="text-xs text-gray-400 ml-auto">{fmtDate(post.created_at)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm break-inside-avoid mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={post.author_name} color={post.author_avatar_color} size={7} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{post.author_name}</p>
          <p className="text-xs text-gray-400">{fmtDate(post.created_at)}</p>
        </div>
      </div>
      {post.message && <p className="text-sm text-gray-700 leading-relaxed mt-1">{post.message}</p>}
      {post.reaction && <p className="mt-2 text-xl">{post.reaction}</p>}
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
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const confettiFired = useRef(false);

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
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [posting, setPosting] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manager view state
  const [managerNote, setManagerNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchBoard = useCallback(async () => {
    const res = await fetch(`/api/boards/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setBoard(data.board);
    setPosts(data.posts);
    setGifts(data.gifts);
    setBadges(data.badges);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

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
      author_name: authorName.trim(),
      author_email: authorEmail.trim() || null,
      author_avatar_color: `hsl(${Math.floor(Math.random() * 360)},70%,50%)`,
      reaction: reaction || null,
    };
    if (tab === "text" || (!selectedGif && !photoData && !audio_url)) {
      body.message = message.trim() || null;
    }
    if (selectedGif) { body.gif_url = selectedGif.url; body.gif_title = selectedGif.title; }
    if (photoData) body.photo_url = photoData;
    if (audio_url) body.audio_url = audio_url;

    const res = await fetch(`/api/boards/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ["#6366f1","#ec4899","#f59e0b"] });
      setMessage(""); setReaction(""); setSelectedGif(null); setPhotoData(null);
      setAudioBlob(null); setAudioUrl(null); setTab("text");
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
        author_name: board?.gift_manager_email ?? "Manager",
        author_avatar_color: "#6366f1",
        message: managerNote.trim(),
        is_manager_note: true,
      }),
    });
    setManagerNote("");
    setSavingNote(false);
    await fetchBoard();
  }

  // ── Gift action ───────────────────────────────────────────────────────────
  async function giftAction(giftId: string, action: "approve" | "reject") {
    await fetch(`/api/boards/${id}/gifts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId, action, approved_by: board?.gift_manager_email }),
    });
    await fetchBoard();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">🎉</div>
        <p className="text-gray-500">Loading the board…</p>
      </div>
    </div>
  );
  if (!board) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Board not found.</p>
    </div>
  );

  const gifSet = GIF_SETS[board.type] ?? GIF_SETS.birthday;
  const autoMsgs = AUTO_MESSAGES[board.type] ?? AUTO_MESSAGES.birthday;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${board.share_token}` : "";
  const managerNotePost = posts.find(p => p.is_manager_note);
  const posters = [...new Set(posts.filter(p => !p.is_manager_note).map(p => p.author_name))];
  const totalHrs = gifts.filter(g => g.status === "approved").reduce((s, g) => s + g.amount, 0);

  const views = [
    { key: "board", label: "🎉 The Board" },
    { key: "manager", label: "👥 Manager View" },
    { key: "receiver", label: "🌟 Your Board" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      {/* Nav */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 mr-1 text-lg">←</button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800 truncate text-sm">{board.title}</p>
          <p className="text-xs text-gray-400">For {board.honoree_name}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {views.map(v => (
            <button key={v.key}
              onClick={() => router.push(`/board/${id}?view=${v.key}`)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === v.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOARD VIEW ─────────────────────────────────────────────── */}
      {view === "board" && (
        <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
          {/* Masonry wall */}
          <div className="flex-1 min-w-0">
            <div className="columns-2 md:columns-3 gap-4">
              {posts.map(p => <PostTile key={p.id} post={p} />)}
              {posts.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <p className="text-4xl mb-2">✉️</p>
                  <p>No posts yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>

          {/* Composer sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
              <div className="p-4 border-b border-gray-50">
                <p className="font-semibold text-gray-800 text-sm">Leave a message</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {(["text","gif","photo","voice"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 text-base transition-colors ${tab === t ? "border-b-2 border-indigo-500 bg-indigo-50" : "text-gray-400 hover:bg-gray-50"}`}>
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
                          className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs hover:bg-indigo-100 transition-colors">
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Write your message…" rows={3}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <div className="flex flex-wrap gap-1">
                      {REACTIONS.map(r => (
                        <button key={r} onClick={() => setReaction(reaction === r ? "" : r)}
                          className={`text-lg p-1 rounded-lg transition-colors ${reaction === r ? "bg-indigo-100" : "hover:bg-gray-100"}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* GIF TAB */}
                {tab === "gif" && (
                  <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto">
                    {gifSet.map((url, i) => (
                      <button key={i} onClick={() => { setSelectedGif({ url, title: `GIF ${i+1}` }); setTab("text"); }}
                        className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all">
                        <img src={url} alt="gif" className="w-full h-full object-cover" />
                      </button>
                    ))}
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
                        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl h-32 cursor-pointer transition-colors ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}`}>
                        <span className="text-2xl">📷</span>
                        <span className="text-xs text-gray-400">Drag & drop or click to choose</span>
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
                                <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-pulse"
                                  style={{ height: `${20 + (i % 3) * 10}px`, animationDelay: `${i * 0.1}s` }} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">{recSeconds}s / 60s</p>
                            <button onClick={stopRecording}
                              className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors">
                              ⏹ Stop
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={startRecording}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors">
                              🎙 Start Recording
                            </button>
                            <p className="text-xs text-gray-400">Max 60s</p>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full space-y-2">
                        <audio controls src={audioUrl} className="w-full h-8" />
                        <div className="flex gap-2">
                          <button onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                            className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                            Re-record
                          </button>
                          <button onClick={() => setTab("text")}
                            className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
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

                {/* Author + Post */}
                <div className="pt-2 border-t border-gray-50 space-y-2">
                  <input value={authorName} onChange={e => setAuthorName(e.target.value)}
                    placeholder="Your name (required)"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <input value={authorEmail} onChange={e => setAuthorEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <button onClick={submitPost} disabled={posting || !authorName.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {posting ? "Posting…" : "Post 🎉"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGER VIEW ───────────────────────────────────────────── */}
      {view === "manager" && (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">👥 Manager View</h2>

          {/* Manager note */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="font-semibold text-gray-700 mb-3">📌 Manager Note</p>
            {managerNotePost ? (
              <div className="rounded-xl p-4 text-white text-sm" style={{ background: "linear-gradient(135deg,#6366f1,#ec4899)" }}>
                {managerNotePost.message}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={managerNote} onChange={e => setManagerNote(e.target.value)}
                  placeholder="Pin a personal note at the top of the board…" rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={submitManagerNote} disabled={savingNote || !managerNote.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {savingNote ? "Saving…" : "Pin Note"}
                </button>
              </div>
            )}
          </div>

          {/* Gift approval queue */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="font-semibold text-gray-700 mb-3">🎁 Gift Approval Queue</p>
            {gifts.length === 0 ? (
              <p className="text-sm text-gray-400">No gift contributions yet.</p>
            ) : (
              <div className="space-y-2">
                {gifts.map(g => (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{g.from_name}</p>
                      <p className="text-xs text-gray-500">
                        {g.amount}h · {g.gift_type.replace(/_/g," ")}
                        {g.note ? ` · "${g.note}"` : ""}
                      </p>
                    </div>
                    {g.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => giftAction(g.id, "approve")}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600">
                          Approve
                        </button>
                        <button onClick={() => giftAction(g.id, "reject")}
                          className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${g.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {g.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team participation checklist */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="font-semibold text-gray-700 mb-3">✅ Team Participation</p>
            <div className="space-y-2">
              {EXPECTED_TEAM.map(name => {
                const posted = posters.includes(name);
                return (
                  <div key={name} className={`flex items-center gap-3 p-2.5 rounded-xl ${posted ? "bg-green-50" : "bg-gray-50"}`}>
                    <span className="text-lg">{posted ? "✅" : "⬜"}</span>
                    <span className="text-sm text-gray-700">{name}</span>
                    {posted && <span className="ml-auto text-xs text-green-600 font-medium">Posted</span>}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">{posters.length} / {EXPECTED_TEAM.length} team members posted</p>
          </div>

          {/* Export to Workday stub */}
          <button
            onClick={() => alert("Workday export coming soon! This would push approved time-off to Workday.")}
            className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            📤 Export to Workday (stub)
          </button>
        </div>
      )}

      {/* ── RECEIVER VIEW ──────────────────────────────────────────── */}
      {view === "receiver" && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden p-8 text-white text-center"
            style={{ background: "linear-gradient(135deg,#6366f1,#ec4899,#f59e0b)" }}>
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
              <div className="text-center">
                <p className="text-2xl font-bold">{totalHrs}</p>
                <p className="text-xs text-white/70">Gift hrs</p>
              </div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }}
              className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors">
              🔗 Share Board
            </button>
          </div>

          {/* Badges showcase */}
          {badges.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="font-semibold text-gray-700 mb-3">🏅 Your Badges</p>
              <div className="flex flex-wrap gap-2">
                {badges.map(b => {
                  const meta = BADGE_META[b.badge_type] ?? { icon: "⭐", color: "#6366f1", label: b.badge_type };
                  return (
                    <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ backgroundColor: meta.color + "15", border: `1px solid ${meta.color}30` }}>
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                        <p className="text-xs text-gray-400">{b.person_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="space-y-3">
            <p className="font-semibold text-gray-700">💌 Messages from your team</p>
            {posts.map(p => <PostTile key={p.id} post={p} />)}
            {posts.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">No messages yet — share the board link!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
