/**
 * Journal → Ask AI: a trading-question chat on the same models as Analyze.
 * The chat lives on this device until the user taps "Summarize & save to notes",
 * which writes an AI QnA note (notes.style.kind = "ai_qna").
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Bot, Loader2, NotebookPen, RotateCcw, Sparkles } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";

import {
  ChoiceChips,
  ConfirmDialog,
  JSection,
  Notice,
  useConfirm,
} from "@/components/journal/parts";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/account";
import { ANALYSIS_MODELS, AUTO_MODEL } from "@/lib/ai-models";
import { anyDb } from "@/lib/db-types";
import { askTradingQuestion, summarizeQnaChat } from "@/lib/qna.functions";
import { cn } from "@/lib/utils";

const sb = anyDb(supabase);

export const AI_QNA_KIND = "ai_qna";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Which model answered (assistant messages only). */
  provider?: string;
}

const MODEL_CHOICES = [
  { value: AUTO_MODEL, label: "Automatic" },
  ...ANALYSIS_MODELS.map((m) => ({ value: m.id, label: m.label })),
];

const STARTERS = [
  "What is a liquidity sweep, and how is it different from a breakout?",
  "How do I size a EURUSD position with a $1,000 account, 1% risk and a 20-pip stop?",
  "My breakout trades keep failing. What should I check?",
  "Explain premium and discount like I'm new to this.",
];

const MODEL_KEY = "chartpilot.askai.model";
const chatKey = (userId: string | null) => `chartpilot.askai.chat.${userId ?? "anon"}`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be blocked; the chat still works for this visit */
  }
}

/* ---------------------------------------------------- tiny safe markdown */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-elevated px-1 font-mono text-[14px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Group = { kind: "p" | "ul" | "ol" | "h"; lines: string[] };

const BULLET = /^[-*•]\s+/;
const NUMBERED = /^\d+[.)]\s+/;
const HEADING = /^#{1,6}\s+/;

/** Splits text into paragraphs, lists and headings; a list may follow an intro line. */
function groupLines(text: string): Group[] {
  const groups: Group[] = [];
  for (const block of text.split(/\n{2,}/)) {
    let current: Group | null = null;
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const kind: Group["kind"] = BULLET.test(line)
        ? "ul"
        : NUMBERED.test(line)
          ? "ol"
          : HEADING.test(line)
            ? "h"
            : "p";
      const clean = line.replace(kind === "ul" ? BULLET : kind === "ol" ? NUMBERED : HEADING, "");
      if (current && current.kind === kind && kind !== "h")
        current.lines.push(kind === "p" ? line : clean);
      else {
        current = { kind, lines: [kind === "p" ? line : clean] };
        groups.push(current);
      }
    }
  }
  return groups;
}

