"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EmojiPicker from "@/components/social/emoji-picker";
import SavedTextsPicker from "@/components/social/saved-texts-picker";
import FirstCommentModal from "@/components/social/first-comment-modal";

type YoutubeInfo = { id: string; title: string; description: string; tags: string };
type InstagramInfo = {
  id: string;
  description: string;
  contentType: "FEED" | "REELS" | "STORIES";
  firstComment: string;
  firstCommentPosted: boolean;
};

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5H4l1.6-3.9A8.5 8.5 0 1121 11.5z" strokeLinejoin="round" />
    </svg>
  );
}

function insertAtCursor(
  el: HTMLTextAreaElement | null,
  value: string,
  text: string,
  setValue: (next: string) => void
) {
  if (!el) {
    setValue(value + text);
    return;
  }
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const next = value.slice(0, start) + text + value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    el.selectionStart = el.selectionEnd = start + text.length;
  });
}

export default function EditForm({
  postId,
  baseCaption: initialBaseCaption,
  scheduledAtLocal: initialScheduledAtLocal,
  mediaUrl,
  youtube,
  instagram,
}: {
  postId: string;
  baseCaption: string;
  scheduledAtLocal: string;
  mediaUrl: string | null;
  youtube: YoutubeInfo | null;
  instagram: InstagramInfo | null;
}) {
  const router = useRouter();
  const [baseCaption, setBaseCaption] = useState(initialBaseCaption);
  const [scheduledAtLocal, setScheduledAtLocal] = useState(initialScheduledAtLocal);
  const [title, setTitle] = useState(youtube?.title ?? "");
  const [tags, setTags] = useState(youtube?.tags ?? "");
  const [instagramCaption, setInstagramCaption] = useState(instagram?.description ?? "");
  const [instagramContentType, setInstagramContentType] = useState(instagram?.contentType ?? "FEED");
  const [firstComment, setFirstComment] = useState(instagram?.firstComment ?? "");
  const [firstCommentModalOpen, setFirstCommentModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const baseCaptionRef = useRef<HTMLTextAreaElement>(null);
  const instagramCaptionRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const targets = [];
    if (youtube) {
      targets.push({
        id: youtube.id,
        title,
        description: baseCaption,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
    }
    if (instagram) {
      targets.push({
        id: instagram.id,
        description: instagramCaption || baseCaption,
        platformExtra: { contentType: instagramContentType },
        firstComment: firstComment.trim(),
      });
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCaption, scheduledAtLocal, targets }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Modifica fallita (${res.status})`);
        return;
      }
      router.push("/social/posts");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Modifica post</h1>

      {mediaUrl && (
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
          Media invariato (per cambiare il file, elimina questo post e creane uno nuovo).
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm">
        {youtube && (
          <div>
            <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400" htmlFor="title">
              Titolo YouTube
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400" htmlFor="caption">
            Descrizione / caption {instagram && "(anche fallback per Instagram)"}
          </label>
          <textarea
            id="caption"
            ref={baseCaptionRef}
            value={baseCaption}
            onChange={(e) => setBaseCaption(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <div className="mt-1.5 flex items-center gap-1.5">
            <EmojiPicker
              onSelect={(emoji) => insertAtCursor(baseCaptionRef.current, baseCaption, emoji, setBaseCaption)}
            />
            <SavedTextsPicker
              kind="CAPTION"
              onInsert={(text) => insertAtCursor(baseCaptionRef.current, baseCaption, text, setBaseCaption)}
            />
          </div>
        </div>

        {instagram && (
          <>
            <div>
              <span className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400">Tipo contenuto Instagram</span>
              <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {(["FEED", "REELS", "STORIES"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      className="accent-violet-500"
                      name="instagramContentType"
                      checked={instagramContentType === opt}
                      onChange={() => setInstagramContentType(opt)}
                    />
                    {opt === "FEED" ? "Post in bacheca" : opt === "REELS" ? "Reel" : "Storia"}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400" htmlFor="instagramCaption">
                Caption Instagram (opzionale, sovrascrive quella sopra)
              </label>
              <textarea
                id="instagramCaption"
                ref={instagramCaptionRef}
                value={instagramCaption}
                onChange={(e) => setInstagramCaption(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <div className="mt-1.5 flex items-center gap-1.5">
                <EmojiPicker
                  onSelect={(emoji) =>
                    insertAtCursor(instagramCaptionRef.current, instagramCaption, emoji, setInstagramCaption)
                  }
                />
                <SavedTextsPicker
                  kind="CAPTION"
                  onInsert={(text) =>
                    insertAtCursor(instagramCaptionRef.current, instagramCaption, text, setInstagramCaption)
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setFirstCommentModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <CommentIcon />
                  {firstComment.trim() ? "Primo commento aggiunto" : "Aggiungi il primo commento"}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {instagram.firstCommentPosted ? "Già pubblicato" : firstComment.trim() ? "Modifica" : "Facoltativo"}
                </span>
              </button>
              {firstComment.trim() && (
                <p className="mt-1 line-clamp-1 text-xs text-zinc-400 dark:text-zinc-600">{firstComment.trim()}</p>
              )}
              <FirstCommentModal
                open={firstCommentModalOpen}
                initialValue={firstComment}
                onClose={() => setFirstCommentModalOpen(false)}
                onAccept={(value) => {
                  setFirstComment(value);
                  setFirstCommentModalOpen(false);
                }}
              />
            </div>
          </>
        )}

        {youtube && (
          <div>
            <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400" htmlFor="tags">
              Tag YouTube (separati da virgola)
            </label>
            <input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400" htmlFor="scheduledAt">
            Data e ora di pubblicazione
          </label>
          <input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAtLocal}
            onChange={(e) => setScheduledAtLocal(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-b from-violet-500 to-indigo-600 px-3 py-2.5 font-medium text-white shadow-sm transition-all hover:from-violet-400 hover:to-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Salvataggio..." : "Salva modifiche"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/social/posts")}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
