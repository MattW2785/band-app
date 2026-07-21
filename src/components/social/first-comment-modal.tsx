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
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-100">Aggiungi il primo commento</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-2 text-sm text-neutral-400">Aggiungi il primo commento al tuo post.</p>
          <div className="rounded-lg border border-neutral-700 bg-neutral-950 focus-within:border-indigo-500">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={COMMENT_LIMIT}
              rows={5}
              placeholder="Scrivi il primo commento che verrà pubblicato sul tuo post..."
              className="w-full resize-none bg-transparent px-3 py-2.5 text-neutral-100 outline-none placeholder:text-neutral-600"
            />
            <div className="flex items-center justify-between px-2.5 pb-2.5">
              <div className="flex items-center gap-1.5">
                <EmojiPicker onSelect={insertAtCursor} />
                <SavedTextsPicker kind="COMMENT" onInsert={insertAtCursor} label="Commenti salvati" />
              </div>
              <span className="text-xs text-neutral-600">
                {draft.length} / {COMMENT_LIMIT}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => onAccept(draft)}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
