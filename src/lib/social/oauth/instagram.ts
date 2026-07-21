// Instagram API with Instagram Login (2024+): non passa più dalla Pagina Facebook,
// l'account Instagram Business/Creator si collega direttamente. Richiede credenziali
// separate (INSTAGRAM_APP_ID/SECRET) rispetto all'app Meta generale (META_APP_ID/SECRET).
const AUTH_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_BASE = "https://graph.instagram.com";
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
  "instagram_business_manage_messages",
];

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SITE_URL non impostata");
  return `${base}/api/auth/instagram/callback`;
}

function getCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("INSTAGRAM_APP_ID o INSTAGRAM_APP_SECRET non impostate");
  }
  return { appId, appSecret };
}

export function buildAuthUrl(state: string): string {
  const { appId } = getCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForUserToken(code: string): Promise<{ accessToken: string; igUserId: string }> {
  const { appId, appSecret } = getCredentials();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
    code,
  });
  const res = await fetch(TOKEN_URL, { method: "POST", body });
  if (!res.ok) {
    throw new Error(`Scambio codice OAuth Instagram fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { accessToken: data.access_token, igUserId: String(data.user_id) };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const { appSecret } = getCredentials();
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: shortLivedToken,
  });
  const res = await fetch(`${GRAPH_BASE}/access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Scambio long-lived token Instagram fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function refreshLongLivedToken(longLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: longLivedToken });
  const res = await fetch(`${GRAPH_BASE}/refresh_access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Refresh long-lived token Instagram fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// Con questo tipo di token, l'ID numerico restituito dallo scambio non è interrogabile
// direttamente: va usato l'alias "me", che risolve all'account collegato al token stesso.
export async function getOwnProfile(
  accessToken: string
): Promise<{ userId: string; username: string; profileImageUrl: string | null }> {
  const params = new URLSearchParams({
    fields: "user_id,username,profile_picture_url",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH_BASE}/v21.0/me?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Recupero profilo Instagram fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { userId: String(data.user_id), username: data.username, profileImageUrl: data.profile_picture_url ?? null };
}
