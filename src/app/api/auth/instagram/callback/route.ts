import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { encryptToken } from "@/lib/social/crypto";
import { exchangeCodeForUserToken, exchangeForLongLivedToken, getOwnProfile } from "@/lib/social/oauth/instagram";
import { AccountStatus, Platform } from "@/generated/prisma/enums";

const STATE_COOKIE = "instagram_oauth_state";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  const accountsUrl = new URL("/social/accounts", request.url);

  if (!code || !state || !expectedState || state !== expectedState) {
    accountsUrl.searchParams.set("error", "instagram_oauth_state");
    return NextResponse.redirect(accountsUrl);
  }

  try {
    const shortLived = await exchangeCodeForUserToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
    const profile = await getOwnProfile(longLived.accessToken);

    await prisma.platformAccount.upsert({
      where: { platform: Platform.INSTAGRAM },
      create: {
        platform: Platform.INSTAGRAM,
        displayName: `@${profile.username}`,
        profileImageUrl: profile.profileImageUrl,
        externalAccountId: profile.userId,
        accessTokenEnc: encryptToken(longLived.accessToken),
        tokenExpiresAt: new Date(Date.now() + longLived.expiresIn * 1000),
        status: AccountStatus.CONNECTED,
        lastRefreshedAt: new Date(),
      },
      update: {
        displayName: `@${profile.username}`,
        profileImageUrl: profile.profileImageUrl,
        externalAccountId: profile.userId,
        accessTokenEnc: encryptToken(longLived.accessToken),
        tokenExpiresAt: new Date(Date.now() + longLived.expiresIn * 1000),
        status: AccountStatus.CONNECTED,
        lastRefreshedAt: new Date(),
      },
    });

    const response = NextResponse.redirect(accountsUrl);
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    accountsUrl.searchParams.set("error", "instagram_oauth_failed");
    accountsUrl.searchParams.set(
      "detail",
      err instanceof Error ? err.message.slice(0, 200) : "errore sconosciuto"
    );
    return NextResponse.redirect(accountsUrl);
  }
}
