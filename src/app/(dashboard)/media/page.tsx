import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { getMediaSignedUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { UploadMediaForm } from "@/components/media/upload-media-form";
import { DeleteMediaButton } from "@/components/media/delete-media-button";
import type { MediaType } from "@/types/database";
import { getHiddenUserIds } from "@/lib/visibility";

const TYPE_LABEL: Record<MediaType, string> = {
  audio: "Audio",
  video: "Video",
  immagine: "Immagine",
  documento: "Documento",
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { userId, profile } = await requireSessionProfile();
  const { type: typeFilter } = await searchParams;
  const supabase = await createClient();
  const [hiddenIds, { data: items }, { data: rawSongs }, { data: rawEvents }, { data: rawMembers }] =
    await Promise.all([
      getHiddenUserIds(supabase, userId, profile.role === "admin"),
      supabase.from("media_items").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("songs").select("id,title,proposed_by").order("title"),
      supabase.from("events").select("id,title,created_by").order("date", { ascending: false }),
      supabase.from("profiles").select("id,full_name"),
    ]);

  const members = (rawMembers ?? []).filter((m) => !hiddenIds.has(m.id));
  const songs = (rawSongs ?? []).filter((s) => !s.proposed_by || !hiddenIds.has(s.proposed_by));
  const events = (rawEvents ?? []).filter((e) => !e.created_by || !hiddenIds.has(e.created_by));

  const nameById = new Map(members.map((m) => [m.id, m.full_name]));
  const songTitleById = new Map(songs.map((s) => [s.id, s.title]));
  const eventTitleById = new Map(events.map((e) => [e.id, e.title]));

  const filtered = (items ?? [])
    .filter((item) => !item.uploaded_by || !hiddenIds.has(item.uploaded_by))
    .filter((item) => !typeFilter || item.type === typeFilter);
  const withUrls = await Promise.all(
    filtered.map(async (item) => ({ ...item, url: await getMediaSignedUrl(supabase, item.file_path, item.file_name) }))
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Archivio media" description="Registrazioni, basi, foto/video e spartiti della band" />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Carica un file</h2>
        <UploadMediaForm songs={songs} events={events} />
      </Card>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <a
          href="/media"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !typeFilter
              ? "bg-violet-600 text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          Tutti
        </a>
        {Object.entries(TYPE_LABEL).map(([value, label]) => (
          <a
            key={value}
            href={`/media?type=${value}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              typeFilter === value
                ? "bg-violet-600 text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {withUrls.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Badge variant="neutral" className="align-middle">
                    {TYPE_LABEL[item.type]}
                  </Badge>
                  {` · ${item.file_name}`}
                  {item.file_size && ` · ${formatFileSize(item.file_size)}`}
                  {item.related_song_id && ` · brano: ${songTitleById.get(item.related_song_id) ?? "eliminato"}`}
                  {item.related_event_id && ` · evento: ${eventTitleById.get(item.related_event_id) ?? "eliminato"}`}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  Caricato da <span className="font-medium text-zinc-500 dark:text-zinc-400">{item.uploaded_by ? (nameById.get(item.uploaded_by) ?? "qualcuno") : "qualcuno"}</span>{" "}
                  · {format(parseISO(item.uploaded_at), "d MMM yyyy 'alle' HH:mm", { locale: it })}
                </p>
              </div>
              <DeleteMediaButton mediaId={item.id} />
            </div>

            {item.url && (
              <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <a href={item.url} download={item.file_name} className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
                  Scarica →
                </a>
              </div>
            )}
          </Card>
        ))}

        {withUrls.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun file caricato ancora.</p>}
      </div>
    </div>
  );
}
