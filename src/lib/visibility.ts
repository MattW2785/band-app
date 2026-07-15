import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Id dei profili "nascosti" che il viewer corrente non deve vedere: insieme vuoto per
 * gli admin (vedono tutti), ed esclude sempre l'id del viewer stesso (un membro nascosto
 * vede sé stesso normalmente).
 */
export async function getHiddenUserIds(
  supabase: SupabaseServerClient,
  viewerId: string,
  isAdmin: boolean
): Promise<Set<string>> {
  if (isAdmin) return new Set();
  const { data } = await supabase.from("profiles").select("id").eq("hidden", true);
  return new Set((data ?? []).map((p) => p.id).filter((id) => id !== viewerId));
}
