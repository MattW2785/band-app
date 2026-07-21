"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DateTimePicker from "./datetime-picker";
import EmojiPicker from "@/components/social/emoji-picker";
import SavedTextsPicker from "@/components/social/saved-texts-picker";
import FirstCommentModal from "@/components/social/first-comment-modal";

type PlatformKey = "YOUTUBE" | "INSTAGRAM";
type InstagramContentType = "FEED" | "REELS" | "STORIES";

const INSTAGRAM_CAPTION_LIMIT = 2200;
const YOUTUBE_DESCRIPTION_LIMIT = 5000;

const CONTENT_TYPE_INFO: Record<InstagramContentType, { label: string; description: string; Icon: () => React.ReactElement }> = {
  FEED: {
    label: "Post",
    description: "Pubblicazione automatica di un'immagine o di un carosello",
    Icon: GridIcon,
  },
  REELS: {
    label: "Reel",
    description: "Pubblicazione automatica di un video",
    Icon: ReelIcon,
  },
  STORIES: {
    label: "Storia",
    description: "Pubblicazione automatica di una o più storie",
    Icon: StoryIcon,
  },
};

type YoutubeContentType = "VIDEO" | "SHORT";

const YOUTUBE_CONTENT_TYPE_ORDER: readonly YoutubeContentType[] = ["VIDEO", "SHORT"];

const YOUTUBE_CONTENT_TYPE_INFO: Record<YoutubeContentType, { label: string; description: string; Icon: () => React.ReactElement }> = {
  VIDEO: {
    label: "Video",
    description: "Video YouTube standard",
    Icon: VideoIcon,
  },
  SHORT: {
    label: "Short",
    description: "Contenuti video verticali in formato breve",
    Icon: ShortIcon,
  },
};

const YOUTUBE_CATEGORIES: readonly { id: string; label: string }[] = [
  { id: "1", label: "Film e animazione" },
  { id: "2", label: "Autoveicoli" },
  { id: "10", label: "Musica" },
  { id: "15", label: "Animali" },
  { id: "17", label: "Sport" },
  { id: "19", label: "Viaggi ed eventi" },
  { id: "20", label: "Gaming" },
  { id: "22", label: "Persone e blog" },
  { id: "23", label: "Commedia" },
  { id: "24", label: "Intrattenimento" },
  { id: "25", label: "News e politica" },
  { id: "26", label: "Come fare e stile" },
  { id: "27", label: "Istruzione" },
  { id: "28", label: "Scienza e tecnologia" },
  { id: "29", label: "No profit e attivismo" },
];

type SubmitMode = "SCHEDULE" | "DRAFT" | "PUBLISH_NOW";

const SUBMIT_MODE_ORDER: readonly SubmitMode[] = ["DRAFT", "SCHEDULE", "PUBLISH_NOW"];

const SUBMIT_MODE_INFO: Record<SubmitMode, { label: string; description: string }> = {
  DRAFT: { label: "Salva come bozza", description: "Salva e pubblica in un secondo momento" },
  SCHEDULE: { label: "Programma", description: "Salva e programma il post" },
  PUBLISH_NOW: { label: "Pubblica ora", description: "Pubblica con data e ora correnti" },
};

function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="14" rx="3" />
      <circle cx="12" cy="14" r="4" />
      <path d="M8 7l1.5-3h5L16 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 20s-7-4.35-9.5-8.5C.5 8 2 4.5 5.5 4.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 15.65 12 20 12 20z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5H4l1.6-3.9A8.5 8.5 0 1121 11.5z" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-5M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M21 8l-4 3 4 3V8z" strokeLinejoin="round" />
    </svg>
  );
}

function ShortIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ReelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function YoutubeBadgeIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-600">
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 15a8 8 0 0014.5 3.5M19.5 9A8 8 0 005 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CONTENT_TYPE_ORDER: readonly InstagramContentType[] = ["FEED", "REELS", "STORIES"];

type ContentTypeMeta = { label: string; description: string; Icon: () => React.ReactElement };

