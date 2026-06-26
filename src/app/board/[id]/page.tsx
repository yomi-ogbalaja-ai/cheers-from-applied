"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

interface Board {
  id: string; honoree_name: string; honoree_email: string; honoree_avatar_color: string;
  type: string; title: string; description: string; values_tag: string;
  expires_at: string; requires_gift_approval: number; gift_manager_email: string;
  share_token: string; public_share_enabled: number;
}
interface Post {
  id: string; board_id: string; author_name: string; author_email: string;
  author_avatar_color: string; message: string; gif_url: string; gif_title: string;
  photo_url: string; audio_url: string; reaction: string; is_manager_note: number; created_at: string;
}
interface Gift {
  id: string; board_id: string; from_name: string; from_email: string;
  gift_type: string; amount: number; note: string; status: string; workday_balance: number;
}
interface Badge { id: number; badge_type: string; person_name: string; reason: string; awarded_at: string; }

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂", wedding: "💍", new_baby: "👶", work_anniversary: "🥂",
  promotion: "🚀", get_well: "💐", new_hire: "👋", personal_achievement: "🌟",
};

const GIF_SETS: Record<string, string[]> = {
  birthday: [
    "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif",
    "https://media.giphy.com/media/ZdUnQS4AXEl96/giphy.gif",
    "https://media.giphy.com/media/5UZmkTfmHfAhfNxqhj/giphy.gif",
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    "https://media.giphy.com/media/MFiOBkDiIsBtdBXlzJ/giphy.gif",
    "https://media.giphy.com/media/26tPghhTrRKdZZ3aU/giphy.gif",
  ],
  wedding: [
    "https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif",
    "https://media.giphy.com/media/l4FGw4d101Sa0pGTe/giphy.gif",
    "https://media.giphy.com/media/26BRzQS5HXcEWmc8E/giphy.gif",
    "https://media.giphy.com/media/l0MYNocHNXswfzEaA/giphy.gif",
    "https://media.giphy.com/media/l4KibWpBGWchSqCRy/giphy.gif",
    "https://media.giphy.com/media/xUPGcxpCV81hciSfZe/giphy.gif",
  ],
  new_baby: [
    "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
    "https://media.giphy.com/media/l0HlFkBCMoFCRdL5m/giphy.gif",
    "https://media.giphy.com/media/3oEdvb6OiAm2kNYZ9K/giphy.gif",
    "https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif",
    "https://media.giphy.com/media/3oEjHBGBEJfKkTUkne/giphy.gif",
    "https://media.giphy.com/media/26hkhPJ5hmdD87HYA/giphy.gif",
  ],
  work_anniversary: [
    "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",
    "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
    "https://media.giphy.com/media/xUPGcxpCV81hciSfZe/giphy.gif",
    "https://media.giphy.com/media/3oEdva9BUHPIs2SkGk/giphy.gif",
    "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif",
    "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  ],
  promotion: [
    "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",
    "https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif",
    "https://media.giphy.com/media/3o6Zt9IUqXP4hBPwYE/giphy.gif",
    "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
    "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
    "https://media.giphy.com/media/xUPGGDNsLvqsBOhuU0/giphy.gif",
  ],
  get_well: [
    "https://media.giphy.com/media/l0HlFkBCMoFCRdL5m/giphy.gif",
    "https://media.giphy.com/media/l4FGw4d101Sa0pGTe/giphy.gif",
    "https://media.giphy.com/media/3oEdv5e5Zd7x7Rdsc0/giphy.gif",
    "https://media.giphy.com/media/5UZmkTfmHfAhfNxqhj/giphy.gif",
    "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
    "https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif",
  ],
  new_hire: [
    "https://media.giphy.com/media/XDAY1NNG2VvobAp9o1/giphy.gif",
    "https://media.giphy.com/media/l1J9u3TZfpmeDLkD6/giphy.gif",
    "https://media.giphy.com/media/3oz8xRF0v9WMAUVLNK/giphy.gif",
    "https://media.giphy.com/media/xT9DPpf0zTqRASyzTi/giphy.gif",
    "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    "https://media.giphy.com/media/Rl9Yqavnv97W0/giphy.gif",
  ],
  personal_achievement: [
    "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",
    "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
    "https://media.giphy.com/media/3o6Zt9IUqXP4hBPwYE/giphy.gif",
    "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
    "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif",
    "https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif",
  ],
};

const REACTIONS = ["🎉","❤️","🔥","👏","🥳","🙌","😍","💪","🫶","🌟"];

const BADGE_META: Record<string, { icon: string; color: string }> = {
  cheer_champion: { icon: "🏆", color: "bg-purple-100 text-purple-700" },
  generous_soul: { icon: "💝", color: "bg-pink-100 text-pink-700" },
  birthday_star: { icon: "⭐", color: "bg-yellow-100 text-yellow-700" },
  rising_star: { icon: "🚀", color: "bg-violet-100 text-violet-700" },
  team_player: { icon: "🤝", color: "bg-blue-100 text-blue-700" },
  heartwarmer: { icon: "❤️", color: "bg-red-100 text-red-700" },
  welcome_wagon: { icon: "👋", color: "bg-teal-100 text-teal-700" },
};

// Category-specific suggested messages
const AUTO_MESSAGES: Record<string, { label: string; text: string }[]> = {
  birthday: [
    { label: "🎂 Quick cheer", text: "Happy birthday! 🎂 Hope your day is as amazing as you are!" },
    { label: "🌟 Personal touch", text: "Another lap around the sun with you on the team — lucky us! Wishing you a brilliant birthday. 🥳" },
    { label: "💪 Team shoutout", text: "You make this team better every single day. Happy birthday — today is all about YOU! 🎉" },
    { label: "😄 Light & fun", text: "Heard it's your birthday... officially mandatory that you do zero work today. Orders from the team. 🎂😄" },
    { label: "❤️ Heartfelt", text: "Working with you is genuinely one of the highlights of my week. Happy birthday — hope it's a great one. ❤️" },
    { label: "🎊 Group energy", text: "The whole team is sending you so much love today! Celebrate big — you deserve it. 🎊🎂🥂" },
  ],
  wedding: [
    { label: "💍 Big day cheer", text: "Congratulations on your wedding! Wishing you a lifetime of love, laughter, and adventure together. 💍" },
    { label: "🥂 Toast moment", text: "Here's to a love story worth celebrating! So happy for you both. 🥂💕" },
    { label: "🌸 Heartfelt", text: "Watching you step into this new chapter is such a joy. Congratulations from all of us! 🌸" },
    { label: "🎊 Team love", text: "The whole Applied team is cheering for you! May your marriage be as strong and bright as your work here. 🎊❤️" },
    { label: "😄 Fun & warm", text: "We promise we won't email you on your honeymoon. (Maybe.) Congratulations! 💍😄" },
    { label: "💐 Simple & sweet", text: "Wishing you every happiness as you start this beautiful new chapter together. Congrats! 💐" },
  ],
  new_baby: [
    { label: "👶 Welcome, baby!", text: "Congratulations on your new arrival! What an incredible milestone — welcome to the world, little one! 👶🎉" },
    { label: "😴 Fun nudge", text: "Sleep is overrated anyway, right? 😄 Congratulations on the newest team member in your family! 👶" },
    { label: "❤️ Warm & genuine", text: "Your family just grew and our hearts grew with it. Congratulations — enjoy every moment. ❤️" },
    { label: "🌟 Life milestone", text: "This is one of life's most beautiful moments. Sending so much love to your growing family! 🌟👶" },
    { label: "🍼 Light & loving", text: "A brand new tiny human — congratulations! Applied just became the best company ever for future talent. 😂🍼" },
    { label: "🌸 Simply sweet", text: "Wishing you rest, joy, and all the wonder that comes with welcoming a new baby. Congrats! 🌸" },
  ],
  work_anniversary: [
    { label: "🥂 Milestone toast", text: "Here's to another year of you making Applied better in every way. Thank you for everything you bring! 🥂" },
    { label: "🌟 Impact shoutout", text: "The impact you've had here doesn't go unnoticed. So glad you're part of this team. Happy anniversary! 🌟" },
    { label: "🚀 Future forward", text: "Years in and still showing everyone how it's done — here's to many more! 🚀" },
    { label: "❤️ Personal", text: "Couldn't imagine Applied without you. Thank you for choosing to stay and grow with us. ❤️" },
    { label: "😄 Fun & warm", text: "You've officially survived another year of standups, sprint reviews, and Slack notifications. Legend. 😄🥂" },
    { label: "🎊 Team cheers", text: "The whole team raises a glass to you today. Thanks for being exactly who you are. 🎊" },
  ],
  promotion: [
    { label: "🚀 Deserved!", text: "SO deserved — congratulations!! You've earned every bit of this. 🚀" },
    { label: "🏆 Recognition", text: "You've consistently shown up, leveled up, and lifted everyone around you. This is just the beginning. 🏆" },
    { label: "💪 Inspired", text: "Watching you grow here has been truly inspiring. Congratulations on the promotion! 💪" },
    { label: "🎊 Team proud", text: "The whole team is so proud of you. Can't wait to see what you build from here. 🎊🚀" },
    { label: "😄 Playful", text: "Called it months ago. Congrats — now comes the part where you pretend the title doesn't matter but we all know it does. 😄🏆" },
    { label: "🌟 Meaningful", text: "This promotion reflects not just your skills but your character. Congrats — it means a lot to us all. 🌟" },
  ],
  get_well: [
    { label: "💐 Warm wishes", text: "Sending you so much warmth and care. Rest up and know the team is thinking of you. 💐" },
    { label: "❤️ We miss you", text: "The office (and Slack) is quieter without you. Get well soon — we miss your energy! ❤️" },
    { label: "😄 Light & uplifting", text: "Doctor's orders: rest, hydrate, and let us handle things while you recover. 😄 Feel better soon!" },
    { label: "🌟 Strength", text: "You're stronger than you know. Wishing you a smooth and speedy recovery. We're rooting for you! 🌟" },
    { label: "🍵 Simple & caring", text: "Take all the time you need. We're here whenever you're ready. Get well soon! 🍵" },
    { label: "🌸 Gentle", text: "Sending gentle healing vibes your way. No rushing — your health comes first always. 🌸" },
  ],
  new_hire: [
    { label: "👋 Welcome aboard!", text: "Welcome aboard! So excited to have you here — the team just leveled up. 👋🎉" },
    { label: "🎉 Team energy", text: "You're going to love it here. Applied is full of people who genuinely care. Welcome! 🎉" },
    { label: "🙌 Excited to work together", text: "Can't wait to work together and see what we build. Welcome to the team! 🙌" },
    { label: "🌟 Big things ahead", text: "Big things ahead for Applied and you're part of why. Welcome! 🌟" },
    { label: "😄 Fun welcome", text: "Warning: this team has very strong opinions about GIF usage in Slack. You'll fit right in. 😄 Welcome!" },
    { label: "❤️ Heartfelt", text: "We've been looking forward to you joining for weeks. Welcome — so glad you're here. ❤️" },
  ],
  personal_achievement: [
    { label: "🌟 Kudos!", text: "This achievement is a reflection of everything you've put in. So proud of you! 🌟" },
    { label: "🏆 Earned it", text: "You set the goal, did the work, and made it happen. That's all you. Congrats! 🏆" },
    { label: "💪 Inspired by you", text: "Genuinely inspired by what you've accomplished. Keep going — there's so much more ahead. 💪" },
    { label: "🎊 Team celebrates", text: "Your wins are our wins. The team is celebrating right along with you. 🎊🌟" },
    { label: "😄 Light cheer", text: "And this is why we love having you on the team. Congrats on crushing it! 😄" },
    { label: "❤️ Personal", text: "Beyond the milestone — watching you pursue this with such dedication has been a joy. Congrats. ❤️" },
  ],
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const EXPECTED_TEAM = ["Jordan Smith","Maya Patel","Sam Lee","Alex Chen","Chris Wong","Yomi Ogbalaja"];

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = (searchParams.get("view") as "board"|"manager"|"receiver") || "board";

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const [composerTab, setComposerTab] = useState<"text"|"gif"|"photo"|"audio">("text");
  const [message, setMessage] = useState("");
  const [reaction, setReaction] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [selectedGif, setSelectedGif] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Real audio recording
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [audioBlobUrl, setAudioBlobUrl] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchBoard = useCallback(async () => {
    const res = await fetch(`/api/boards/${id}`);
    const data = await res.json();
    setBoard(data.board);
    setPosts(data.posts);
    setGifts(data.gifts);
    setBadges(data.badges);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const gifs = board ? (GIF_SETS[board.type] ?? GIF_SETS.birthday) : GIF_SETS.birthday;
  const autoMessages = board ? (AUTO_MESSAGES[board.type] ?? AUTO_MESSAGES.birthday) : AUTO_MESSAGES.birthday;

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoDataUrl(result);
      setPhotoPreview(result);
      setComposerTab("text");
    };
    reader.readAsDataURL(file);
  }

  async function startRecording() {
    if (!navigator.mediaDevices) return alert("Microphone not available in this browser.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const blobUrl = URL.createObjectURL(blob);
      setAudioBlobUrl(blobUrl);
      const reader = new FileReader();
      reader.onload = (ev) => setAudioDataUrl(ev.target?.result as string);
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function submitPost() {
    if (!authorName.trim()) return alert("Please enter your name");
    const hasContent = message.trim() || selectedGif || photoDataUrl || audioDataUrl;
    if (!hasContent) return alert("Add a message, GIF, photo, or voice note");
    setSubmitting(true);
    await fetch(`/api/boards/${id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: authorName,
        author_email: authorEmail || null,
        message: message || null,
        gif_url: selectedGif || null,
        photo_url: photoDataUrl || null,
        audio_url: audioDataUrl || null,
        reaction: reaction || null,
      }),
    });
    setMessage("");
    setSelectedGif("");
    setPhotoDataUrl("");
    setPhotoPreview("");
    setAudioDataUrl("");
    setAudioBlobUrl("");
    setReaction("");
    await fetchBoard();
    setSubmitting(false);
  }

  async function handleGiftAction(giftId: string, action: "approve"|"reject") {
    await fetch(`/api/boards/${id}/gifts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId, action, approved_by: "Manager" }),
    });
    await fetchBoard();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎉</div>
          <p className="text-gray-500">Loading celebration...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center px-4">
        <div>
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Board not found</h1>
          <p className="text-gray-500">This celebration board doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const pendingGifts = gifts.filter((g) => g.status === "pending");
  const approvedGifts = gifts.filter((g) => g.status === "approved");
  const totalApprovedHrs = approvedGifts.reduce((s, g) => s + g.amount, 0);
  const totalPendingHrs = pendingGifts.reduce((s, g) => s + g.amount, 0);
  const managerPost = posts.find((p) => p.is_manager_note === 1);
  const postAuthors = [...new Set(posts.map((p) => p.author_name))];
  const participated = EXPECTED_TEAM.filter((n) => postAuthors.includes(n));
  const notYet = EXPECTED_TEAM.filter((n) => !postAuthors.includes(n));

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Tab bar */}
      <div className="sticky top-14 z-40 border-b bg-white" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {(["board","manager","receiver"] as const).map((v, i) => {
              const labels = ["🎉 The Board","👥 Manager View","🌟 Your Board"];
              return (
                <button
                  key={v}
                  onClick={() => router.push(`/board/${id}?view=${v}`)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${view === v ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  {labels[i]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== TAB 1: THE BOARD ===== */}
      {view === "board" && (
        <div>
          <div className="py-12 px-4 text-white text-center" style={{ background: `linear-gradient(135deg, ${board.honoree_avatar_color}dd, #ec4899cc)` }}>
            <div className="text-5xl mb-4">{TYPE_EMOJI[board.type] ?? "🎉"}</div>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-4 border-4 border-white shadow-xl"
              style={{ background: board.honoree_avatar_color }}
            >
              {initials(board.honoree_name)}
            </div>
            <p className="text-white/80 text-sm mb-1">{board.honoree_name}</p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{board.title}</h1>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">{board.values_tag}</span>
              {board.expires_at && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {daysLeft(board.expires_at)}d left
                </span>
              )}
              {totalApprovedHrs > 0 && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                  ⏱ {totalApprovedHrs} hrs gifted
                </span>
              )}
            </div>
            {board.description && <p className="text-white/70 mt-4 max-w-lg mx-auto text-sm">{board.description}</p>}
            {board.public_share_enabled === 1 && board.share_token && (
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/c/${board.share_token}`); alert("Link copied!"); }}
                className="mt-5 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              >
                🔗 Copy shareable link
              </button>
            )}
          </div>

          {/* Posts masonry */}
          <div className="max-w-6xl mx-auto px-4 py-10">
            {posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">💌</div>
                <p className="font-medium">Be the first to leave a message!</p>
              </div>
            ) : (
              <div style={{ columns: "2", columnGap: "1.5rem" }} className="md:columns-3">
                {posts.map((post) => (
                  <div key={post.id} style={{ breakInside: "avoid", marginBottom: "1.5rem" }}>
                    {post.is_manager_note === 1 ? (
                      <div className="rounded-2xl p-5 text-white relative overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
                        <span className="absolute top-3 right-3 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">📌 Manager</span>
                        <div className="flex items-center gap-3 mb-3 mt-2">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/50" style={{ background: post.author_avatar_color }}>
                            {initials(post.author_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{post.author_name}</div>
                            <div className="text-white/60 text-xs">Manager</div>
                          </div>
                        </div>
                        {post.message && <p className="text-sm leading-relaxed text-white/90">{post.message}</p>}
                        {post.reaction && <div className="text-2xl mt-3">{post.reaction}</div>}
                      </div>
                    ) : post.audio_url ? (
                      <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: post.author_avatar_color }}>
                            {initials(post.author_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{post.author_name}</div>
                            <div className="text-gray-400 text-xs">{new Date(post.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3">
                          <span className="text-2xl">🎙</span>
                          <audio controls src={post.audio_url} className="flex-1 h-8" style={{ height: "32px" }} />
                        </div>
                        {post.message && <p className="text-sm text-gray-700 mt-3">{post.message}</p>}
                      </div>
                    ) : post.photo_url ? (
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: "var(--border)" }}>
                        <img src={post.photo_url} alt="photo" className="w-full object-cover" />
                        <div className="p-3 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: post.author_avatar_color }}>
                            {initials(post.author_name)}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">{post.author_name}</div>
                          {post.message && <p className="text-xs text-gray-500 ml-1 truncate">{post.message}</p>}
                        </div>
                      </div>
                    ) : post.gif_url ? (
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: "var(--border)" }}>
                        <img src={post.gif_url} alt={post.gif_title ?? "gif"} className="w-full object-cover" />
                        <div className="p-3 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: post.author_avatar_color }}>
                            {initials(post.author_name)}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">{post.author_name}</div>
                          {post.message && <p className="text-xs text-gray-500 ml-1 truncate">{post.message}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: post.author_avatar_color }}>
                            {initials(post.author_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{post.author_name}</div>
                            <div className="text-gray-400 text-xs">{new Date(post.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {post.message && <p className="text-sm text-gray-700 leading-relaxed">{post.message}</p>}
                        {post.reaction && <div className="text-2xl mt-3">{post.reaction}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="mt-10 bg-white rounded-3xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <h2 className="font-bold text-gray-800 text-lg">Leave a message ✨</h2>
                {(selectedGif || photoPreview || audioBlobUrl) && (
                  <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-full">
                    {selectedGif ? "🎞 GIF ready" : photoPreview ? "📷 Photo ready" : "🎙 Audio ready"}
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
                {(["text","gif","photo","audio"] as const).map((t) => {
                  const labels = { text: "💬 Text", gif: "🎞 GIF", photo: "📷 Photo", audio: "🎙 Voice" };
                  const active = composerTab === t || (t === "photo" && photoPreview) || (t === "audio" && audioBlobUrl) || (t === "gif" && selectedGif);
                  return (
                    <button
                      key={t}
                      onClick={() => setComposerTab(t)}
                      className={`flex-1 py-3 text-sm font-semibold transition-colors ${active ? "border-b-2 border-indigo-500 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {composerTab === "text" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium">Suggested for this {board.type.replace("_", " ")} ✨</p>
                      <div className="flex flex-wrap gap-2">
                        {autoMessages.map((m, i) => (
                          <button
                            key={i}
                            onClick={() => setMessage(m.text)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${message === m.text ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      className="w-full border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      style={{ borderColor: "var(--border)" }}
                      rows={4}
                      placeholder={`Write something for ${board?.honoree_name?.split(" ")[0] ?? "them"}...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {REACTIONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setReaction(reaction === r ? "" : r)}
                          className={`text-2xl transition-transform hover:scale-125 ${reaction === r ? "scale-125 drop-shadow-md" : ""}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {(photoPreview || audioBlobUrl) && (
                      <div className="flex items-center gap-3 flex-wrap">
                        {photoPreview && (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                            <img src={photoPreview} alt="preview" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-xs text-green-700 font-medium">Photo attached</span>
                            <button onClick={() => { setPhotoDataUrl(""); setPhotoPreview(""); }} className="text-red-400 text-xs ml-1 hover:underline">✕</button>
                          </div>
                        )}
                        {audioBlobUrl && (
                          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                            <span className="text-lg">🎙</span>
                            <audio controls src={audioBlobUrl} className="h-7" />
                            <button onClick={() => { setAudioDataUrl(""); setAudioBlobUrl(""); }} className="text-red-400 text-xs ml-1 hover:underline">✕</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {composerTab === "gif" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">Pick a GIF to attach:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {gifs.map((url) => (
                        <button
                          key={url}
                          onClick={() => { setSelectedGif(url); setComposerTab("text"); }}
                          className={`rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedGif === url ? "border-indigo-500 shadow-lg" : "border-transparent"}`}
                        >
                          <img src={url} alt="gif" className="w-full h-24 object-cover" />
                        </button>
                      ))}
                    </div>
                    {selectedGif && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600">
                        <span>✅ GIF selected!</span>
                        <button onClick={() => setSelectedGif("")} className="text-red-400 hover:underline text-xs">Remove</button>
                      </div>
                    )}
                  </div>
                )}

                {composerTab === "photo" && (
                  <div>
                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden">
                        <img src={photoPreview} alt="preview" className="w-full max-h-72 object-cover rounded-2xl" />
                        <button
                          onClick={() => { setPhotoDataUrl(""); setPhotoPreview(""); }}
                          className="absolute top-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full hover:bg-black/70"
                        >
                          ✕ Remove
                        </button>
                        <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                          📷 Photo ready — switch to Text to add a message
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "#c7d2fe" }}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <div className="text-5xl mb-3">📷</div>
                        <p className="text-gray-600 font-medium mb-1">Upload a photo</p>
                        <p className="text-gray-400 text-sm">JPG, PNG, GIF — up to 5 MB</p>
                        <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-sm font-semibold px-5 py-2 rounded-full">
                          Browse files
                        </div>
                      </div>
                    )}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                )}

                {composerTab === "audio" && (
                  <div className="text-center py-8">
                    {audioBlobUrl && !recording ? (
                      <div className="space-y-4">
                        <div className="text-4xl">✅</div>
                        <p className="text-gray-700 font-semibold">Voice message recorded!</p>
                        <audio controls src={audioBlobUrl} className="mx-auto" />
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => { setAudioDataUrl(""); setAudioBlobUrl(""); setRecordTime(0); }}
                            className="px-5 py-2 text-sm bg-gray-100 text-gray-600 rounded-full font-semibold hover:bg-gray-200"
                          >
                            🔄 Re-record
                          </button>
                          <button
                            onClick={() => setComposerTab("text")}
                            className="px-5 py-2 text-sm text-white font-semibold rounded-full"
                            style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
                          >
                            ✓ Use this
                          </button>
                        </div>
                      </div>
                    ) : recording ? (
                      <div className="space-y-4">
                        <div className="text-5xl animate-pulse">⏺️</div>
                        <p className="text-red-500 font-semibold text-lg">Recording... {recordTime}s</p>
                        <div className="flex justify-center gap-1">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 rounded-full bg-red-400"
                              style={{ height: `${12 + Math.sin(Date.now() / 200 + i) * 8}px`, animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate` }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={stopRecording}
                          className="px-8 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors"
                        >
                          ⏹ Stop Recording
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-5xl">🎙</div>
                        <p className="text-gray-600 text-sm">Record a personal voice message for <strong>{board.honoree_name.split(" ")[0]}</strong></p>
                        <p className="text-gray-400 text-xs">Your browser will ask for microphone permission</p>
                        <button
                          onClick={startRecording}
                          className="px-8 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
                        >
                          🎙 Start Recording
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex gap-3 flex-wrap items-end border-t pt-5" style={{ borderColor: "var(--border)" }}>
                  <div className="flex-1 min-w-36">
                    <label className="block text-xs text-gray-500 mb-1">Your name *</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      style={{ borderColor: "var(--border)" }}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex-1 min-w-36">
                    <label className="block text-xs text-gray-500 mb-1">Your email (optional)</label>
                    <input
                      type="email"
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      style={{ borderColor: "var(--border)" }}
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      placeholder="you@applied.co"
                    />
                  </div>
                  <button
                    onClick={submitPost}
                    disabled={submitting}
                    className="px-8 py-2.5 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
                  >
                    {submitting ? "Posting..." : "🎉 Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: MANAGER VIEW ===== */}
      {view === "manager" && (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Manager View</span>
            <span className="text-gray-500 text-sm">{board.title}</span>
          </div>

          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>📌</span> Manager Note</h2>
            {managerPost ? (
              <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}>
                <p className="text-sm leading-relaxed">{managerPost.message}</p>
                <div className="text-white/60 text-xs mt-2">— {managerPost.author_name}</div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">✏️</div>
                <p className="text-sm">No manager note yet. Post one from the board tab!</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><span>⏱</span> Time-Off Gift Queue</h2>
            <p className="text-sm text-gray-400 mb-4">
              Approved: <strong className="text-emerald-600">{totalApprovedHrs} hrs</strong> &nbsp;|&nbsp;
              Pending: <strong className="text-amber-500">{totalPendingHrs} hrs</strong>
            </p>
            {pendingGifts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pending time-off gifts</p>
            ) : (
              <div className="space-y-3">
                {pendingGifts.map((g) => (
                  <div key={g.id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm">{g.from_name} gifted <span className="text-indigo-600">{g.amount} hrs</span></div>
                      {g.note && <div className="text-gray-500 text-xs mt-0.5">"{g.note}"</div>}
                      {g.workday_balance != null && <div className="text-gray-400 text-xs mt-0.5">Balance: {g.workday_balance} hrs</div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleGiftAction(g.id, "approve")} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600">✅ Approve</button>
                      <button onClick={() => handleGiftAction(g.id, "reject")} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200">✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {approvedGifts.length > 0 && (
              <div className="mt-4 space-y-2">
                {approvedGifts.map((g) => (
                  <div key={g.id} className="flex items-center gap-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                    <span className="text-emerald-600">✅</span>
                    <span className="font-medium text-gray-700">{g.from_name}</span>
                    <span className="text-gray-500">{g.amount} hrs approved</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => alert("Workday integration coming soon!")}
              className="mt-4 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100"
            >
              Export to Workday ↗
            </button>
          </div>

          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>👥</span> Team Participation</h2>
            <div className="space-y-2">
              {participated.map((name) => (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-500">✅</span>
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-gray-400 text-xs">posted</span>
                </div>
              ))}
              {notYet.map((name) => (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-300">⬜</span>
                  <span className="text-gray-400">{name}</span>
                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Nudge them?</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 3: YOUR BOARD (RECEIVER) ===== */}
      {view === "receiver" && (
        <div>
          <div className="py-14 px-4 text-center text-white" style={{ background: "linear-gradient(135deg, #ec4899, #f472b6, #f9a8d4)" }}>
            <div className="text-5xl mb-4">🌟</div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              This is YOUR celebration, {board.honoree_name.split(" ")[0]}!
            </h1>
            <p className="text-white/80">Your team loves you and wanted you to know.</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold">{posts.length}</div>
                <div className="text-white/70 text-xs">messages</div>
              </div>
              {totalApprovedHrs > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-extrabold">{totalApprovedHrs}</div>
                  <div className="text-white/70 text-xs">hrs gifted</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-extrabold">{badges.length}</div>
                <div className="text-white/70 text-xs">badges</div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">💌 Messages from your team</h2>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`rounded-2xl p-5 ${post.is_manager_note ? "border-2 border-indigo-300 bg-indigo-50" : "bg-white border shadow-sm"}`}
                    style={post.is_manager_note ? {} : { borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: post.author_avatar_color }}>
                        {initials(post.author_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{post.author_name}</div>
                        {post.is_manager_note === 1 && <div className="text-xs text-indigo-500">📌 Your Manager</div>}
                      </div>
                    </div>
                    {post.photo_url && <img src={post.photo_url} alt="photo" className="w-full rounded-xl mb-3 object-cover max-h-64" />}
                    {post.gif_url && <img src={post.gif_url} alt="gif" className="w-full rounded-xl mb-3 object-cover max-h-52" />}
                    {post.audio_url && (
                      <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3 mb-3">
                        <span className="text-xl">🎙</span>
                        <audio controls src={post.audio_url} className="flex-1 h-8" />
                      </div>
                    )}
                    {post.message && <p className="text-gray-700 text-sm leading-relaxed">{post.message}</p>}
                    {post.reaction && <div className="text-2xl mt-2">{post.reaction}</div>}
                  </div>
                ))}
              </div>
            </div>

            {badges.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">🏅 Your Badges</h2>
                <div className="flex flex-wrap gap-3">
                  {badges.map((b) => {
                    const meta = BADGE_META[b.badge_type] ?? { icon: "🏅", color: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={b.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold ${meta.color} shadow-sm`}>
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <div className="capitalize">{b.badge_type.replace(/_/g, " ")}</div>
                          {b.reason && <div className="text-xs opacity-70 font-normal">{b.reason}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => alert("Download coming soon!")}
                className="px-8 py-3 rounded-full text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
              >
                📥 Download My Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
