"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { STARTER_QUESTIONS } from "@/lib/chat-prompt";
import { houseOf, houseStyle } from "@/lib/houses";
import type { Character, ChatMessage } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

/**
 * Chat with a character, streamed from /api/chat (Claude, in character).
 * The transcript lives in sessionStorage per character so it survives
 * navigating away and back within the tab.
 */

const MAX_MESSAGES = 20;
const MAX_INPUT_LENGTH = 2000;
const CHANGE_EVENT = "hp-explorer:chat-change";
const EMPTY: ChatMessage[] = [];

/* ------------------------------------------------------------------ */
/* sessionStorage-backed transcript store                              */
/* ------------------------------------------------------------------ */

const storageKey = (id: string) => `hp-explorer:chat:${id}`;
const memory = new Map<string, { raw: string | null; list: ChatMessage[] }>();

function parseTranscript(raw: string | null): ChatMessage[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const list = data.filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string",
    );
    // Drop an unfinished reply left behind by an interrupted stream.
    while (list.length && list[list.length - 1].role === "assistant" && !list[list.length - 1].content.trim()) {
      list.pop();
    }
    return list.slice(-MAX_MESSAGES);
  } catch {
    return EMPTY;
  }
}

function readTranscript(id: string): ChatMessage[] {
  if (typeof window === "undefined") return EMPTY;
  const hit = memory.get(id);
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(storageKey(id));
  } catch {
    return hit?.list ?? EMPTY;
  }
  if (hit && hit.raw === raw) return hit.list;
  const list = parseTranscript(raw);
  memory.set(id, { raw, list });
  return list;
}

