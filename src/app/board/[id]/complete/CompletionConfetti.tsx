"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function CompletionConfetti({ color }: { color: string }) {
  useEffect(() => {
    const end = Date.now() + 2000;
    const colors = [color, "#1558D6", "#ffffff", "#EDF2FC"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [color]);
  return null;
}
