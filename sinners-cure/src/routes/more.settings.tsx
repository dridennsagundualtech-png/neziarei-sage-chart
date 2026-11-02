import { createFileRoute } from "@tanstack/react-router";
import { Languages, Moon, Sun, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Btn, List, Page, Section, Switch } from "@/components/app-ui";
import { TEXT_SCALES, useSettings, type Settings, type VoiceId } from "@/lib/settings";
import { TRANSLATIONS, useTranslation, type TranslationId } from "@/data/bible";
import { isNative, scheduleReminders, updateWidget } from "@/lib/native";
import { LANG, t, type Lang } from "@/lib/lang";
import { naturalVoices, openVoiceInstall, prepareVoice, speak, stopSpeaking } from "@/lib/speech";

export const Route = createFileRoute("/more/settings")({
  component: SettingsPage,
});

const SIZE_NAMES = t(
  ["Normal", "Large", "Larger", "Extra large", "Huge"],
  ["Karaniwan", "Malaki", "Mas malaki", "Napakalaki", "Pinakamalaki"],
);

const VOICES: { id: VoiceId; name: string; about: string }[] = [
  {
    id: "bella",
    name: t("Bella · female, American", "Bella · babae, Amerikano"),
    about: t(
      "The most natural. Needs a fast phone; on older phones there may be short pauses.",
      "Pinakanatural. Kailangan ng mabilis na telepono; sa mas lumang telepono, maaaring may maiikling hinto.",
    ),
  },
  {
    id: "alan",
    name: t("Alan · male, British", "Alan · lalaki, British"),
    about: t("Natural and quick on any phone.", "Natural at mabilis sa kahit anong telepono."),
  },
  {
    id: "phone",
    name: t("Phone's voice", "Boses ng telepono"),
    about: t(
      "The text-to-speech voice installed on your phone.",
      "Ang text-to-speech na boses na naka-install sa iyong telepono.",
    ),
  },
];

