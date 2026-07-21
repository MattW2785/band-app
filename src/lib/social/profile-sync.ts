import { prisma } from "@/lib/social/prisma";
import { decryptToken } from "@/lib/social/crypto";
import { getOwnProfile } from "@/lib/social/oauth/instagram";
import { getOwnChannel } from "@/lib/social/oauth/youtube";
import { ensureFreshAccessToken } from "@/lib/social/publishing/youtube";
import { AccountStatus, Platform } from "@/generated/prisma/enums";

// Best-effort: tiene aggiornata la foto profilo mostrata nelle anteprime dei post usando i
// token già collegati, senza richiedere una nuova autorizzazione OAuth. Un fallimento qui
// non deve mai propagarsi: nel peggiore dei casi l'anteprima resta con il placeholder.
export async function syncProfileImages(): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const instagramAccount = await prisma.platformAccount.findUnique({ where: { platform: Platform.INSTAGRAM } });
  if (instagramAccount && instagramAccount.status !== AccountStatus.NEEDS_REAUTH) {
    try {
      const accessToken = decryptToken(instagramAccount.accessTokenEnc);
      const profile = await getOwnProfile(accessToken);
      if (profile.profileImageUrl && profile.profileImageUrl !== instagramAccount.profileImageUrl) {
        await prisma.platformAccount.update({
          where: { platform: Platform.INSTAGRAM },
          data: { profileImageUrl: profile.profileImageUrl },
        });
      }
      results.instagram = "ok";
    } catch (err) {
      results.instagram = err instanceof Error ? err.message : String(err);
    }
  }

  const youtubeAccount = await prisma.platformAccount.findUnique({ where: { platform: Platform.YOUTUBE } });
  if (youtubeAccount && youtubeAccount.status !== AccountStatus.NEEDS_REAUTH) {
    try {
      const { accessToken } = await ensureFreshAccessToken(5 * 60 * 1000);
      const channel = await getOwnChannel(accessToken);
      if (channel.profileImageUrl && channel.profileImageUrl !== youtubeAccount.profileImageUrl) {
        await prisma.platformAccount.update({
          where: { platform: Platform.YOUTUBE },
          data: { profileImageUrl: channel.profileImageUrl },
        });
      }
      results.youtube = "ok";
    } catch (err) {
      results.youtube = err instanceof Error ? err.message : String(err);
    }
  }

  return results;
}
