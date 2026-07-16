"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PRESS_KIT_ID = "00000000-0000-0000-0000-000000000001";

const PressKitSchema = z.object({
  band_name: z.string().trim().optional(),
  bio_short: z.string().trim().optional(),
  bio_long: z.string().trim().optional(),
  photo_urls: z.string().optional(),
  audio_links: z.string().optional(),
  video_links: z.string().optional(),
  contact_email: z.string().trim().optional(),
});

export type PressKitFormState = { error?: string; success?: string } | undefined;

function linesToArray(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function updatePressKit(
  _prevState: PressKitFormState,
  formData: FormData
): Promise<PressKitFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = PressKitSchema.safeParse({
    band_name: formData.get("band_name"),
    bio_short: formData.get("bio_short"),
    bio_long: formData.get("bio_long"),
    photo_urls: formData.get("photo_urls"),
    audio_links: formData.get("audio_links"),
    video_links: formData.get("video_links"),
    contact_email: formData.get("contact_email"),
  });

  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("press_kit")
    .update({
      band_name: parsed.data.band_name || null,
      bio_short: parsed.data.bio_short || null,
      bio_long: parsed.data.bio_long || null,
      photo_urls: linesToArray(parsed.data.photo_urls),
      audio_links: linesToArray(parsed.data.audio_links),
      video_links: linesToArray(parsed.data.video_links),
      contact_email: parsed.data.contact_email || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", PRESS_KIT_ID);

  if (error) {
    return { error: "Impossibile salvare l'EPK. Riprova." };
  }

  revalidatePath("/press-kit");
  revalidatePath("/epk");
  return { success: "EPK aggiornato." };
}