const SAMPLE =
  "Come to me, all you that labour, and are burdened, and I will refresh you. Matthew 11:28.";

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
  const [aiVoices, setAiVoices] = useState({ alan: false, bella: false });
  const native = isNative();
  useEffect(() => {
    void naturalVoices().then(setAiVoices);
    return () => stopSpeaking();
  }, []);

  const setLang = (lang: Lang) => {
    if (lang === LANG) return;
    stopSpeaking();
    update({ lang });
    // Every screen reads the language once at start, so reload to switch everything at once.
    setTimeout(() => window.location.reload(), 50);
  };
  const setVoice = (voice: VoiceId) => {
    update({ voice });
    prepareVoice(voice);
  };
  const setReminder = async (patch: Partial<Settings>) => {
    update(patch);
    await new Promise((r) => setTimeout(r, 0));
    const r = await scheduleReminders(true);
    setReminderState(
      r === "denied"
        ? t(
            "Notifications are blocked. Allow them for Sinner's Cure in your phone's settings.",
            "Naka-block ang mga notification. Payagan ang mga ito para sa Sinner's Cure sa settings ng iyong telepono.",
          )
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
  const voiceReady = (id: VoiceId) => id === "phone" || aiVoices[id];

  return (
    <Page back={{ to: "/more", label: t("More", "Iba pa") }} title={t("Settings", "Mga Setting")}>
      <Section title={t("Language", "Wika")} className="mt-2">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["en", "English"],
              ["tl", "Tagalog"],
            ] as const
          ).map(([id, name]) => (
            <Choice
              key={id}
              active={settings.lang === id}
              onClick={() => setLang(id)}
              className="justify-center"
            >
              <Languages className="size-5" aria-hidden /> {name}
            </Choice>
          ))}
        </div>
        <p className="mt-3 text-[0.95rem] text-muted-foreground">
          {t(
            "Menus, prayers, the Rosary and guides change language. The Bible and Mass readings stay in English.",
            "Magbabago ang wika ng mga menu, dasal, Rosaryo at gabay. Mananatiling Ingles ang Bibliya at mga pagbasa sa Misa.",
          )}
        </p>
      </Section>

      <Section title={t("Theme", "Tema")}>
        <div className="grid grid-cols-2 gap-3">
          <Choice
            active={settings.theme === "light"}
            onClick={() => update({ theme: "light" })}
            className="justify-center"
          >
            <Sun className="size-5" aria-hidden /> {t("Light", "Maliwanag")}
          </Choice>
          <Choice
            active={settings.theme === "dark"}
            onClick={() => update({ theme: "dark" })}
            className="justify-center"
          >
            <Moon className="size-5" aria-hidden /> {t("Dark", "Madilim")}
          </Choice>
        </div>
      </Section>

      <Section title={t("Text size", "Laki ng teksto")}>
        <p className="mb-3 text-muted-foreground">
          {t(
            "Makes every word in the app bigger and easier to read.",
            "Pinalalaki ang bawat salita sa app para mas madaling basahin.",
          )}
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

      <Section title={t("Bible", "Bibliya")}>
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
          {t(
            "Used for the Bible, the Mass readings and the Rosary verses. The widget and reminders always use the Douay-Rheims.",
            "Ginagamit para sa Bibliya, mga pagbasa sa Misa at mga talata sa Rosaryo. Laging Douay-Rheims ang gamit ng widget at mga paalala.",
          )}
        </p>
      </Section>

      <Section title={t("Daily reminder", "Araw-araw na paalala")}>
        <p className="mb-3 text-muted-foreground">
          {native
            ? t(
                "A notification each day with what the Mass is about and the verse of the day. Works without internet.",
                "Isang notification araw-araw tungkol sa Misa at sa talata ng araw. Gumagana kahit walang internet.",
              )
            : t(
                "In the Android app this sends a daily notification. In a browser it only appears while the app is open.",
                "Sa Android app, nagpapadala ito ng notification araw-araw. Sa browser, lumalabas lang ito habang bukas ang app.",
              )}
        </p>
        <div className="flex gap-3">
          <input
            type="time"
            value={settings.reminder}
            onChange={(e) => void setReminder({ reminder: e.target.value })}
            className="min-h-12 flex-1 rounded-xl border border-input bg-card px-4"
            aria-label={t("Reminder time", "Oras ng paalala")}
          />
          {settings.reminder ? (
            <Btn variant="outline" onClick={() => void setReminder({ reminder: "" })}>
              {t("Turn off", "I-off")}
            </Btn>
          ) : (
            <Btn onClick={() => void setReminder({ reminder: "07:00" })}>
              {t("Turn on", "I-on")}
            </Btn>
          )}
        </div>
        {reminderState && <p className="mt-3 text-rubric">{reminderState}</p>}
      </Section>

      <Section title={t("Church calendar", "Kalendaryo ng Simbahan")}>
        <p className="mb-3 text-muted-foreground">
          {t(
            "In many countries, including the Philippines and most of the United States, these feasts are kept on the nearest Sunday.",
            "Sa maraming bansa, kasama ang Pilipinas at karamihan ng Estados Unidos, ipinagdiriwang ang mga kapistahang ito sa pinakamalapit na Linggo.",
          )}
        </p>
        <List>
          <Switch
            label={t("Epiphany on Sunday", "Epipanya sa Linggo")}
            detail={t("Otherwise January 6", "Kung hindi, Enero 6")}
            checked={settings.calendar.epiphanySunday}
            onChange={(v) => setCalendar({ epiphanySunday: v })}
          />
          <Switch
            label={t("Ascension on Sunday", "Pag-akyat sa Langit sa Linggo")}
            detail={t(
              "Otherwise the Thursday 40 days after Easter",
              "Kung hindi, ang Huwebes 40 araw pagkatapos ng Pasko ng Pagkabuhay",
            )}
            checked={settings.calendar.ascensionSunday}
            onChange={(v) => setCalendar({ ascensionSunday: v })}
          />
          <Switch
            label={t("Corpus Christi on Sunday", "Corpus Christi sa Linggo")}
            detail={t(
              "Otherwise the Thursday after Trinity Sunday",
              "Kung hindi, ang Huwebes pagkatapos ng Linggo ng Santatlo",
            )}
            checked={settings.calendar.corpusChristiSunday}
            onChange={(v) => setCalendar({ corpusChristiSunday: v })}
          />
        </List>
      </Section>

      <Section title={t("Reading voice", "Boses sa pagbasa")}>
        <p className="mb-3 text-muted-foreground">
          {native
            ? t(
                "For English (the Bible, Mass readings and English prayers). Works without internet.",
                "Para sa Ingles (ang Bibliya, mga pagbasa sa Misa at mga dasal sa Ingles). Gumagana kahit walang internet.",
              )
            : t(
                "The natural voices are in the Android app. In a browser, your device's voice is used.",
                "Nasa Android app ang mga natural na boses. Sa browser, ang boses ng iyong device ang gagamitin.",
              )}
        </p>
        <div className="grid gap-2">
          {VOICES.filter((v) => native || v.id === "phone").map((v) => (
            <Choice
              key={v.id}
              active={(native ? settings.voice : "phone") === v.id}
              onClick={() => setVoice(v.id)}
              className={`flex-col items-start py-3 text-left ${voiceReady(v.id) || !native ? "" : "opacity-50"}`}
            >
              <span>{v.name}</span>
              <span className="text-[0.95rem] font-normal text-muted-foreground">
                {voiceReady(v.id) || !native
                  ? v.about
                  : t("Not included in this build.", "Hindi kasama sa build na ito.")}
              </span>
            </Choice>
          ))}
        </div>
        <Btn
          variant="outline"
          className="mt-3 w-full"
          onClick={() => speak("voice-sample", SAMPLE, undefined, "en")}
        >
          <Volume2 className="size-5" aria-hidden /> {t("Try the voice", "Subukan ang boses")}
        </Btn>

        <p className="mb-3 mt-5 font-semibold">{t("Speed", "Bilis")}</p>
        <div className="grid grid-cols-3 gap-2">
          {[0.75, 0.9, 1.05].map((r, i) => (
            <Choice
              key={r}
              active={settings.voiceRate === r}
              onClick={() => update({ voiceRate: r })}
              className="justify-center"
            >
              {t(["Slow", "Gentle", "Normal"], ["Mabagal", "Banayad", "Karaniwan"])[i]}
            </Choice>
          ))}
        </div>

        <p className="mt-5 text-[0.95rem] text-muted-foreground">
          {t(
            "Tagalog prayers are read by your phone's Filipino voice.",
            "Binabasa ang mga dasal sa Tagalog gamit ang Filipino na boses ng iyong telepono.",
          )}
        </p>
        {native && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn
              variant="quiet"
              onClick={() =>
                speak(
                  "voice-sample-tl",
                  "Ama namin, sumasalangit Ka. Sambahin ang ngalan Mo.",
                  undefined,
                  "tl",
                )
              }
            >
              <Volume2 className="size-5" aria-hidden /> {t("Try Filipino", "Subukan ang Filipino")}
            </Btn>
            <Btn variant="ghost" onClick={openVoiceInstall}>
              {t("Install voices", "Mag-install ng boses")}
            </Btn>
          </div>
        )}
      </Section>

      <p className="mt-10 text-[0.9rem] text-muted-foreground">
        {t(
          "Mass calendar and reading list adapted from the public-domain Tamil Catholic Lectionary project by Br. Jayarathina Madharasan SDR. Voices: Piper (Alan) and Kokoro (Bella), run on the phone with sherpa-onnx. Everything you save stays on this phone.",
          "Ang kalendaryo ng Misa at listahan ng mga pagbasa ay hango sa pampublikong proyektong Tamil Catholic Lectionary ni Br. Jayarathina Madharasan SDR. Mga boses: Piper (Alan) at Kokoro (Bella), tumatakbo sa telepono gamit ang sherpa-onnx. Lahat ng sine-save mo ay nasa teleponong ito lamang.",
        )}
      </p>
    </Page>
  );
}
