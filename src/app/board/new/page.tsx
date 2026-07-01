"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

type MilestoneType = {
  key: string;
  emoji: string;
  label: string;
  tag: string;   // stored value name
  cheer: string; // affirmation shown on the card
};

const TYPES: MilestoneType[] = [
  {
    key: "birthday", emoji: "🎂", label: "Birthday",
    tag: "Win Together",
    cheer: "who's here matters · Win Together",
  },
  {
    key: "promotion", emoji: "🚀", label: "Promotion",
    tag: "Be Bold",
    cheer: "saw the opening, took it · Be Bold",
  },
  {
    key: "new_hire", emoji: "👋", label: "New Hire",
    tag: "Win Together",
    cheer: "the team is only as strong as who's in it",
  },
  {
    key: "work_anniversary", emoji: "🥂", label: "Work Anniversary",
    tag: "Move with Urgency",
    cheer: "showing up, year after year · Move with Urgency",
  },
  {
    key: "wedding", emoji: "💍", label: "Wedding",
    tag: "Win Together",
    cheer: "the biggest commitment, made together",
  },
  {
    key: "new_baby", emoji: "👶", label: "New Baby",
    tag: "Win Together",
    cheer: "family is the original team",
  },
  {
    key: "get_well", emoji: "💐", label: "Get Well",
    tag: "Win Together",
    cheer: "real teams don't wait · they show up",
  },
  {
    key: "personal_achievement", emoji: "🌟", label: "Personal Achievement",
    tag: "Be Bold",
    cheer: "hard goal, clear-eyed pursuit, done",
  },
];

const TITLE_TEMPLATES: Record<string, (name: string) => string> = {
  birthday: (n) => `Happy Birthday, ${n}! 🎂`,
  promotion: (n) => `Congrats on your Promotion, ${n}! 🚀`,
  new_hire: (n) => `Welcome to the Team, ${n}! 👋`,
  work_anniversary: (n) => `Happy Work Anniversary, ${n}! 🥂`,
  wedding: (n) => `Congratulations, ${n}! 💍`,
  new_baby: (n) => `Welcome Baby, ${n}! 👶`,
  get_well: (n) => `Wishing You a Speedy Recovery, ${n}! 💐`,
  personal_achievement: (n) => `Cheers to You, ${n}! 🌟`,
};

const APPLIED_VALUES = [
  {
    value: "Win Together",
    cheer: "no one wins alone",
    detail: "Recognising that the team made this possible. Shared effort, shared credit.",
  },
  {
    value: "Be Bold",
    cheer: "saw the opening, took it",
    detail: "Celebrating a risk taken, a hard goal pursued, a ceiling raised",
  },
  {
    value: "Move with Urgency",
    cheer: "bias to action, no waiting",
    detail: "Honouring consistency, momentum, and showing up without being asked",
  },
];

const COVER_COLORS = [
  "#1558D6","#0E3EA0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9",
];

type FormData = {
  honoreeName: string;
  honoreeEmail: string;
  title: string;
  description: string;
  milestoneDate: string;
  creatorName: string;
  creatorEmail: string;
  coverColor: string;
  privacy: "public" | "private";
  managerApproval: "yes" | "no";
  managerEmail: string;
  closeDays: number;
  valuesTag: string;
};

type CreatedBoard = {
  id: string;
  share_token: string;
};

