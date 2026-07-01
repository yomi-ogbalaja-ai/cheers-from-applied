"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Boards", href: "/" },
  { label: "Badges", href: "/badges" },
  { label: "Year in Review", href: "/review" },
];

export default function NavClient() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", saved ?? "light");
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  if (pathname?.startsWith("/c/")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 w-full" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-base tracking-tight" style={{ color: "var(--text)" }}>
            Cheers <span style={{ color: "var(--accent)" }}>from Applied</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="text-sm transition-colors"
              style={{ color: isActive(link.href) ? "var(--accent)" : "var(--muted)", fontWeight: isActive(link.href) ? 500 : 400 }}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="text-lg"
            style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer" }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link href="/board/new"
            className="text-sm font-medium px-4 py-2 rounded-md text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            New Board
          </Link>
        </div>

        <button className="md:hidden text-xl" style={{ color: "var(--muted)" }}
          onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="text-sm py-2" style={{ color: isActive(link.href) ? "var(--accent)" : "var(--muted)" }}>
              {link.label}
            </Link>
          ))}
          <Link href="/board/new" onClick={() => setMenuOpen(false)}
            className="text-sm font-medium px-4 py-2 rounded-md text-white text-center"
            style={{ background: "var(--accent)" }}>
            New Board
          </Link>
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="text-lg text-left"
            style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer" }}>
            {dark ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      )}
    </nav>
  );
}