function writeTranscript(id: string, list: ChatMessage[]) {
  const raw = list.length ? JSON.stringify(list) : null;
  memory.set(id, { raw, list });
  try {
    if (raw) window.sessionStorage.setItem(storageKey(id), raw);
    else window.sessionStorage.removeItem(storageKey(id));
  } catch {
    /* private mode / quota — keep in-memory only */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

function useTranscript(id: string) {
  const transcript = useSyncExternalStore(subscribe, () => readTranscript(id), () => EMPTY);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const setTranscript = useCallback(
    (next: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      writeTranscript(id, typeof next === "function" ? next(readTranscript(id)) : next);
    },
    [id],
  );
  return { transcript, hydrated, setTranscript };
}

/* ------------------------------------------------------------------ */
/* Widget                                                              */
/* ------------------------------------------------------------------ */

type ChatError =
  | { kind: "rate_limited"; message: string }
  | { kind: "generic"; message: string };

interface ApiErrorBody {
  error?: string;
  message?: string;
}

async function readErrorBody(res: Response): Promise<ApiErrorBody> {
  try {
    const data: unknown = await res.json();
    return data && typeof data === "object" ? (data as ApiErrorBody) : {};
  } catch {
    return {};
  }
}

function replaceLast(list: ChatMessage[], content: string): ChatMessage[] {
  if (!list.length) return list;
  return [...list.slice(0, -1), { role: "assistant", content }];
}

function withoutEmptyReply(list: ChatMessage[]): ChatMessage[] {
  const last = list[list.length - 1];
  return last && last.role === "assistant" && !last.content ? list.slice(0, -1) : list;
}

export function ChatWidget({ character }: { character: Character }) {
  const { transcript, hydrated, setTranscript } = useTranscript(character.id);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headingId = useId();
  const inputId = useId();

  const house = houseOf(character.house);
  const style = houseStyle(character.house);
  const firstName = character.name.split(/\s+/)[0] ?? character.name;
  const starters = STARTER_QUESTIONS(character);

  const lastIsUser = transcript[transcript.length - 1]?.role === "user";
  const capReached = transcript.length + (lastIsUser ? 1 : 2) > MAX_MESSAGES;
  const canRetry = lastIsUser && transcript.length <= MAX_MESSAGES;
  const composerVisible = configured !== false && !capReached;

  /* Ask the server once whether chat is available so the closed-owl-post
     notice appears before anyone types. */
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/chat", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean } | null) => {
        if (data && typeof data.configured === "boolean") setConfigured(data.configured);
      })
      .catch(() => {
        /* offline or aborted — the send path reports errors itself */
      });
    return () => controller.abort();
  }, []);

  /* Cancel an in-flight reply when the widget unmounts. */
  useEffect(() => () => abortRef.current?.abort(), []);

  /* Keep the latest message in view. */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, streaming, error]);

  const run = useCallback(
    async (history: ChatMessage[]) => {
      if (history.length > MAX_MESSAGES) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setStreaming(true);
      setTranscript([...history, { role: "assistant", content: "" }]);

      let reply = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ characterId: character.id, messages: history }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await readErrorBody(res);
          if (res.status === 503 && body.error === "chat_not_configured") {
            setConfigured(false);
            setTranscript(history.slice(0, -1));
            return;
          }
          setTranscript(history);
          if (res.status === 429) {
            setError({ kind: "rate_limited", message: "Too many owls at once — try again in a moment." });
          } else {
            setError({
              kind: "generic",
              message: body.message || `${firstName} could not reply just now (error ${res.status}).`,
            });
          }
          return;
        }

        if (!res.body) throw new Error("Empty response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setTranscript((prev) => replaceLast(prev, reply));
        }
        reply += decoder.decode();
        setTranscript((prev) => (reply.trim() ? replaceLast(prev, reply) : withoutEmptyReply(prev)));
        if (!reply.trim()) {
          setError({ kind: "generic", message: `${firstName} fell silent — the owl arrived empty.` });
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // Stopped by the user, cleared, or unmounted: keep whatever arrived.
          setTranscript((prev) => withoutEmptyReply(prev));
          return;
        }
        console.error("[ChatWidget] request failed:", err);
        setTranscript(history);
        setError({ kind: "generic", message: "The owl never arrived — check your connection and try again." });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [character.id, firstName, setTranscript],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim().slice(0, MAX_INPUT_LENGTH);
      if (!content || streaming || capReached) return;
      setInput("");
      const el = textareaRef.current;
      if (el) el.style.height = "";
      void run([...transcript, { role: "user", content }]);
    },
    [capReached, run, streaming, transcript],
  );

  const retry = () => {
    if (canRetry && !streaming) void run(transcript);
  };

  const stop = () => abortRef.current?.abort();

  const clear = () => {
    abortRef.current?.abort();
    setTranscript([]);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const onInputChange = (el: HTMLTextAreaElement) => {
    setInput(el.value);
    el.style.height = "";
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
  };

  const showStarters = hydrated && transcript.length === 0 && configured !== false && !streaming;
  const pendingReply = streaming && transcript[transcript.length - 1]?.role === "assistant";

  return (
    <section aria-labelledby={headingId} className="card overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/10 bg-linear-to-r from-gold-500/10 via-transparent to-transparent px-4 py-3 sm:px-5">
        {character.image ? (
          <Image
            src={character.image}
            alt=""
            width={48}
            height={48}
            sizes="48px"
            className={cn("h-12 w-12 shrink-0 rounded-full object-cover object-top ring-2", style.ring)}
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br font-display text-sm font-semibold text-white/80 ring-2",
              style.gradient,
              style.ring,
            )}
          >
            {initials(character.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 id={headingId} className="truncate font-display text-lg font-semibold text-gold-200">
            Chat with {character.name}
          </h3>
          <p className="text-xs uppercase tracking-[0.2em] text-parchment-dim">In character · powered by Claude</p>
        </div>
        {hydrated && transcript.length > 0 && (
          <button type="button" onClick={clear} className="btn-ghost px-3 py-1.5 text-xs" aria-label="Clear conversation">
            Clear
          </button>
        )}
      </header>

      {/* Transcript */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={`Conversation with ${character.name}`}
        className="max-h-[28rem] min-h-[14rem] space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {configured === false ? (
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-4 text-sm leading-relaxed text-parchment">
            <p className="font-display text-gold-300">The owl post is closed for now.</p>
            <p className="mt-1 text-muted">
              This demo needs an <code className="rounded bg-night-900/80 px-1 py-0.5 text-gold-200">ANTHROPIC_API_KEY</code>{" "}
              on the server to let {character.name} reply.
            </p>
          </div>
        ) : (
          !hydrated ||
          (transcript.length === 0 && (
            <p className="text-sm leading-relaxed text-muted">
              Write a short letter to {firstName}
              {house ? ` of ${house.name}` : ""}. Replies are written in character by Claude and may not always be
              accurate to the books.
            </p>
          ))
        )}

        {showStarters && (
          <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
            {starters.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => send(q)}
                  className="chip border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-parchment transition-colors hover:border-gold-400 hover:bg-gold-500/20"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        )}

        {hydrated &&
          transcript.map((m, i) => {
            const isUser = m.role === "user";
            const isPending = pendingReply && i === transcript.length - 1;
            return (
              <div key={`${i}-${m.role}`} className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                <span className="eyebrow text-[10px] tracking-[0.2em]">{isUser ? "You" : firstName}</span>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl border px-4 py-2.5 text-[0.95rem] leading-relaxed",
                    isUser
                      ? "rounded-tr-sm border-gold-500/30 bg-gold-500/15 text-gold-200"
                      : "rounded-tl-sm border-parchment/15 bg-parchment/10 text-parchment",
                  )}
                >
                  {isPending && !m.content ? (
                    <span className="inline-flex items-center gap-1" aria-label={`${firstName} is writing`}>
                      <span className="h-1.5 w-1.5 animate-twinkle rounded-full bg-gold-400" />
                      <span className="h-1.5 w-1.5 animate-twinkle rounded-full bg-gold-400 [animation-delay:0.3s]" />
                      <span className="h-1.5 w-1.5 animate-twinkle rounded-full bg-gold-400 [animation-delay:0.6s]" />
                    </span>
                  ) : (
                    <>
                      {m.content}
                      {isPending && <span aria-hidden className="ml-0.5 animate-pulse text-gold-400">▍</span>}
                    </>
                  )}
                </div>
              </div>
            );
          })}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-parchment"
          >
            <span>{error.message}</span>
            {canRetry && (
              <button type="button" onClick={retry} disabled={streaming} className="btn-outline px-3 py-1 text-xs">
                Retry
              </button>
            )}
          </div>
        )}

        {hydrated && capReached && configured !== false && !lastIsUser && (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
            This letter has reached its final page ({MAX_MESSAGES} messages). Clear the conversation to start a new one.
          </p>
        )}
      </div>

      {/* Composer */}
      {composerVisible && (
        <form onSubmit={onSubmit} className="border-t border-white/10 p-3 sm:p-4">
          <label htmlFor={inputId} className="sr-only">
            Your message to {character.name}
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id={inputId}
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.currentTarget)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAX_INPUT_LENGTH}
              disabled={streaming || !hydrated}
              placeholder={`Ask ${firstName} something…`}
              className="input max-h-44 min-h-11 resize-none py-2.5 disabled:opacity-60"
            />
            {streaming ? (
              <button type="button" onClick={stop} className="btn-outline shrink-0">
                Stop
              </button>
            ) : (
              <button type="submit" disabled={!input.trim() || !hydrated} className="btn-gold shrink-0">
                Send
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-parchment-dim/80">
            <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
            <span className={cn("ml-auto tabular-nums", input.length > MAX_INPUT_LENGTH - 100 && "text-gold-400")}>
              {input.length}/{MAX_INPUT_LENGTH}
            </span>
          </div>
        </form>
      )}
    </section>
  );
}
