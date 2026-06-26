"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Boards", href: "/" },
  { label: "Badges", href: "/badges" },
];

export default function NavClient() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname?.startsWith("/c/")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--accent)" }}>
            A
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--navy)" }}>
            Cheers <span style={{ color: "var(--accent)" }}>from Applied</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors"
              style={{ color: isActive(link.href) ? "var(--accent)" : "var(--muted)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link
            href="/board/new"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            + New Cheer
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-2xl leading-none"
          style={{ color: "var(--muted)" }}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block w-full text-sm py-2 font-medium"
              style={{ color: isActive(link.href) ? "var(--accent)" : "var(--muted)" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/board/new"
            onClick={() => setMenuOpen(false)}
            className="block w-full rounded-full px-4 py-2 text-sm font-semibold text-white text-center shadow-sm"
            style={{ background: "var(--accent)" }}
          >
            + New Cheer
          </Link>
        </div>
      )}
    </nav>
  );
}
