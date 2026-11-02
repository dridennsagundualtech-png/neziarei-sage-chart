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
import { t as l } from "@/lib/lang";

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
      back={{ to: "/prayers", label: l("Prayers", "Mga Dasal") }}
      title={l("Night examination", "Pagsusuri sa gabi")}
      subtitle={l(
        "Look back on the day with God. Three minutes is enough.",
        "Balikan ang araw kasama ang Diyos. Sapat na ang tatlong minuto.",
      )}
    >
      <Section title={l("1. Give thanks", "1. Magpasalamat")} className="mt-2">
        <p>
          {l(
            "Thank God for today: the people, the work, the small joys. Everything good came from him.",
            "Pasalamatan ang Diyos para sa araw na ito: ang mga tao, ang trabaho, ang maliliit na kagalakan. Lahat ng mabuti ay galing sa Kanya.",
          )}
        </p>
      </Section>
      <Section title={l("2. Ask for light", "2. Humingi ng liwanag")}>
        <PrayerText
          text={l(
            "Come, Holy Spirit. Show me my day as you see it, and give me sorrow for my sins.",
            "Halina, Espiritu Santo. Ipakita Mo sa akin ang aking araw gaya ng pagtingin Mo rito, at bigyan Mo ako ng pagsisisi sa aking mga kasalanan.",
          )}
        />
      </Section>
      <Section title={l("3. Look back", "3. Balikan")}>
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
                {l("Today's Gospel was", "Ang Ebanghelyo ngayon ay")}{" "}
                <Link to="/mass" className="font-semibold text-primary underline-offset-2">
                  {gospel}
                </Link>
                .{" "}
                {l(
                  "What did the Lord ask of me in it, and did I do it?",
                  "Ano ang hiningi sa akin ng Panginoon dito, at ginawa ko ba ito?",
                )}
              </span>
            </li>
          )}
        </ul>
        <p className="mt-3 text-[0.95rem] text-muted-foreground">
          {l(
            "For a full examination before Confession, use",
            "Para sa buong pagsusuri bago mangumpisal, gamitin ang",
          )}{" "}
          <Link to="/prayers/confession" className="underline underline-offset-2">
            {l("Going to Confession", "Pangungumpisal")}
          </Link>
          .
        </p>
      </Section>
      <Section title={l("4. Say sorry", "4. Humingi ng tawad")}>
        <PrayerText text={P.actOfContrition} />
      </Section>
      <Section title={l("5. One resolution for tomorrow", "5. Isang pasya para bukas")}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={l(
            "For example: be patient with my brother at breakfast",
            "Halimbawa: maging matiyaga sa aking kapatid sa almusal",
          )}
          className="w-full rounded-xl border border-input bg-card p-3"
          aria-label={l("Resolution for tomorrow", "Pasya para bukas")}
        />
        <p className="mt-1 text-[0.92rem] text-muted-foreground">
          {l(
            "It will be on your Today screen tomorrow.",
            "Makikita ito sa iyong Ngayon na screen bukas.",
          )}
        </p>
      </Section>
      <Btn
        className="mt-8 w-full"
        onClick={() => {
          if (draft.trim()) setResolution({ date: dateKey(new Date()), text: draft.trim() });
          markPath("exam");
          toast(l("Good night. Go in peace.", "Magandang gabi. Humayo nang mapayapa."));
        }}
      >
        <Check className="size-5" aria-hidden /> {done ? l("Save", "I-save") : "Amen"}
      </Btn>
    </Page>
  );
}
