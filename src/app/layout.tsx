import type { Metadata } from "next";
import "./globals.css";
import NavClient from "./NavClient";

export const metadata: Metadata = {
  title: "Cheers from Applied — Celebrate Your Team",
  description:
    "Employee celebration boards. Send messages, GIFs, photos and voice notes for birthdays, promotions, new hires and more.",
  openGraph: {
    title: "Cheers from Applied — Celebrate Your Team",
    description:
      "Employee celebration boards. Send messages, GIFs, photos and voice notes for birthdays, promotions, new hires and more.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen"
        style={{ background: "var(--bg)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
      >
        <NavClient />
        <main>{children}</main>
      </body>
    </html>
  );
}
