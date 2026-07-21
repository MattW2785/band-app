import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { encryptToken } from "@/lib/social/crypto";
import { exchangeCodeForTokens, getOwnChannel } from "@/lib/social/oauth/youtube";
import { AccountStatus, Platform } from "@/generated/prisma/enums";

const STATE_COOKIE = "youtube_oauth_state";

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
    accountsUrl.searchParams.set("error", "youtube_oauth_state");
    return NextResponse.redirect(accountsUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      accountsUrl.searchParams.set("error", "youtube_no_refresh_token");
      return NextResponse.redirect(accountsUrl);
    }

    const channel = await getOwnChannel(tokens.access_token);

    await prisma.platformAccount.upsert({
      where: { platform: Platform.YOUTUBE },
      create: {
        platform: Platform.YOUTUBE,
        displayName: channel.title,
        profileImageUrl: channel.profileImageUrl,
        externalAccountId: channel.id,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope,
        status: AccountStatus.CONNECTED,
        lastRefreshedAt: new Date(),
      },
      update: {
        displayName: channel.title,
        profileImageUrl: channel.profileImageUrl,
        externalAccountId: channel.id,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope,
        status: AccountStatus.CONNECTED,
        lastRefreshedAt: new Date(),
      },
    });

    const response = NextResponse.redirect(accountsUrl);
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    accountsUrl.searchParams.set("error", "youtube_oauth_failed");
    accountsUrl.searchParams.set(
      "detail",
      err instanceof Error ? err.message.slice(0, 200) : "errore sconosciuto"
    );
    return NextResponse.redirect(accountsUrl);
  }
}
