"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavClient() {
  const pathname = usePathname();
  // Hide nav on public share pages
  if (pathname?.startsWith("/c/")) return null;

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--accent)" }}>
          <span className="text-2xl">🎉</span>
          <span>Cheers from Applied</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${pathname === "/" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Browse Boards
          </Link>
          <Link
            href="/badges"
            className={`text-sm font-medium transition-colors ${pathname === "/badges" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Badges
          </Link>
          <Link
            href="/board/new"
            className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))" }}
          >
            + New Cheer
          </Link>
        </div>
      </div>
    </nav>
  );
}
