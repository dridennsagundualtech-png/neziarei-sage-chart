import { createFileRoute, Link } from "@tanstack/react-router";
import { Info, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Btn, List, Page, Row, Section, Switch } from "@/components/app-ui";
import { TEXT_SCALES, useSettings, type Settings } from "@/lib/settings";
import { TRANSLATIONS, useTranslation, type TranslationId } from "@/data/bible";
import { isNative, scheduleReminders, updateWidget } from "@/lib/native";

export const Route = createFileRoute("/more/settings")({
  component: SettingsPage,
});

const SIZE_NAMES = ["Normal", "Large", "Larger", "Extra large", "Huge"];

function Choice({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-14 items-center gap-2 rounded-xl border px-4 font-semibold ${active ? "border-foreground bg-card" : "border-transparent bg-secondary"} ${className}`}
    >
      {children}
    </button>
  );
}

function SettingsPage() {
  const { settings, update } = useSettings();
  const [tr, setTr] = useTranslation();
  const [reminderState, setReminderState] = useState<string>("");
  const native = isNative();

  const setReminder = async (patch: Partial<Settings>) => {
    update(patch);
    await new Promise((r) => setTimeout(r, 0));
    const r = await scheduleReminders(true);
    setReminderState(
      r === "denied"
        ? "Notifications are blocked. Allow them for Sinner's Cure in your phone's settings."
        : "",
    );
  };
  const setCalendar = (patch: Partial<Settings["calendar"]>) => {
    update({ calendar: { ...settings.calendar, ...patch } });
    setTimeout(() => {
      void updateWidget();
      void scheduleReminders();
    }, 0);
  };

  return (
    <Page back={{ to: "/more", label: "More" }} title="Settings">
      <Section title="Theme" className="mt-2">
        <div className="grid grid-cols-2 gap-3">
          <Choice
            active={settings.theme === "light"}
            onClick={() => update({ theme: "light" })}
            className="justify-center"
          >
            <Sun className="size-5" aria-hidden /> Light
          </Choice>
          <Choice
            active={settings.theme === "dark"}
            onClick={() => update({ theme: "dark" })}
            className="justify-center"
          >
            <Moon className="size-5" aria-hidden /> Dark
          </Choice>
        </div>
      </Section>

      <Section title="Text size">
        <p className="mb-3 text-muted-foreground">
          Makes every word in the app bigger and easier to read.
        </p>
        <div className="grid gap-2">
          {TEXT_SCALES.map((s, i) => (
            <Choice
              key={s}
              active={settings.textScale === s}
              onClick={() => update({ textScale: s })}
              className="justify-between"
            >
              <span>{SIZE_NAMES[i]}</span>
              <span className="font-serif font-medium" style={{ fontSize: `${1 + i * 0.18}rem` }}>
                Aa
              </span>
            </Choice>
          ))}
        </div>
        <p className="scripture mt-4">In the beginning God created heaven, and earth.</p>
      </Section>

      <Section title="Bible">
        <div className="grid gap-2">
          {(Object.keys(TRANSLATIONS) as TranslationId[]).map((id) => (
            <Choice
              key={id}
              active={tr === id}
              onClick={() => setTr(id)}
              className="flex-col items-start py-3 text-left"
            >
              <span>{TRANSLATIONS[id].name}</span>
              <span className="text-[0.95rem] font-normal text-muted-foreground">
                {TRANSLATIONS[id].about}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-3 text-[0.95rem] text-muted-foreground">
          Used for the Bible, the Mass readings and the Rosary verses. The widget and reminders
          always use the Douay-Rheims.
        </p>
      </Section>

      <Section title="Daily reminder">
        <p className="mb-3 text-muted-foreground">
          {native
            ? "A notification each day with what the Mass is about and the verse of the day. Works without internet."
            : "In the Android app this sends a daily notification. In a browser it only appears while the app is open."}
        </p>
        <div className="flex gap-3">
          <input
            type="time"
            value={settings.reminder}
            onChange={(e) => void setReminder({ reminder: e.target.value })}
            className="min-h-12 flex-1 rounded-xl border border-input bg-card px-4"
            aria-label="Reminder time"
          />
          {settings.reminder ? (
            <Btn variant="outline" onClick={() => void setReminder({ reminder: "" })}>
              Turn off
            </Btn>
          ) : (
            <Btn onClick={() => void setReminder({ reminder: "07:00" })}>Turn on</Btn>
          )}
        </div>
        {reminderState && <p className="mt-3 text-rubric">{reminderState}</p>}
      </Section>

      <Section title="Church calendar">
        <p className="mb-3 text-muted-foreground">
          In many countries, including the Philippines and most of the United States, these feasts
          are kept on the nearest Sunday.
        </p>
        <List>
          <Switch
            label="Epiphany on Sunday"
            detail="Otherwise January 6"
            checked={settings.calendar.epiphanySunday}
            onChange={(v) => setCalendar({ epiphanySunday: v })}
          />
          <Switch
            label="Ascension on Sunday"
            detail="Otherwise the Thursday 40 days after Easter"
            checked={settings.calendar.ascensionSunday}
            onChange={(v) => setCalendar({ ascensionSunday: v })}
          />
          <Switch
            label="Corpus Christi on Sunday"
            detail="Otherwise the Thursday after Trinity Sunday"
            checked={settings.calendar.corpusChristiSunday}
            onChange={(v) => setCalendar({ corpusChristiSunday: v })}
          />
        </List>
      </Section>

      <Section title="Reading voice">
        <p className="mb-3 text-muted-foreground">Uses your phone's own voice, without internet.</p>
        <div className="grid grid-cols-3 gap-2">
          {[0.75, 0.9, 1.05].map((r, i) => (
            <Choice
              key={r}
              active={settings.voiceRate === r}
              onClick={() => update({ voiceRate: r })}
              className="justify-center"
            >
              {["Slow", "Gentle", "Normal"][i]}
            </Choice>
          ))}
        </div>
      </Section>

      <p className="mt-10 text-[0.9rem] text-muted-foreground">
        Mass calendar and reading list adapted from the public-domain Tamil Catholic Lectionary
        project by Br. Jayarathina Madharasan SDR. Everything you save stays on this phone.
      </p>

      <List className="mt-6">
        <Link to="/more/about" className="block">
          <Row
            icon={<Info className="size-5" aria-hidden />}
            title="About"
            detail="Why I made Sinner's Cure"
          />
        </Link>
      </List>
    </Page>
  );
}
