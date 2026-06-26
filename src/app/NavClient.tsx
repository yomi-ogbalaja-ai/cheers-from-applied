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
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🎉</span>
          <span
            className="font-bold text-lg"
            style={{
              background: "linear-gradient(to right, #4f46e5, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Cheers from Applied
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-indigo-600 font-semibold text-sm"
                  : "text-gray-600 hover:text-indigo-600 text-sm transition-colors"
              }
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
            style={{
              background: "linear-gradient(to right, #4f46e5, #ec4899)",
            }}
          >
            + New Cheer
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-600 hover:text-indigo-600 text-2xl leading-none"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={
                isActive(link.href)
                  ? "block w-full text-indigo-600 font-semibold text-sm py-2"
                  : "block w-full text-gray-600 hover:text-indigo-600 text-sm py-2 transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/board/new"
            onClick={() => setMenuOpen(false)}
            className="block w-full text-gray-600 hover:text-indigo-600 text-sm py-2 transition-colors"
          >
            Create Board
          </Link>
          <Link
            href="/board/new"
            onClick={() => setMenuOpen(false)}
            className="block w-full rounded-full px-4 py-2 text-sm font-semibold text-white text-center shadow-sm"
            style={{
              background: "linear-gradient(to right, #4f46e5, #ec4899)",
            }}
          >
            + New Cheer
          </Link>
        </div>
      )}
    </nav>
  );
}
