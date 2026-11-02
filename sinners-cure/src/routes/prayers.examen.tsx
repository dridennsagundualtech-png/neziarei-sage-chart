import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { Btn, Page, PrayerText, Section } from "@/components/app-ui";
import { NIGHT_EXAM } from "@/data/practices";
import { P } from "@/data/prayers";
import { getToday } from "@/lib/today";
import { dateKey } from "@/lib/liturgy";
import { useLocal } from "@/lib/storage";
import { markPath, useStreak } from "@/lib/streak";
import { useSettings } from "@/lib/settings";
import { toast } from "@/lib/share";

export const Route = createFileRoute("/prayers/examen")({
  component: ExamenPage,
});

function ExamenPage() {
  const { settings } = useSettings();
  const t = getToday(new Date(), settings.calendar);
  const gospel = t.mass.readings.find((r) => r.kind === "gospel")?.options[0]?.citation;
  const { todayItems } = useStreak();
  const [resolution, setResolution] = useLocal<{ date: string; text: string } | null>(
    "sc.resolution",
    null,
  );
  const [draft, setDraft] = useState(
    resolution?.date === dateKey(new Date()) ? resolution.text : "",
  );
  const done = todayItems.includes("exam");

  return (
    <Page
      back={{ to: "/prayers", label: "Prayers" }}
      title="Night examination"
      subtitle="Look back on the day with God. Three minutes is enough."
    >
      <Section title="1. Give thanks" className="mt-2">
        <p>
          Thank God for today: the people, the work, the small joys. Everything good came from him.
        </p>
      </Section>
      <Section title="2. Ask for light">
        <PrayerText text="Come, Holy Spirit. Show me my day as you see it, and give me sorrow for my sins." />
      </Section>
      <Section title="3. Look back">
        <ul className="space-y-2.5">
          {NIGHT_EXAM.map((q) => (
            <li key={q} className="flex gap-3">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-rubric" />
              <span>{q}</span>
            </li>
          ))}
          {gospel && (
            <li className="flex gap-3">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-rubric" />
              <span>
                Today's Gospel was{" "}
                <Link to="/mass" className="font-semibold text-primary underline-offset-2">
                  {gospel}
                </Link>
                . What did the Lord ask of me in it, and did I do it?
              </span>
            </li>
          )}
        </ul>
        <p className="mt-3 text-[0.95rem] text-muted-foreground">
          For a full examination before Confession, use{" "}
          <Link to="/prayers/confession" className="underline underline-offset-2">
            Going to Confession
          </Link>
          .
        </p>
      </Section>
      <Section title="4. Say sorry">
        <PrayerText text={P.actOfContrition} />
      </Section>
      <Section title="5. One resolution for tomorrow">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="For example: be patient with my brother at breakfast"
          className="w-full rounded-xl border border-input bg-card p-3"
          aria-label="Resolution for tomorrow"
        />
        <p className="mt-1 text-[0.92rem] text-muted-foreground">
          It will be on your Today screen tomorrow.
        </p>
      </Section>
      <Btn
        className="mt-8 w-full"
        onClick={() => {
          if (draft.trim()) setResolution({ date: dateKey(new Date()), text: draft.trim() });
          markPath("exam");
          toast("Good night. Go in peace.");
        }}
      >
        <Check className="size-5" aria-hidden /> {done ? "Save" : "Amen"}
      </Btn>
    </Page>
  );
}