function ContentTypeDropdown<T extends string>({
  value,
  order,
  info,
  disabledReasons,
  onChange,
}: {
  value: T;
  order: readonly T[];
  info: Record<T, ContentTypeMeta>;
  disabledReasons?: Partial<Record<T, string>>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = info[value];
  const CurrentIcon = current.Icon;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-900"
      >
        <CurrentIcon />
        {current.label.toUpperCase()}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          {order.map((opt) => {
            const optInfo = info[opt];
            const Icon = optInfo.Icon;
            const selected = opt === value;
            const disabledReason = disabledReasons?.[opt];
            return (
              <button
                key={opt}
                type="button"
                disabled={!!disabledReason}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  disabledReason ? "cursor-not-allowed opacity-40" : "hover:bg-neutral-800"
                } ${selected ? "bg-neutral-800/60" : ""}`}
              >
                <span className="mt-0.5 text-neutral-400">
                  <Icon />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-neutral-100">{optInfo.label}</span>
                  <span className="block text-xs text-neutral-500">{disabledReason ?? optInfo.description}</span>
                </span>
                {selected && !disabledReason && (
                  <span className="mt-0.5 text-indigo-400">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubmitSplitButton({
  mode,
  onModeChange,
  disabled,
  submitting,
}: {
  mode: SubmitMode;
  onModeChange: (mode: SubmitMode) => void;
  disabled: boolean;
  submitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = SUBMIT_MODE_INFO[mode];

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <button
        type="submit"
        disabled={disabled || submitting}
        className="rounded-l-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Attendi..." : current.label}
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={submitting}
        aria-label="Scegli modalità di pubblicazione"
        className="rounded-r-lg border-l border-indigo-500 bg-indigo-600 px-2 py-2 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-xl">
          {SUBMIT_MODE_ORDER.map((m) => {
            const info = SUBMIT_MODE_INFO[m];
            const selected = m === mode;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onModeChange(m);
                  setOpen(false);
                }}
                className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-800 ${
                  selected ? "bg-neutral-800/60" : ""
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-neutral-100">{info.label}</span>
                  <span className="block text-xs text-neutral-500">{info.description}</span>
                </span>
                {selected && (
                  <span className="mt-0.5 shrink-0 text-indigo-400">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InstagramPreviewCard({
  accountName,
  profileImageUrl,
  mediaUrl,
  isVideo,
  caption,
}: {
  accountName: string | null;
  profileImageUrl: string | null;
  mediaUrl: string | null;
  isVideo: boolean;
  caption: string;
}) {
  const username = accountName ? accountName.replace(/^@/, "") : "il_tuo_account";
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black">
      <div className="flex items-center gap-2 border-b border-neutral-900 p-3">
        {profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profileImageUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
        )}
        <span className="text-sm font-medium text-neutral-100">{username}</span>
      </div>
      <div className="flex aspect-square w-full items-center justify-center bg-neutral-950">
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} muted playsInline autoPlay loop className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="text-sm text-neutral-600">Nessun media</span>
        )}
      </div>
      <div className="flex items-center gap-3 p-3 text-neutral-200">
        <HeartIcon />
        <CommentIcon />
        <ShareIcon />
      </div>
      {caption && (
        <p className="px-3 pb-3 text-sm text-neutral-200">
          <span className="font-medium">{username}</span> <span className="text-neutral-300">{caption}</span>
        </p>
      )}
    </div>
  );
}

function YoutubePreviewCard({
  accountName,
  profileImageUrl,
  mediaUrl,
  isVideo,
  thumbnailUrl,
  title,
}: {
  accountName: string | null;
  profileImageUrl: string | null;
  mediaUrl: string | null;
  isVideo: boolean;
  thumbnailUrl: string | null;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div className="flex aspect-video w-full items-center justify-center bg-neutral-900">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : mediaUrl && isVideo ? (
          <video src={mediaUrl} muted playsInline autoPlay loop className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-neutral-600">Nessun video</span>
        )}
      </div>
      <div className="flex gap-2 p-3">
        {profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profileImageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-full bg-red-600" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-100">{title || "Titolo del video"}</p>
          <p className="truncate text-xs text-neutral-500">{accountName || "Il tuo canale"}</p>
        </div>
      </div>
    </div>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function NewPostForm({
  initialScheduledAtLocal,
  instagramAccountName,
  instagramProfileImageUrl,
  youtubeAccountName,
  youtubeProfileImageUrl,
  timezone,
  canPublish,
}: {
  initialScheduledAtLocal?: string;
  instagramAccountName: string | null;
  instagramProfileImageUrl?: string | null;
  youtubeAccountName: string | null;
  youtubeProfileImageUrl?: string | null;
  timezone: string;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailStoragePath, setThumbnailStoragePath] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformKey>("INSTAGRAM");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const [firstComment, setFirstComment] = useState("");
  const [firstCommentModalOpen, setFirstCommentModalOpen] = useState(false);
  const [instagramContentType, setInstagramContentType] = useState<InstagramContentType>("FEED");
  const [youtubeContentType, setYoutubeContentType] = useState<YoutubeContentType>("VIDEO");
  const [madeForKids, setMadeForKids] = useState<boolean | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<"public" | "unlisted" | "private">("public");
  const [categoryId, setCategoryId] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [playlists, setPlaylists] = useState<{ id: string; title: string }[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [tags, setTags] = useState("");
  const [nowMs] = useState(() => Date.now());
  const [scheduledAtLocal, setScheduledAtLocal] = useState(
    () => initialScheduledAtLocal ?? toLocalInputValue(new Date(nowMs + 60_000))
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>(canPublish ? "SCHEDULE" : "DRAFT");

  const mediaPreviewUrl = useObjectUrl(file);
  const thumbnailPreviewUrl = useObjectUrl(thumbnailFile);
  const isVideo = file?.type.startsWith("video/") ?? false;
  const captionLimit = platform === "INSTAGRAM" ? INSTAGRAM_CAPTION_LIMIT : YOUTUBE_DESCRIPTION_LIMIT;

  // Valgono sempre, qualunque sia la modalità di invio: senza media o titolo YouTube
  // non c'è nulla da pubblicare né ora né più avanti.
  const errors: string[] = [];
  if (!mediaId) errors.push(platform === "YOUTUBE" ? "Aggiungi almeno 1 video." : "Aggiungi almeno 1 immagine o video.");
  if (platform === "YOUTUBE" && file && !isVideo) errors.push("YouTube richiede un file video.");
  if (platform === "YOUTUBE") {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length >= 100 || /[<>]/.test(trimmedTitle)) {
      errors.push(
        "Il titolo del video o dello short è obbligatorio e deve contenere meno di 100 caratteri. I caratteri < o > non sono consentiti."
      );
    }
    if (madeForKids === null) errors.push("È necessario selezionare il pubblico del video.");
  }

  // La data conta solo per "Programma": "Pubblica ora" la sovrascrive con l'istante corrente,
  // "Salva come bozza" non pubblica nulla quindi non ha vincoli di data.
  const dateErrors: string[] = [];
  if (!scheduledAtLocal) {
    dateErrors.push("Imposta data e ora di pubblicazione.");
  } else if (new Date(scheduledAtLocal).getTime() < nowMs) {
    dateErrors.push("La data di pubblicazione non può essere nel passato.");
  }

  const activeErrors = submitMode === "DRAFT" ? [] : submitMode === "PUBLISH_NOW" ? errors : [...errors, ...dateErrors];

  const fetchPlaylists = useCallback(async () => {
    setPlaylistsLoading(true);
    setPlaylistsError(null);
    try {
      const res = await fetch("/api/auth/youtube/playlists");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setPlaylistsError(data?.error ?? `Recupero playlist fallito (${res.status})`);
        return;
      }
      setPlaylists(data.playlists ?? []);
    } catch (err) {
      setPlaylistsError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlaylistsLoading(false);
    }
  }, []);

  const playlistsRequestedRef = useRef(false);
  useEffect(() => {
    if (platform !== "YOUTUBE" || playlistsRequestedRef.current) return;
    playlistsRequestedRef.current = true;
    fetchPlaylists();
  }, [platform, fetchPlaylists]);

  function insertIntoCaption(text: string) {
    const el = captionRef.current;
    if (!el) {
      setCaption((prev) => prev + text);
      return;
    }
    const start = el.selectionStart ?? caption.length;
    const end = el.selectionEnd ?? caption.length;
    const next = caption.slice(0, start) + text + caption.slice(end);
    setCaption(next.slice(0, captionLimit));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  async function handleCopyTags() {
    try {
      await navigator.clipboard.writeText(tags);
    } catch {
      // best-effort: se il clipboard non è disponibile non c'è nulla da fare
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setMediaId(null);
    if (!selected) return;
    setInstagramContentType(selected.type.startsWith("video/") ? "REELS" : "FEED");

    setUploading(true);
    setSubmitError(null);
    try {
      const signRes = await fetch("/api/media/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selected.name, contentType: selected.type, fileSize: selected.size }),
      });
      const signData = await signRes.json().catch(() => null);
      if (!signRes.ok || !signData) {
        setSubmitError(signData?.error ?? `Upload fallito (${signRes.status})`);
        return;
      }

      const putRes = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selected.type },
        body: selected,
      });
      if (!putRes.ok) {
        setSubmitError(`Upload fallito: ${putRes.status}`);
        return;
      }

      const confirmRes = await fetch("/api/media/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath: signData.storagePath,
          mimeType: selected.type,
          fileSize: selected.size,
        }),
      });
      const confirmData = await confirmRes.json().catch(() => null);
      if (!confirmRes.ok || !confirmData) {
        setSubmitError(confirmData?.error ?? `Conferma upload fallita (${confirmRes.status})`);
        return;
      }
      setMediaId(confirmData.media.id);
    } catch (err) {
      setSubmitError(`Upload fallito: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setThumbnailFile(selected);
    setThumbnailStoragePath(null);
    if (!selected) return;

    setThumbnailUploading(true);
    setSubmitError(null);
    try {
      const signRes = await fetch("/api/media/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selected.name, contentType: selected.type, fileSize: selected.size }),
      });
      const signData = await signRes.json().catch(() => null);
      if (!signRes.ok || !signData) {
        setSubmitError(signData?.error ?? `Upload miniatura fallito (${signRes.status})`);
        return;
      }

      const putRes = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selected.type },
        body: selected,
      });
      if (!putRes.ok) {
        setSubmitError(`Upload miniatura fallito: ${putRes.status}`);
        return;
      }

      setThumbnailStoragePath(signData.storagePath);
    } catch (err) {
      setSubmitError(`Upload miniatura fallito: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (activeErrors.length > 0) return;

    const targetStatus = submitMode === "DRAFT" ? "DRAFT" : "SCHEDULED";
    const effectiveScheduledAtLocal = submitMode === "PUBLISH_NOW" ? toLocalInputValue(new Date()) : scheduledAtLocal;

    const target: {
      platform: PlatformKey;
      title?: string;
      description?: string;
      tags?: string[];
      privacyStatus?: string;
      platformExtra?: Record<string, unknown>;
      firstComment?: string;
    } =
      platform === "YOUTUBE"
        ? {
            platform: "YOUTUBE",
            title,
            description: caption,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            privacyStatus,
            platformExtra: {
              contentType: youtubeContentType,
              madeForKids: madeForKids ?? false,
              ...(categoryId ? { categoryId } : {}),
              ...(playlistId ? { playlistId } : {}),
              ...(thumbnailStoragePath ? { thumbnailStoragePath } : {}),
            },
          }
        : {
            platform: "INSTAGRAM",
            description: caption,
            platformExtra: { contentType: instagramContentType },
            ...(firstComment.trim() ? { firstComment: firstComment.trim() } : {}),
          };

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseCaption: caption,
          scheduledAtLocal: effectiveScheduledAtLocal,
          mediaId,
          status: targetStatus,
          targets: [target],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Creazione post fallita");
        return;
      }
      router.push("/social/posts");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Crea nuovo post</h1>
        <Link href="/social/posts" className="text-sm text-neutral-400 transition-colors hover:text-neutral-200">
          ✕ Chiudi
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-1 text-sm">
              <button
                type="button"
                onClick={() => setPlatform("INSTAGRAM")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  platform === "INSTAGRAM" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <CameraIcon /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setPlatform("YOUTUBE")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  platform === "YOUTUBE" ? "bg-red-600 text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <PlayIcon /> YouTube
              </button>
            </div>
          </div>
          <p className="mb-4 text-xs text-neutral-600">
            Un post può essere pubblicato su una sola piattaforma. Per pubblicare lo stesso contenuto altrove, crea un
            altro post.
          </p>

          <label className="relative mb-4 flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950 transition-colors hover:border-neutral-600">
            {mediaPreviewUrl ? (
              isVideo ? (
                <video src={mediaPreviewUrl} muted playsInline autoPlay loop className="h-full w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaPreviewUrl} alt="" className="h-full w-full object-contain" />
              )
            ) : (
              <span className="flex flex-col items-center gap-2 text-neutral-500">
                <UploadIcon />
                <span className="text-sm">Carica immagine o video</span>
              </span>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
                Caricamento in corso...
              </div>
            )}
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          </label>

          {platform === "YOUTUBE" && (
            <div className="mb-4">
              <span className="mb-1 block text-sm text-neutral-400">Tipo contenuto</span>
              <ContentTypeDropdown
                value={youtubeContentType}
                order={YOUTUBE_CONTENT_TYPE_ORDER}
                info={YOUTUBE_CONTENT_TYPE_INFO}
                onChange={setYoutubeContentType}
              />
            </div>
          )}

          {platform === "YOUTUBE" && (
            <div className="mb-4">
              <label className="mb-1 block text-sm text-neutral-400">Miniatura YouTube (opzionale)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-200 hover:file:bg-neutral-700"
              />
              {thumbnailUploading && <p className="mt-1 text-xs text-indigo-300">Caricamento in corso...</p>}
              {thumbnailStoragePath && <p className="mt-1 text-xs text-emerald-400">Miniatura caricata</p>}
            </div>
          )}

          {platform === "YOUTUBE" && (
            <div className="mb-4 overflow-hidden rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setPresetsOpen((o) => !o)}
                className="flex w-full items-center justify-between bg-neutral-900/60 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-neutral-100">
                  <YoutubeBadgeIcon /> Preimpostazioni YouTube
                </span>
                <span className={`text-neutral-400 transition-transform ${presetsOpen ? "rotate-180" : ""}`}>
                  <ChevronDownIcon />
                </span>
              </button>

              {presetsOpen && (
                <div className="grid grid-cols-1 gap-4 border-t border-neutral-800 p-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-neutral-400" htmlFor="title">
                      Video o titolo breve
                    </label>
                    <input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <p className="mt-1 text-right text-xs text-neutral-600">{title.length} / 100</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-neutral-400" htmlFor="madeForKids">
                      Configurazione del pubblico
                    </label>
                    <select
                      id="madeForKids"
                      value={madeForKids === null ? "" : madeForKids ? "yes" : "no"}
                      onChange={(e) => setMadeForKids(e.target.value === "" ? null : e.target.value === "yes")}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="">Seleziona...</option>
                      <option value="no">Non è impostato per un pubblico di bambini</option>
                      <option value="yes">È impostato per un pubblico di bambini</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-neutral-400" htmlFor="privacyStatus">
                      Configurazione della privacy
                    </label>
                    <select
                      id="privacyStatus"
                      value={privacyStatus}
                      onChange={(e) => setPrivacyStatus(e.target.value as "public" | "unlisted" | "private")}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="public">Pubblico</option>
                      <option value="unlisted">Non in elenco</option>
                      <option value="private">Privato</option>
                    </select>
                    <p className="mt-1 text-xs text-neutral-600">
                      La configurazione dello stato della privacy può essere modificata su YouTube dopo la
                      pubblicazione del video o dello short.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-neutral-400" htmlFor="categoryId">
                      Categoria
                    </label>
                    <select
                      id="categoryId"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    >
                      <option value="">Nessuna categoria</option>
                      {YOUTUBE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-neutral-400" htmlFor="playlistId">
                      Aggiungi alla playlist
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="playlistId"
                        value={playlistId}
                        onChange={(e) => setPlaylistId(e.target.value)}
                        disabled={playlistsLoading}
                        className="w-full flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
                      >
                        <option value="">Nessuna playlist</option>
                        {playlists.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={fetchPlaylists}
                        disabled={playlistsLoading}
                        aria-label="Aggiorna playlist"
                        className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 text-neutral-300 transition-colors hover:bg-neutral-900 disabled:opacity-50"
                      >
                        <RefreshIcon spinning={playlistsLoading} />
                      </button>
                    </div>
                    {playlistsError && <p className="mt-1 text-xs text-red-400">{playlistsError}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-neutral-400" htmlFor="tags">
                      Etichette
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleCopyTags}
                        aria-label="Copia etichette"
                        className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 text-neutral-300 transition-colors hover:bg-neutral-900"
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {platform === "INSTAGRAM" && (
            <div className="mb-4">
              <span className="mb-1 block text-sm text-neutral-400">Tipo contenuto</span>
              <ContentTypeDropdown
                value={instagramContentType}
                order={CONTENT_TYPE_ORDER}
                info={CONTENT_TYPE_INFO}
                disabledReasons={
                  !file
                    ? {}
                    : isVideo
                      ? { FEED: "Richiede un'immagine" }
                      : { REELS: "Richiede un video" }
                }
                onChange={setInstagramContentType}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-400" htmlFor="caption">
              {platform === "INSTAGRAM" ? "Caption" : "Descrizione"}
            </label>
            <textarea
              id="caption"
              ref={captionRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              maxLength={captionLimit}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <EmojiPicker onSelect={insertIntoCaption} />
                <SavedTextsPicker kind="CAPTION" onInsert={insertIntoCaption} />
              </div>
              <p className="text-xs text-neutral-600">
                {caption.length} / {captionLimit}
              </p>
            </div>
          </div>

          {platform === "INSTAGRAM" && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setFirstCommentModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-left text-sm transition-colors hover:bg-neutral-900"
              >
                <span className="flex items-center gap-2 text-neutral-200">
                  <CommentIcon />
                  {firstComment.trim() ? "Primo commento aggiunto" : "Aggiungi il primo commento"}
                </span>
                <span className="text-xs text-neutral-500">{firstComment.trim() ? "Modifica" : "Facoltativo"}</span>
              </button>
              {firstComment.trim() && (
                <p className="mt-1 line-clamp-1 text-xs text-neutral-600">{firstComment.trim()}</p>
              )}
            </div>
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

          {activeErrors.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-900/50 bg-amber-950/30 p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-300">
                <WarningIcon /> {activeErrors.length} {activeErrors.length === 1 ? "errore" : "errori"}
              </div>
              <ul className="ml-6 list-disc space-y-0.5 text-xs text-amber-200/90">
                {activeErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && <p className="mb-4 text-sm text-red-400">{submitError}</p>}

          {!canPublish && (
            <p className="mb-4 text-xs text-neutral-500">
              Puoi salvare il post come bozza. Solo l&apos;amministratore può programmarlo o pubblicarlo.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
            <button
              type="button"
              onClick={() => router.push("/social/posts")}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Annulla
            </button>
            <div className="flex items-center gap-3">
              {canPublish ? (
                <>
                  <DateTimePicker value={scheduledAtLocal} onChange={setScheduledAtLocal} timezone={timezone} />
                  <SubmitSplitButton
                    mode={submitMode}
                    onModeChange={setSubmitMode}
                    disabled={uploading || activeErrors.length > 0}
                    submitting={submitting}
                  />
                </>
              ) : (
                <button
                  type="submit"
                  disabled={uploading || submitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Attendi..." : "Salva come bozza"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[340px]">
          <div className="flex flex-col gap-4 lg:sticky lg:top-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">Anteprima</p>
              {platform === "INSTAGRAM" ? (
                <InstagramPreviewCard
                  accountName={instagramAccountName}
                  profileImageUrl={instagramProfileImageUrl ?? null}
                  mediaUrl={mediaPreviewUrl}
                  isVideo={isVideo}
                  caption={caption}
                />
              ) : (
                <YoutubePreviewCard
                  accountName={youtubeAccountName}
                  profileImageUrl={youtubeProfileImageUrl ?? null}
                  mediaUrl={mediaPreviewUrl}
                  isVideo={isVideo}
                  thumbnailUrl={thumbnailPreviewUrl}
                  title={title}
                />
              )}
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 text-xs text-indigo-300">
              <InfoIcon />
              <p>
                Le anteprime sono un&apos;approssimazione di come apparirà il tuo post quando pubblicato. Il risultato
                finale può sembrare leggermente diverso.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
