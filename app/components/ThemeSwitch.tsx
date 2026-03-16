"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const icons = {
  light: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  dark: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  system: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) ?? "system";
    setTheme(stored);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    localStorage.setItem("theme", t);
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }

  const options: Theme[] = ["light", "dark", "system"];

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-0.5 rounded-full border border-black/10 bg-white/80 px-1 py-1 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-black/40">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => apply(opt)}
          title={opt.charAt(0).toUpperCase() + opt.slice(1)}
          className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${theme === opt
            ? "bg-[#44A194] text-white"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-700 dark:hover:text-zinc-100"
            }`}
        >
          {icons[opt]}
        </button>
      ))}
    </div>
  );
}
