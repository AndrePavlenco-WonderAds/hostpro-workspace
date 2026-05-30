"use client";

import { useEffect, useState } from "react";

/**
 * Types out the given text one character at a time when first mounted.
 * Used on the home hero so the claim animates in instead of just appearing.
 */
export function Typewriter({
  text,
  speedMs = 55,
  startDelayMs = 250,
  className = "",
  caretClassName = "",
}: {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  caretClassName?: string;
}) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    let i = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDone(true);
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speedMs, startDelayMs]);

  return (
    <span className={className}>
      {shown}
      <span
        aria-hidden
        className={`inline-block w-[0.08em] align-baseline ${caretClassName} ${
          done ? "animate-pulse" : ""
        }`}
        style={{
          background: "currentColor",
          height: "0.95em",
          marginLeft: "0.05em",
          transform: "translateY(0.12em)",
        }}
      />
    </span>
  );
}
