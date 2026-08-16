"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker from "./emoji-picker";

type SavedText = {
  id: string;
  title: string | null;
  tags: string[];
  body: string;
};

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SavedTextsPicker({
  kind,
  onInsert,
  label = "Testi salvati",
}: {
  kind: "CAPTION" | "COMMENT";
  onInsert: (text: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");
  const [items, setItems] = useState<SavedText[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newBody, setNewBody] = useState("");
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/saved-texts?kind=${kind}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? `Recupero testi salvati fallito (${res.status})`);
        return;
      }
      setItems(data.savedTexts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  const itemsRequestedRef = useRef(false);
  useEffect(() => {
    if (!open || itemsRequestedRef.current) return;
    itemsRequestedRef.current = true;
    fetchItems();
  }, [open, fetchItems]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView("list");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleDelete(id: string) {
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    await fetch(`/api/saved-texts/${id}`, { method: "DELETE" }).catch(() => null);
  }

  async function handleSave() {
    if (!newBody.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/saved-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: newTitle,
          tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
          body: newBody,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? `Salvataggio fallito (${res.status})`);
        return;
      }
      setItems((prev) => [data.savedText, ...(prev ?? [])]);
      setNewTitle("");
      setNewTags("");
      setNewBody("");
      setView("list");
    } finally {
      setSaving(false);
    }
  }

  function handleInsert(text: string) {
    onInsert(text);
    setOpen(false);
    setView("list");
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        title={label}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
      >
        <FolderIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-80 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
          {view === "list" ? (
            <div className="flex max-h-96 flex-col">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                <button
                  type="button"
                  onClick={() => setView("create")}
                  className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-500"
                >
                  Nuovo testo
                </button>
              </div>
              <div className="overflow-y-auto p-2">
                {loading && <p className="px-2 py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">Caricamento...</p>}
                {error && <p className="px-2 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
                {!loading && items && items.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                    <FolderIcon />
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Salva i testi che usi regolarmente e accedi rapidamente ad essi.
                    </p>
                  </div>
                )}
                {items?.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <button
                      type="button"
                      onClick={() => handleInsert(item.body)}
                      className="min-w-0 flex-1 text-left"
                    >
                      {item.title && (
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      )}
                      <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{item.body}</p>
                      {item.tags.length > 0 && (
                        <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-600">
                          {item.tags.map((t) => `#${t}`).join(" ")}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      aria-label="Elimina"
                      className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-600 opacity-0 transition-opacity hover:text-red-500 dark:hover:text-red-400 group-hover:opacity-100"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col p-3">
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="Indietro"
                  className="text-zinc-400 dark:text-zinc-500 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <BackIcon />
                </button>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Nuovo testo</span>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titolo"
                className="mb-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-violet-500"
              />
              <input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Etichette (separate da virgola)"
                className="mb-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-violet-500"
              />
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Descrizione"
                rows={4}
                className="mb-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-violet-500"
              />
              <div className="flex items-center justify-between">
                <EmojiPicker onSelect={(emoji) => setNewBody((prev) => prev + emoji)} />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !newBody.trim()}
                  className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
