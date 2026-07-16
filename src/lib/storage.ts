import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const MEDIA_BUCKET = "media";
export const MAX_MEDIA_FILE_SIZE = 50 * 1024 * 1024; // 50MB, limite del piano gratuito Supabase Storage

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function uploadMediaFile(
  supabase: SupabaseServerClient,
  file: File
): Promise<{ path: string } | { error: string }> {
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return { error: "Il file supera il limite di 50MB." };
  }

  const path = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file);
  if (error) return { error: "Caricamento del file fallito." };

  return { path };
}

export async function getMediaSignedUrl(
  supabase: SupabaseServerClient,
  path: string,
  downloadFileName: string,
  expiresIn = 3600
) {
  const { data } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn, { download: downloadFileName });
  return data?.signedUrl ?? null;
}
