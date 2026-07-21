import { prisma } from "@/lib/social/prisma";
import { decryptToken } from "@/lib/social/crypto";
import { AccountStatus, Platform } from "@/generated/prisma/enums";

const GRAPH_BASE = "https://graph.instagram.com/v21.0";

async function getInstagramAccessToken(): Promise<string> {
  const account = await prisma.platformAccount.findUnique({ where: { platform: Platform.INSTAGRAM } });
  if (!account) {
    throw new Error("Account Instagram non collegato");
  }
  if (account.status === AccountStatus.NEEDS_REAUTH) {
    throw new Error("Account Instagram richiede una nuova autorizzazione");
  }
  return decryptToken(account.accessTokenEnc);
}

export type ConversationSummary = {
  id: string;
  participantId: string | null;
  participantUsername: string | null;
  updatedTime: string | null;
  snippet: string | null;
};

type GraphParticipant = { id: string; username?: string };

// Con l'alias "me" (token "Instagram Login") l'endpoint conversations elenca i thread
// dell'account collegato; "participants" include sia l'account stesso sia l'interlocutore.
export async function fetchConversations(): Promise<ConversationSummary[]> {
  const accessToken = await getInstagramAccessToken();
  const params = new URLSearchParams({
    platform: "instagram",
    fields: "participants,updated_time,messages.limit(1){message}",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH_BASE}/me/conversations?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Recupero conversazioni Instagram fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  return (data.data ?? []).map(
    (c: {
      id: string;
      updated_time?: string;
      participants?: { data?: GraphParticipant[] };
      messages?: { data?: { message?: string }[] };
    }) => {
      const participants = c.participants?.data ?? [];
      const other = participants.find((p) => p.username) ?? participants[0];
      return {
        id: c.id,
        participantId: other?.id ?? null,
        participantUsername: other?.username ?? null,
        updatedTime: c.updated_time ?? null,
        snippet: c.messages?.data?.[0]?.message ?? null,
      };
    }
  );
}

export type Message = {
  id: string;
  fromId: string | null;
  text: string | null;
  createdTime: string | null;
};

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const accessToken = await getInstagramAccessToken();
  const params = new URLSearchParams({
    fields: "messages{id,created_time,from,message}",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH_BASE}/${conversationId}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Recupero messaggi fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const messages: { id: string; created_time?: string; from?: { id: string }; message?: string }[] =
    data.messages?.data ?? [];

  // L'API restituisce i messaggi più recenti per primi: li invertiamo per mostrarli in ordine cronologico.
  return messages
    .map((m) => ({
      id: m.id,
      fromId: m.from?.id ?? null,
      text: m.message ?? null,
      createdTime: m.created_time ?? null,
    }))
    .reverse();
}

export async function sendMessage(recipientId: string, text: string): Promise<void> {
  const accessToken = await getInstagramAccessToken();
  const res = await fetch(`${GRAPH_BASE}/me/messages?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  if (!res.ok) {
    throw new Error(`Invio messaggio fallito: ${res.status} ${await res.text()}`);
  }
}
