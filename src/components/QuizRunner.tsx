import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleSlash, HelpCircle, Loader2, MinusCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ChartCanvas, pointInZone, type Point, type Zone } from "@/components/ChartCanvas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { TOPIC_LABEL, type TopicKey } from "@/lib/education-content";
import { useRecordAttempts, type Verdict } from "@/lib/learning";
import { buildQuiz, gradeShortAnswers } from "@/lib/teach.functions";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  topic: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "identify";
  prompt: string;
  options: string[];
  answerIndex: number | null;
  modelAnswer: string;
  explanation: string;
  zone: Zone | null;
  imageIndex: number;
}

interface Answered {
  verdict: Verdict;
  explanation: string;
}

const VERDICT_STYLE: Record<Verdict, { icon: React.ElementType; className: string }> = {
  CORRECT: { icon: CheckCircle2, className: "bg-bull/12 text-bull" },
  "PARTIALLY CORRECT": { icon: MinusCircle, className: "bg-warn/12 text-warn" },
  INCORRECT: { icon: CircleSlash, className: "bg-bear/12 text-bear" },
};

/**
 * Quiz mode: the learner answers BEFORE seeing ChartPilot's reading, then gets
 * CORRECT / PARTIALLY CORRECT / INCORRECT with the reasoning explained.
 */
export function QuizRunner({
  images,
  beginner,
  count = 6,
}: {
  images: { dataUrl: string; timeframe: string | null }[];
  beginner: boolean;
  count?: number;
}) {
  const create = useServerFn(buildQuiz);
  const grade = useServerFn(gradeShortAnswers);
  const record = useRecordAttempts();

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [point, setPoint] = useState<Point | null>(null);
  const [results, setResults] = useState<Record<string, Answered>>({});
  const [checking, setChecking] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const result = (await create({ data: { images, count, beginner } })) as { questions: QuizQuestion[] };
      setQuestions(result.questions);
      setIndex(0);
      setResults({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The quiz could not be built.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setChoice(null);
    setText("");
    setPoint(null);
  };

  if (!questions) {
    return (
      <section className="card-soft p-4">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <HelpCircle className="size-4 text-primary" /> Quiz mode
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          You answer first, ChartPilot answers second. Every answer is marked CORRECT, PARTIALLY
          CORRECT or INCORRECT — and always explained.
        </p>
        <Button className="mt-3 h-11 w-full rounded-xl" onClick={start} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Writing your questions…" : "Start the quiz"}
        </Button>
      </section>
    );
  }

  const question = questions[index]!;
  const answered = results[question.id];
  const topic = (TOPIC_LABEL[question.topic as TopicKey] ?? "Market Structure") as string;
  const image = images[Math.min(question.imageIndex, images.length - 1)];

  const submit = async () => {
    let verdict: Verdict = "PARTIALLY CORRECT";
    let explanation = question.explanation;

    if (question.type === "multiple_choice" || question.type === "true_false") {
      if (choice === null) {
        toast.error("Pick an answer first.");
        return;
      }
      verdict = question.answerIndex === choice ? "CORRECT" : "INCORRECT";
    } else if (question.type === "identify") {
      if (!point) {
        toast.error("Tap the chart to mark your answer first.");
        return;
      }
      if (!question.zone) {
        verdict = "PARTIALLY CORRECT";
      } else {
        verdict = pointInZone(point, question.zone)
          ? "CORRECT"
          : pointInZone(point, question.zone, 0.12)
            ? "PARTIALLY CORRECT"
            : "INCORRECT";
      }
    } else {
      if (!text.trim()) {
        toast.error("Write your answer first.");
        return;
      }
      setChecking(true);
      try {
        const graded = (await grade({
          data: {
            items: [
              {
                id: question.id,
                prompt: question.prompt,
                modelAnswer: question.modelAnswer,
                userAnswer: text.trim(),
              },
            ],
          },
        })) as { results: { id: string; verdict: string; explanation: string }[] };
        const first = graded.results[0];
        verdict = (first?.verdict as Verdict) ?? "PARTIALLY CORRECT";
        explanation = `${first?.explanation ?? ""}\n\n${question.explanation}`.trim();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Grading failed.");
        setChecking(false);
        return;
      } finally {
        setChecking(false);
      }
    }

    setResults((current) => ({ ...current, [question.id]: { verdict, explanation } }));
    record.mutate([{ topic: (question.topic as TopicKey) ?? "market_structure", verdict, source: "quiz" }]);
  };

  const scored = Object.values(results);
  const correct = scored.filter((r) => r.verdict === "CORRECT").length;
  const partial = scored.filter((r) => r.verdict === "PARTIALLY CORRECT").length;

  return (
    <section className="card-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <HelpCircle className="size-4 text-primary" /> Quiz mode
        </p>
        <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground">
          {index + 1} / {questions.length}
        </span>
      </div>

      <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        Topic: {topic} · {question.type.replace("_", " ")}
      </p>
      <p className="mt-1 font-display text-sm font-semibold">{question.prompt}</p>

      {question.type === "identify" && image && (
        <div className="mt-3">
          <ChartCanvas
            src={image.dataUrl}
            point={point}
            zone={answered ? question.zone : null}
            onPick={answered ? undefined : setPoint}
            label="quiz chart"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tap the chart to mark your answer. A generous tolerance zone is used — you do not need the
            exact pixel.
          </p>
        </div>
      )}

      {(question.type === "multiple_choice" || question.type === "true_false") && (
        <div className="mt-3 space-y-2">
          {question.options.map((option, i) => (
            <button
              key={i}
              type="button"
              disabled={Boolean(answered)}
              onClick={() => setChoice(i)}
              className={cn(
                "w-full rounded-xl border p-3 text-left text-sm transition-colors",
                choice === i ? "border-primary bg-primary/10" : "border-border bg-elevated",
                answered && question.answerIndex === i && "border-bull bg-bull/10",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === "short_answer" && (
        <Textarea
          rows={3}
          className="mt-3 rounded-xl"
          placeholder="Answer in your own words."
          disabled={Boolean(answered)}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      )}

      {!answered ? (
        <Button className="mt-3 h-11 w-full rounded-xl" onClick={submit} disabled={checking}>
          {checking ? <Loader2 className="size-4 animate-spin" /> : null}
          {checking ? "Checking your reasoning…" : "Submit answer"}
        </Button>
      ) : (
        <div className="mt-3 space-y-2">
          {(() => {
            const style = VERDICT_STYLE[answered.verdict];
            const Icon = style.icon;
            return (
              <p className={cn("flex items-center gap-2 rounded-xl px-3 py-2 font-display text-sm font-semibold", style.className)}>
                <Icon className="size-4" /> {answered.verdict}
              </p>
            );
          })()}
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Why</p>
            <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {answered.explanation}
            </p>
            {question.modelAnswer && (
              <p className="mt-2 text-xs text-foreground/90">
                <span className="font-medium">Reference reading: </span>
                {question.modelAnswer}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {index < questions.length - 1 ? (
              <Button
                className="h-11 flex-1 rounded-xl"
                onClick={() => {
                  reset();
                  setIndex((i) => i + 1);
                }}
              >
                Next question
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="h-11 flex-1 rounded-xl"
                onClick={() => {
                  reset();
                  setQuestions(null);
                }}
              >
                Finish · {correct} correct, {partial} partly, out of {questions.length}
              </Button>
            )}
          </div>
        </div>
      )}

      <UncertaintyNote compact className="mt-3" />
    </section>
  );
}
