const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
// "youtube" (non solo upload/readonly) serve per scrivere nelle playlist: senza questo scope
// playlistItems.insert risponde 403 anche con un token valido.
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube",
];

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SITE_URL non impostata");
  return `${base}/api/auth/youtube/callback`;
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET non impostate");
  }
  return { clientId, clientSecret };
}

export function buildAuthUrl(state: string): string {
  const { clientId } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Scambio codice OAuth fallito: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Refresh token Google fallito: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function getOwnChannel(
  accessToken: string
): Promise<{ id: string; title: string; profileImageUrl: string | null }> {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Recupero canale YouTube fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) {
    throw new Error("Nessun canale YouTube trovato per questo account Google");
  }
  const thumbnails = channel.snippet?.thumbnails;
  const profileImageUrl: string | null =
    thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url ?? null;
  return { id: channel.id, title: channel.snippet?.title ?? channel.id, profileImageUrl };
}
