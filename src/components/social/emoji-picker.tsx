"use client";

import { useEffect, useRef, useState } from "react";

const RECENT_STORAGE_KEY = "emojiPicker.recent";
const MAX_RECENT = 24;

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smiley ed emoticon",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤩",
      "🥳", "😇", "🙂", "😉", "😏", "😅", "😆", "🤗", "🤔", "🤫",
      "😴", "😭", "😢", "😡", "🥺", "😱", "😳", "🤯", "🙄", "😬",
      "🤤", "😜", "😝", "🤪", "🥴", "😷", "🤒", "🤝", "👏", "🙌",
    ],
  },
  {
    label: "Gesti e persone",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👋", "🙏", "💪",
      "👀", "🧠", "🦵", "🕺", "💃", "🚶", "🏃", "🧑‍💻", "👩‍🎤", "🧘",
    ],
  },
  {
    label: "Cuori e simboli",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💕",
      "💖", "💗", "💓", "💞", "✨", "🔥", "⭐", "🌟", "💯", "✅",
      "❌", "❓", "❗", "⚡", "🎉", "🎊", "🎁", "🏆", "🚀", "📌",
    ],
  },
  {
    label: "Natura e oggetti",
    emojis: [
      "🌞", "🌈", "🌸", "🌺", "🌊", "🍀", "🎵", "🎬", "📸", "📱",
      "💻", "🕒", "📅", "🔗", "💡", "🎯", "🛒", "💰", "📈", "🌍",
    ],
  },
];

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(emoji: string) {
  if (typeof window === "undefined") return;
  const current = loadRecent();
  const next = [emoji, ...current.filter((e) => e !== emoji)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // best-effort: se il localStorage non è disponibile non blocchiamo l'inserimento dell'emoji
  }
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10.5h.01M15.5 10.5h.01" strokeLinecap="round" />
      <path d="M8 15c1 1.2 2.4 1.8 4 1.8s3-.6 4-1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function EmojiPicker({
  onSelect,
  label = "Aggiungi emoji",
}: {
  onSelect: (emoji: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [prevOpen, setPrevOpen] = useState(open);
  const containerRef = useRef<HTMLDivElement>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setRecent(loadRecent());
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handlePick(emoji: string) {
    onSelect(emoji);
    saveRecent(emoji);
    setRecent(loadRecent());
  }

  const trimmedQuery = query.trim();
  const filteredCategories = trimmedQuery
    ? [{ label: "Risultati", emojis: ALL_EMOJIS.filter((e) => e.includes(trimmedQuery)) }]
    : EMOJI_CATEGORIES;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        title={label}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-300 transition-colors hover:bg-neutral-900"
      >
        <EmojiIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
          <div className="border-b border-neutral-800 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-100 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {!trimmedQuery && recent.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 px-1 text-xs font-medium text-neutral-500">Usati di frequente</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {recent.map((emoji, i) => (
                    <button
                      key={`recent-${i}`}
                      type="button"
                      onClick={() => handlePick(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-neutral-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {filteredCategories.map((cat) => (
              <div key={cat.label} className="mb-2 last:mb-0">
                <p className="mb-1 px-1 text-xs font-medium text-neutral-500">{cat.label}</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {cat.emojis.map((emoji, i) => (
                    <button
                      key={`${cat.label}-${i}`}
                      type="button"
                      onClick={() => handlePick(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-neutral-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {trimmedQuery && filteredCategories[0].emojis.length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-neutral-600">Nessun risultato</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
