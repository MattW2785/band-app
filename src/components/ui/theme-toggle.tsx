"use client";

import { Moon, Sun } from "lucide-react";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {}
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambia tema chiaro/scuro"
      className={
        className ??
        "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      }
    >
      <Sun className="h-4 w-4 dark:hidden" strokeWidth={2} />
      <Moon className="hidden h-4 w-4 dark:block" strokeWidth={2} />
    </button>
  );
}
