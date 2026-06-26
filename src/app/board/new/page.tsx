"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MILESTONE_TYPES = [
  { type: "birthday", emoji: "🎂", label: "Birthday", values_tag: "Win Together" },
  { type: "promotion", emoji: "🚀", label: "Promotion", values_tag: "Move with Urgency" },
  { type: "new_hire", emoji: "👋", label: "New Hire Welcome", values_tag: "Win Together" },
  { type: "work_anniversary", emoji: "🥂", label: "Work Anniversary", values_tag: "Win Together" },
  { type: "wedding", emoji: "💍", label: "Wedding", values_tag: "Win Together" },
  { type: "new_baby", emoji: "👶", label: "New Baby", values_tag: "Win Together" },
  { type: "get_well", emoji: "💐", label: "Get Well", values_tag: "Win Together" },
  { type: "personal_achievement", emoji: "🌟", label: "Personal Achievement", values_tag: "Be Bold" },
];

const TITLE_TEMPLATES: Record<string, string> = {
  birthday: "Happy Birthday, {name}! 🎂",
  promotion: "Congrats on the promo, {name}! 🚀",
  new_hire: "Welcome to Applied, {name}! 👋",
  work_anniversary: "Happy Work Anniversary, {name}! 🥂",
  wedding: "Congrats on your wedding, {name}! 💍",
  new_baby: "Welcome to the family, {name}! 👶",
  get_well: "Wishing you a speedy recovery, {name}! 💐",
  personal_achievement: "You crushed it, {name}! 🌟",
};

export default function NewBoardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({
    honoree_name: "", honoree_email: "", title: "", description: "",
    milestone_date: "", is_private: false, requires_gift_approval: true,
    gift_manager_email: "", created_by_name: "", created_by: "",
  });
  const [created, setCreated] = useState<{ id: string; share_token: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function selectType(t: typeof MILESTONE_TYPES[0]) {
    setSelectedType(t.type);
    setStep(2);
  }

  function handleNameBlur() {
    if (form.honoree_name && selectedType) {
      const template = TITLE_TEMPLATES[selectedType] ?? "Happy {name}!";
      const first = form.honoree_name.split(" ")[0];
      if (!form.title) {
        setForm((f) => ({ ...f, title: template.replace("{name}", first) }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const typeInfo = MILESTONE_TYPES.find((t) => t.type === selectedType);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: selectedType, values_tag: typeInfo?.values_tag ?? "Win Together" }),
    });
    const data = await res.json();
    setCreated(data);
    setStep(3);
    setLoading(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === 3 && created) {
    const boardUrl = `${window.location.origin}/board/${created.id}`;
    const shareUrl = `${window.location.origin}/c/${created.share_token}`;
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "var(--bg)" }}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Board Created!</h1>
          <p className="text-gray-500 mb-8">Your celebration board is live. Share it with the team!</p>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-4 text-left" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs text-gray-400 mb-1 font-medium">Board URL</div>
              <div className="text-sm font-mono text-indigo-600 truncate mb-2">{boardUrl}</div>
              <button
                onClick={() => copyToClipboard(boardUrl)}
                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 transition-colors"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <div className="bg-white rounded-2xl border p-4 text-left" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs text-gray-400 mb-1 font-medium">Public Share URL</div>
              <div className="text-sm font-mono text-pink-600 truncate mb-2">{shareUrl}</div>
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="text-xs bg-pink-50 text-pink-600 px-3 py-1 rounded-full font-medium hover:bg-pink-100 transition-colors"
              >
                Copy share link
              </button>
            </div>
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/board/${created.id}`)}
              className="px-6 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
            >
              View Board →
            </button>
            <button
              onClick={() => { setStep(1); setCreated(null); setSelectedType(""); setForm({ honoree_name: "", honoree_email: "", title: "", description: "", milestone_date: "", is_private: false, requires_gift_approval: true, gift_manager_email: "", created_by_name: "", created_by: "" }); }}
              className="px-6 py-3 rounded-full border font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? "text-white" : "text-gray-400 bg-gray-100"}`}
                style={step >= s ? { background: "linear-gradient(135deg, #6366f1, #ec4899)" } : {}}
              >
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-12 rounded ${step > s ? "bg-indigo-400" : "bg-gray-200"}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-gray-400">{step === 1 ? "Choose milestone type" : "Board details"}</span>
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">What are we celebrating?</h1>
            <p className="text-gray-500 mb-8">Pick a milestone type to get started</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MILESTONE_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => selectType(t)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all hover:scale-105 cursor-pointer ${selectedType === t.type ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200"}`}
                >
                  <span className="text-4xl">{t.emoji}</span>
                  <span className="text-sm font-semibold text-gray-700 text-center leading-tight">{t.label}</span>
                  <span className="text-xs text-gray-400 text-center">{t.values_tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:underline mb-4 block">
                ← Change type
              </button>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Board details</h1>
              <p className="text-gray-500">Fill in the details for your celebration board</p>
            </div>

            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800">About the Honoree</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full name *</label>
                  <input
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ borderColor: "var(--border)" }}
                    value={form.honoree_name}
                    onChange={(e) => setForm((f) => ({ ...f, honoree_name: e.target.value }))}
                    onBlur={handleNameBlur}
                    placeholder="Alex Chen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Work email</label>
                  <input
                    type="email"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ borderColor: "var(--border)" }}
                    value={form.honoree_email}
                    onChange={(e) => setForm((f) => ({ ...f, honoree_email: e.target.value }))}
                    placeholder="alex@applied.co"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800">Board Content</h2>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title *</label>
                <input
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  style={{ borderColor: "var(--border)" }}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Happy Birthday, Alex! 🎂"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  style={{ borderColor: "var(--border)" }}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="A few words about what we're celebrating..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Milestone date</label>
                <input
                  type="date"
                  className="border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  style={{ borderColor: "var(--border)" }}
                  value={form.milestone_date}
                  onChange={(e) => setForm((f) => ({ ...f, milestone_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800">Settings</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative ${!form.is_private ? "bg-indigo-500" : "bg-gray-300"}`}
                  onClick={() => setForm((f) => ({ ...f, is_private: !f.is_private }))}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${!form.is_private ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Public share link</div>
                  <div className="text-xs text-gray-400">Anyone with the link can view</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.requires_gift_approval ? "bg-indigo-500" : "bg-gray-300"}`}
                  onClick={() => setForm((f) => ({ ...f, requires_gift_approval: !f.requires_gift_approval }))}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.requires_gift_approval ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Require gift approval</div>
                  <div className="text-xs text-gray-400">Manager must approve time-off gifts</div>
                </div>
              </label>
              {form.requires_gift_approval && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Gift manager email</label>
                  <input
                    type="email"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ borderColor: "var(--border)" }}
                    value={form.gift_manager_email}
                    onChange={(e) => setForm((f) => ({ ...f, gift_manager_email: e.target.value }))}
                    placeholder="manager@applied.co"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-gray-800">About You</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your name *</label>
                  <input
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ borderColor: "var(--border)" }}
                    value={form.created_by_name}
                    onChange={(e) => setForm((f) => ({ ...f, created_by_name: e.target.value }))}
                    placeholder="Jordan Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Your email *</label>
                  <input
                    type="email"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    style={{ borderColor: "var(--border)" }}
                    value={form.created_by}
                    onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))}
                    placeholder="jordan@applied.co"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
            >
              {loading ? "Creating..." : "🎉 Create Celebration Board"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