/** Paragraphs, bullet and numbered lists, headings and **bold**. No HTML is injected. */
function Answer({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[16px] leading-relaxed">
      {groupLines(text).map((g, gi) => {
        if (g.kind === "ul" || g.kind === "ol") {
          const List = g.kind;
          return (
            <List
              key={gi}
              className={cn("space-y-1 pl-5", g.kind === "ul" ? "list-disc" : "list-decimal")}
            >
              {g.lines.map((l, li) => (
                <li key={li}>{inline(l)}</li>
              ))}
            </List>
          );
        }
        if (g.kind === "h") {
          return (
            <p key={gi} className="font-semibold">
              {inline(g.lines[0] ?? "")}
            </p>
          );
        }
        return (
          <p key={gi}>
            {g.lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- the chat */

function AskAIChat({ onOpenNotes }: { onOpenNotes?: () => void }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const askFn = useServerFn(askTradingQuestion);
  const summarizeFn = useServerFn(summarizeQnaChat);
  const [model, setModel] = useState<string>(AUTO_MODEL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const loaded = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const resetAsk = useConfirm<true>();

  // Restore this device's chat and model once the session is known.
  useEffect(() => {
    if (session.loading) return;
    setModel(readJson<string>(MODEL_KEY, AUTO_MODEL));
    setMessages(readJson<ChatMessage[]>(chatKey(session.userId), []));
    loaded.current = true;
  }, [session.loading, session.userId]);

  useEffect(() => {
    if (loaded.current) writeJson(chatKey(session.userId), messages.slice(-60));
  }, [messages, session.userId]);

  const ask = useMutation({
    mutationFn: (history: ChatMessage[]) =>
      askFn({
        data: { messages: history.map(({ role, content }) => ({ role, content })), model },
      }) as Promise<{ answer: string; provider: string }>,
    onSuccess: (res) => {
      setMessages((list) => [
        ...list,
        { role: "assistant", content: res.answer, provider: res.provider },
      ]);
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "The AI could not answer. Try again."),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!session.userId) throw new Error("Sign in to save notes.");
      const res = (await summarizeFn({
        data: { messages: messages.map(({ role, content }) => ({ role, content })), model },
      })) as { title: string; html: string; provider: string };
      const { error: dbError } = await sb.from("notes").insert({
        user_id: session.userId,
        title: res.title,
        body: res.html,
        style: { kind: AI_QNA_KIND, provider: res.provider, saved_at: new Date().toISOString() },
      });
      if (dbError) throw dbError;
      return res.title;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSavedTitle(title);
      toast.success("Saved to Notes → AI QnA");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not save the summary."),
  });

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, ask.isPending]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || ask.isPending) return;
    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: question.slice(0, 4000) },
    ];
    setMessages(history);
    setDraft("");
    setSavedTitle(null);
    ask.mutate(history);
  };

  const retry = () => {
    if (messages.at(-1)?.role === "user") ask.mutate(messages);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  };

  const pickModel = (value: string) => {
    setModel(value);
    writeJson(MODEL_KEY, value);
  };

  const hasAnswer = messages.some((m) => m.role === "assistant");

  return (
    <div>
      <JSection
        className="pt-6"
        title="Ask AI"
        hint="Ask anything about trading. Same AI models as Analyze. Educational only, not financial advice."
      >
        <ChoiceChips
          label="AI model"
          options={MODEL_CHOICES}
          value={model}
          onChange={pickModel}
          scroll
        />
      </JSection>

      <section aria-label="Conversation" aria-live="polite" className="mt-6 space-y-5">
        {messages.length === 0 && (
          <div className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-5" aria-hidden />
              <p className="text-[15px]">Try one of these, or type your own question.</p>
            </div>
            <ul className="mt-3 space-y-2">
              {STARTERS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="min-h-12 w-full rounded-xl border border-border px-4 py-3 text-left text-[15px] leading-snug hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-elevated px-4 py-3 text-[16px] leading-relaxed">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i}>
              <p className="mb-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Bot className="size-4" aria-hidden /> ChartPilot AI
                {m.provider ? ` · ${m.provider}` : ""}
              </p>
              <Answer text={m.content} />
            </div>
          ),
        )}

        {ask.isPending && (
          <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Thinking…
          </p>
        )}

        {error && !ask.isPending && (
          <div className="space-y-2">
            <Notice>{error}</Notice>
            {messages.at(-1)?.role === "user" && (
              <Button type="button" variant="secondary" className="h-11 rounded-xl" onClick={retry}>
                <RotateCcw className="size-4" /> Try again
              </Button>
            )}
          </div>
        )}

        {savedTitle && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <Notice tone="ok">Saved “{savedTitle}” to Notes → AI QnA.</Notice>
            {onOpenNotes && (
              <Button
                type="button"
                variant="secondary"
                className="h-11 rounded-xl"
                onClick={onOpenNotes}
              >
                <NotebookPen className="size-4" /> Open AI QnA notes
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </section>

      {hasAnswer && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-xl px-4 text-[15px] font-semibold"
            onClick={() => save.mutate()}
            disabled={save.isPending || ask.isPending}
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <NotebookPen className="size-4" />
            )}
            {save.isPending ? "Summarizing…" : "Summarize & save to notes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl px-4 text-[15px]"
            onClick={() => resetAsk.ask(true)}
            disabled={ask.isPending}
          >
            <RotateCcw className="size-4" /> New chat
          </Button>
        </div>
      )}

      <form
        className="sticky bottom-20 z-20 -mx-4 mt-6 flex items-end gap-2 border-t border-border bg-background px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <label htmlFor="ask-ai-input" className="sr-only">
          Your question
        </label>
        <textarea
          id="ask-ai-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={Math.min(4, Math.max(1, draft.split("\n").length))}
          maxLength={4000}
          placeholder="Ask a trading question…"
          className="min-h-12 flex-1 resize-none rounded-xl border border-border bg-elevated px-4 py-3 text-[16px] leading-snug outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          className={cn("h-12 shrink-0 rounded-xl px-4 text-[15px] font-semibold")}
          disabled={!draft.trim() || ask.isPending}
        >
          <ArrowUp className="size-5" /> Send
        </Button>
      </form>

      <ConfirmDialog
        open={resetAsk.open}
        onOpenChange={(open) => !open && resetAsk.close()}
        title="Start a new chat?"
        description="This conversation is cleared from this device. Anything you saved to notes stays."
        confirmLabel="Clear chat"
        onConfirm={() => {
          setMessages([]);
          setError(null);
          setSavedTitle(null);
          resetAsk.close();
        }}
      />
    </div>
  );
}

export function AskAISection({ onOpenNotes }: { onOpenNotes?: () => void }) {
  return (
    <SignInPrompt feature="Ask AI">
      {onOpenNotes ? <AskAIChat onOpenNotes={onOpenNotes} /> : <AskAIChat />}
    </SignInPrompt>
  );
}