export default function NewBoardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<MilestoneType | null>(null);
  const [form, setForm] = useState<FormData>({
    honoreeName: "",
    honoreeEmail: "",
    title: "",
    description: "",
    milestoneDate: "",
    creatorName: "",
    creatorEmail: "",
    privacy: "public",
    managerApproval: "no",
    managerEmail: "",
    closeDays: 30,
    valuesTag: "",
    coverColor: "#1558D6",
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedBoard | null>(null);
  const [copied, setCopied] = useState<"board" | "share" | null>(null);

  useEffect(() => {
    if (step === 3 && created) {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.4 } });
    }
  }, [step, created]);

  function handleTypeSelect(t: MilestoneType) {
    setSelectedType(t);
    setForm(f => ({ ...f, valuesTag: t.tag }));
    setStep(2);
  }

  function handleHonoreeBlur() {
    if (selectedType && form.honoreeName && !form.title) {
      const first = form.honoreeName.split(" ")[0];
      setForm((f) => ({
        ...f,
        title: TITLE_TEMPLATES[selectedType.key]?.(first) ?? f.title,
      }));
    }
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    setLoading(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType.key,
          values_tag: form.valuesTag || selectedType.tag,
          honoree_avatar_color: form.coverColor,
          honoree_name: form.honoreeName,
          honoree_email: form.honoreeEmail,
          title: form.title,
          description: form.description,
          milestone_date: form.milestoneDate,
          created_by_name: form.creatorName,
          created_by: form.creatorEmail,
          is_private: form.privacy === "private",
          requires_gift_approval: form.managerApproval === "yes",
          gift_manager_email: form.managerEmail,
          close_days: form.closeDays,
        }),
      });
      if (!res.ok) throw new Error("Failed to create board");
      const data = (await res.json()) as CreatedBoard;
      setCreated(data);
      setStep(3);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string, which: "board" | "share") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  function resetForm() {
    setStep(1);
    setSelectedType(null);
    setCreated(null);
    setForm({
      honoreeName: "", honoreeEmail: "", title: "", description: "",
      milestoneDate: "", creatorName: "", creatorEmail: "",
      privacy: "public", managerApproval: "no", managerEmail: "", closeDays: 30, valuesTag: "", coverColor: "#1558D6",
    });
  }

  /* ── STEP 1: Milestone type picker ── */
  if (step === 1) {
    return (
      <div className="min-h-screen px-4 py-16" style={{ background: "var(--bg)" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Create a Cheer Board</h1>
          <p className="text-gray-500 text-center mb-10">Pick the milestone you&apos;re celebrating</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTypeSelect(t)}
                className="group relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-transparent bg-white
                  shadow-sm hover:shadow-md hover:scale-105 active:scale-95
                  transition-all duration-150 focus:outline-none"
                style={{ outline: "none" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
              >
                <span className="absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--accent)" }} />
                <span className="text-4xl">{t.emoji}</span>
                <span className="text-sm font-semibold text-gray-700 text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 2: Details form ── */
  if (step === 2 && selectedType) {
    return (
      <div className="min-h-screen px-4 py-12" style={{ background: "var(--bg)" }}>
        <div className="max-w-xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s <= step ? "text-white" : "text-gray-400 bg-gray-100"}`}
                  style={s <= step ? { background: "var(--accent)" } : {}}
                >
                  {s}
                </div>
                {s < 2 && <div className={`h-0.5 w-10 rounded`} style={{ background: step > s ? "var(--accent)" : "var(--border)" }} />}
              </div>
            ))}
            <span className="ml-2 text-sm text-gray-400">Step 2 of 2</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            Tell us about {selectedType.emoji} {selectedType.label}
          </h1>
          <p className="text-gray-500 text-sm mb-8">Fill in the details to create the board.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honoree */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Honoree</h2>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full name <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={form.honoreeName}
                  onChange={(e) => setField("honoreeName", e.target.value)}
                  onBlur={handleHonoreeBlur}
                  placeholder="e.g. Alex Johnson"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Work email <span className="text-red-500">*</span></label>
                <input
                  required
                  type="email"
                  value={form.honoreeEmail}
                  onChange={(e) => setField("honoreeEmail", e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {/* Board content */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Board Content</h2>

              {/* Applied value */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Applied value this celebrates</label>
                <div className="grid grid-cols-3 gap-2">
                  {APPLIED_VALUES.map(v => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setField("valuesTag", v.value)}
                      className="flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all"
                      style={form.valuesTag === v.value
                        ? { borderColor: "var(--accent)", background: "var(--accent-light)" }
                        : { borderColor: "var(--border)", background: "#fff" }}>
                      <span className="text-xs font-semibold leading-tight" style={{ color: form.valuesTag === v.value ? "var(--accent)" : "var(--text)" }}>
                        {v.value}
                      </span>
                      <span className="text-[10px] mt-1 leading-tight italic" style={{ color: form.valuesTag === v.value ? "var(--accent)" : "var(--muted)", opacity: 0.85 }}>
                        {v.cheer}
                      </span>
                      <span className="text-[10px] mt-1.5 leading-snug" style={{ color: "var(--muted)" }}>
                        {v.detail}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Board title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Auto-filled after entering name above"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Add context or a personal message..."
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none resize-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Milestone date <span className="text-gray-400">(optional)</span></label>
                <input
                  type="date"
                  value={form.milestoneDate}
                  onChange={(e) => setField("milestoneDate", e.target.value)}
                  className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {/* Creator */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Who&apos;s creating this?</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your name</label>
                  <input
                    type="text"
                    value={form.creatorName}
                    onChange={(e) => setField("creatorName", e.target.value)}
                    placeholder="Your name"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your email</label>
                  <input
                    type="email"
                    value={form.creatorEmail}
                    onChange={(e) => setField("creatorEmail", e.target.value)}
                    placeholder="you@company.com"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Settings</h2>

              {/* Cover color */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Board color</label>
                <div className="flex gap-2 flex-wrap">
                  {COVER_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setField("coverColor", c)}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{ background: c, outline: form.coverColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }} />
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Privacy</label>
                <div className="flex gap-3">
                  {(["public", "private"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField("privacy", p)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${form.privacy === p ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-blue-200"}`}
                    >
                      {p === "public" ? "🌐 Public" : "🔒 Private"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {form.privacy === "public" ? "Anyone with the link can view and post." : "Only invited people can view and post."}
                </p>
              </div>

              {/* Manager approval */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Manager approval for time-off gifts?</label>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((v) => (
                    <label
                      key={v}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-colors ${form.managerApproval === v ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-blue-200"}`}
                    >
                      <input
                        type="radio"
                        name="managerApproval"
                        value={v}
                        checked={form.managerApproval === v}
                        onChange={() => setField("managerApproval", v)}
                        className="sr-only"
                      />
                      {v === "yes" ? "✅ Yes" : "🚫 No"}
                    </label>
                  ))}
                </div>
              </div>

              {form.managerApproval === "yes" && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Manager email</label>
                  <input
                    type="email"
                    value={form.managerEmail}
                    onChange={(e) => setField("managerEmail", e.target.value)}
                    placeholder="manager@company.com"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:outline-none"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              )}

              {/* Close days */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Board closes in</label>
                <div className="flex gap-2">
                  {[7, 14, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setField("closeDays", d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${form.closeDays === d ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-blue-200"}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loading ? "Creating…" : "🎉 Create Board"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── STEP 3: Success ── */
  if (step === 3 && created) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const boardUrl = `${origin}/board/${created.id}`;
    const shareUrl = `${origin}/c/${created.share_token}`;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "var(--bg)" }}>
        <div className="max-w-md w-full text-center">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Board Created!</h1>
          <p className="text-gray-500 mb-8">Share the links below and let the cheers roll in.</p>

          <div className="space-y-3 mb-8">
            <div className="bg-white rounded-2xl border p-4 text-left" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Board URL (internal)</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate font-mono" style={{ color: "var(--accent)" }}>{boardUrl}</span>
                <button
                  onClick={() => copyText(boardUrl, "board")}
                  className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  {copied === "board" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-4 text-left" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Public Share URL</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate font-mono" style={{ color: "var(--muted)" }}>{shareUrl}</span>
                <button
                  onClick={() => copyText(shareUrl, "share")}
                  className="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {copied === "share" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/board/${created.id}`)}
              className="w-full py-3 rounded-2xl text-white font-bold transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              View Board →
            </button>
            <button
              onClick={resetForm}
              className="w-full py-3 rounded-2xl border font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              Create Another Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
