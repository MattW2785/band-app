"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConversationSummary = {
  id: string;
  participantId: string | null;
  participantUsername: string | null;
  updatedTime: string | null;
  snippet: string | null;
};

type Message = {
  id: string;
  fromId: string | null;
  text: string | null;
  createdTime: string | null;
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
      <p className="mb-2">Impossibile recuperare i messaggi: {message}</p>
      <p>
        Se manca il permesso per i messaggi,{" "}
        <Link href="/social/accounts" className="font-medium underline">
          riconnetti l&apos;account
        </Link>{" "}
        dalla pagina Account.
      </p>
    </div>
  );
}

export default function MessagesInbox({ canSend }: { canSend: boolean }) {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingConversations(true);
      setConversationsError(null);
      try {
        const res = await fetch("/api/instagram/conversations");
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data) {
          setConversationsError(data?.error ?? `Recupero conversazioni fallito (${res.status})`);
          return;
        }
        setConversations(data.conversations ?? []);
      } catch (err) {
        if (!cancelled) setConversationsError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMessages(conversationId: string) {
    setSelectedId(conversationId);
    setLoadingMessages(true);
    setMessagesError(null);
    setSendError(null);
    try {
      const res = await fetch(`/api/instagram/conversations/${conversationId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setMessagesError(data?.error ?? `Recupero messaggi fallito (${res.status})`);
        return;
      }
      setMessages(data.messages ?? []);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMessages(false);
    }
  }

  const selectedConversation = conversations?.find((c) => c.id === selectedId) ?? null;

  async function handleSend() {
    const text = replyText.trim();
    if (!text || !selectedConversation?.participantId || !selectedId) return;

    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/instagram/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedConversation.participantId, text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setSendError(data?.error ?? `Invio fallito (${res.status})`);
        return;
      }
      setReplyText("");
      await loadMessages(selectedId);
    } finally {
      setSending(false);
    }
  }

  if (conversationsError) {
    return <ErrorNotice message={conversationsError} />;
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60">
        <div className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Conversazioni Instagram</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations && <p className="px-4 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">Caricamento...</p>}
          {!loadingConversations && conversations?.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">Nessuna conversazione trovata.</p>
          )}
          {conversations?.map((c) => {
            const label = c.participantUsername ? `@${c.participantUsername}` : c.participantId ?? "Utente";
            const selected = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => loadMessages(c.id)}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-zinc-100 dark:border-zinc-800/70 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                  selected ? "bg-violet-50 dark:bg-zinc-800/80" : ""
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                  <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-600">{formatRelativeTime(c.updatedTime)}</span>
                </span>
                {c.snippet && <span className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-500">{c.snippet}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60">
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
            Seleziona una conversazione a sinistra per iniziare
          </div>
        ) : (
          <>
            <div className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {selectedConversation?.participantUsername
                  ? `@${selectedConversation.participantUsername}`
                  : selectedConversation?.participantId ?? "Utente"}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages && <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">Caricamento...</p>}
              {messagesError && <ErrorNotice message={messagesError} />}
              {!loadingMessages && !messagesError && (
                <div className="flex flex-col gap-2">
                  {messages?.map((m) => {
                    const isOwn = selectedConversation?.participantId && m.fromId !== selectedConversation.participantId;
                    return (
                      <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                            isOwn
                              ? "bg-gradient-to-b from-violet-500 to-indigo-600 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <p className={`mt-0.5 text-[10px] ${isOwn ? "text-violet-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                            {formatRelativeTime(m.createdTime)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 p-3">
              {canSend ? (
                <>
                  {sendError && <p className="mb-2 text-xs text-red-500 dark:text-red-400">{sendError}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      placeholder="Scrivi una risposta..."
                      className="flex-1 resize-none rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !replyText.trim()}
                      className="rounded-lg bg-gradient-to-b from-violet-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-violet-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? "Invio..." : "Invia"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">Solo l&apos;amministratore può rispondere ai messaggi</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
