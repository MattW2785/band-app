"use client";

import { useRef, useState } from "react";
import EmojiPicker from "./emoji-picker";
import SavedTextsPicker from "./saved-texts-picker";

const COMMENT_LIMIT = 2200;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FirstCommentModal({
  open,
  initialValue,
  onClose,
  onAccept,
}: {
  open: boolean;
  initialValue: string;
  onClose: () => void;
  onAccept: (value: string) => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  const [prevOpen, setPrevOpen] = useState(open);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(initialValue);
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setDraft((prev) => prev + text);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + text + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Aggiungi il primo commento</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 dark:text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Aggiungi il primo commento al tuo post.</p>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-within:border-violet-500">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={COMMENT_LIMIT}
              rows={5}
              placeholder="Scrivi il primo commento che verrà pubblicato sul tuo post..."
              className="w-full resize-none bg-transparent px-3 py-2.5 text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <div className="flex items-center justify-between px-2.5 pb-2.5">
              <div className="flex items-center gap-1.5">
                <EmojiPicker onSelect={insertAtCursor} />
                <SavedTextsPicker kind="COMMENT" onInsert={insertAtCursor} label="Commenti salvati" />
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {draft.length} / {COMMENT_LIMIT}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => onAccept(draft)}
            className="rounded-lg bg-gradient-to-b from-violet-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-400 hover:to-indigo-500"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
