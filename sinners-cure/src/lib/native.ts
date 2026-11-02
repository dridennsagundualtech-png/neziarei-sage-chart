/**
 * Phone-only features of the Android app. Every function is a no-op in a browser.
 * - tick(): a light vibration per bead
 * - shareNative(): the Android share sheet
 * - daily reminder notifications with each day's Mass and verse (scheduled ahead, offline)
 * - home-screen widget data ("widget.days", read by TodayWidget.java)
 * - links from the widget and notifications into the app
 */
import { Capacitor, registerPlugin } from "@capacitor/core";
import { getToday } from "./today";
import { readLocal } from "./storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from "./settings";
import { dateKey } from "./liturgy";
import { rankText, seasonName } from "./mass-day";
import { t as tr } from "./lang";

export const isNative = () => Capacitor.isNativePlatform();

interface WidgetBridge {
  refresh(): Promise<void>;
}
const WidgetBridge = registerPlugin<WidgetBridge>("WidgetBridge");

const settingsNow = (): Settings => {
  const s = readLocal<Partial<Settings>>(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...s, calendar: { ...DEFAULT_SETTINGS.calendar, ...s.calendar } };
};

export function tick() {
  if (!isNative()) return;
  void import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
    .catch(() => undefined);
}

export async function shareNative(text: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share({ text, dialogTitle: tr("Share", "Ibahagi") });
  } catch {
    /* closed by the user */
  }
  return true;
}

const WIDGET_DAYS = 120;
const NOTIFY_DAYS = 60;

/** Writes the next months of Today content for the home-screen widget. */
export async function updateWidget() {
  if (!isNative()) return;
  const { Preferences } = await import("@capacitor/preferences");
  const { calendar } = settingsNow();
  const days: Record<string, unknown> = {};
  const start = new Date();
  for (let i = 0; i < WIDGET_DAYS; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const t = getToday(d, calendar);
    days[dateKey(d)] = {
      title: t.mass.title,
      meta: `${t.mass.rankLabel === "Weekday" ? seasonName(t.season) : rankText(t.mass.rankLabel)} · ${t.colorName}`,
      color: t.color,
      verse: t.verse.text,
      ref: t.verse.ref,
      mysteries: t.mysteries.name,
      rosaryLabel: tr("Rosary", "Rosaryo"),
      date: t.dateLabel,
    };
  }
  await Preferences.set({ key: "widget.days", value: JSON.stringify(days) });
  await WidgetBridge.refresh().catch(() => undefined);
}

const REMINDER_IDS = Array.from({ length: NOTIFY_DAYS }, (_, i) => 1000 + i);

/** Schedules the daily reminder for the next two months, one notification per day. */
export async function scheduleReminders(ask = false): Promise<"on" | "off" | "denied"> {
  if (!isNative()) return "off";
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const { reminder, calendar } = settingsNow();
  await LocalNotifications.cancel({ notifications: REMINDER_IDS.map((id) => ({ id })) }).catch(
    () => undefined,
  );
  if (!reminder) return "off";
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted" && ask) perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return "denied";
  await LocalNotifications.createChannel({
    id: "daily",
    name: tr("Daily reminder", "Araw-araw na paalala"),
    description: tr("Today's Mass and verse", "Ang Misa at talata ngayon"),
    importance: 3,
  }).catch(() => undefined);
  const [h, m] = reminder.split(":").map(Number);
  const now = new Date();
  const notifications = [];
  for (let i = 0; i < NOTIFY_DAYS; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h ?? 7, m ?? 0);
    if (at.getTime() <= now.getTime() + 30000) continue;
    const t = getToday(at, calendar);
    notifications.push({
      id: REMINDER_IDS[i]!,
      channelId: "daily",
      title: t.mass.title,
      body: `“${t.verse.text}” ${t.verse.ref}`,
      largeBody: `${t.mass.about}\n\n“${t.verse.text}” ${t.verse.ref}\n\n${tr("Rosary", "Rosaryo")}: ${t.mysteries.name}`,
      summaryText: t.notes[0] ?? seasonName(t.season),
      schedule: { at, allowWhileIdle: true },
      smallIcon: "ic_stat_cross",
      extra: { route: "/" },
    });
  }
  if (notifications.length) await LocalNotifications.schedule({ notifications });
  return "on";
}

async function syncStatusBar() {
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const dark = document.documentElement.classList.contains("dark");
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  } catch {
    /* not available */
  }
}

let started = false;
/** Called once when the app opens. `navigate` opens a screen from a widget or notification tap. */
export async function startNative(navigate: (to: string) => void) {
  if (!isNative() || started) return;
  started = true;
  const routeFor = (url: string) => {
    const host = url.replace(/^[a-z.]+:\/\//, "").replace(/\/.*$/, "");
    return host === "rosary" ? "/rosary" : host === "mass" ? "/mass" : "/";
  };
  const { App } = await import("@capacitor/app");
  App.addListener("appUrlOpen", ({ url }) => navigate(routeFor(url))).catch(() => undefined);
  const launch = await App.getLaunchUrl().catch(() => undefined);
  if (launch?.url) navigate(routeFor(launch.url));
  // Back button: go back, or leave the app from a main tab.
  App.addListener("backButton", ({ canGoBack }) => {
    const path = window.location.hash.replace(/^#/, "") || "/";
    const tab = ["/", "/bible", "/rosary", "/prayers", "/more"].includes(path);
    if (tab) void App.minimizeApp();
    else if (canGoBack) window.history.back();
    else navigate("/");
  }).catch(() => undefined);
  // Every return to the app tops up the widget days and the reminders.
  App.addListener("resume", () => {
    void updateWidget();
    void scheduleReminders();
  }).catch(() => undefined);

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    const route = (a.notification.extra as { route?: string } | undefined)?.route;
    if (route) navigate(route);
  }).catch(() => undefined);

  void syncStatusBar();
  new MutationObserver(() => void syncStatusBar()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  await updateWidget();
  await scheduleReminders();
}
