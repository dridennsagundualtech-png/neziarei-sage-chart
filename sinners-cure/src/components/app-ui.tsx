import { Link, useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  HandHeart,
  Menu,
  Square,
  Sun,
  Volume2,
} from "lucide-react";
import { speak, stopSpeaking, useSpeaking } from "@/lib/speech";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { t, type Lang } from "@/lib/lang";

const TABS = [
  { to: "/", label: t("Today", "Ngayon"), icon: Sun, exact: true },
  { to: "/bible", label: t("Bible", "Bibliya"), icon: BookOpen, exact: false },
  { to: "/rosary", label: t("Rosary", "Rosaryo"), icon: CircleDot, exact: false },
  { to: "/prayers", label: t("Prayers", "Dasal"), icon: HandHeart, exact: false },
  { to: "/more", label: t("More", "Iba pa"), icon: Menu, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label={t("Main", "Pangunahin")}
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="group flex min-h-16 flex-col items-center justify-center gap-1 text-[0.8rem] font-medium text-muted-foreground data-[status=active]:text-foreground"
            >
              <span className="flex h-7 w-14 items-center justify-center rounded-full group-data-[status=active]:bg-secondary">
                <Icon className="size-[22px] group-data-[status=active]:text-primary" aria-hidden />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 1800);
    };
    window.addEventListener("sc-toast", on);
    return () => window.removeEventListener("sc-toast", on);
  }, []);
  if (!msg) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="rounded-full bg-foreground px-5 py-2.5 text-background shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)]">
        {msg}
      </div>
    </div>
  );
}

/** Back link to a parent screen (falls back to history when the parent is unknown). */
export function BackLink({ to, label }: { to?: string | undefined; label: string }) {
  const router = useRouter();
  const cls =
    "-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-3 text-muted-foreground";
  if (!to)
    return (
      <button type="button" onClick={() => router.history.back()} className={cls}>
        <ChevronLeft className="size-5" aria-hidden /> {label}
      </button>
    );
  return (
    <a href={`#${to}`} className={cls}>
      <ChevronLeft className="size-5" aria-hidden /> {label}
    </a>
  );
}

export function Page({
  title,
  subtitle,
  back,
  action,
  ribbon = false,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to?: string | undefined; label: string };
  action?: ReactNode;
  ribbon?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="pt-safe relative mx-auto max-w-xl px-4 pb-32">
      {ribbon && <div className="ribbon right-6" aria-hidden />}
      <header className={`mb-6 ${back ? "pt-2" : "pt-8"}`}>
        {back && <BackLink to={back.to} label={back.label} />}
        <div className="flex items-start justify-between gap-3">
          <h1
            className={`font-serif text-[2.1rem] font-semibold leading-[1.1] ${ribbon ? "pr-10" : ""}`}
          >
            {title}
          </h1>
          {action}
        </div>
        {subtitle && <div className="mt-2 text-muted-foreground">{subtitle}</div>}
      </header>
      {children}
    </main>
  );
}

export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-9 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card-surface p-5 ${className}`}>{children}</section>;
}

/** Shows ℣/℟ and parenthesised directions in rubric red, as a missal does. */
function PrayerLine({ line }: { line: string }) {
  const vr = /^([VR])\.\s*/.exec(line);
  const body = vr ? line.slice(vr[0].length) : line;
  const parts = body.split(/(\([^)]*\))/);
  return (
    <>
      {vr && (
        <span
          className="mr-1 font-semibold text-rubric"
          aria-label={vr[1] === "V" ? t("Leader", "Namumuno") : t("All", "Lahat")}
        >
          {vr[1] === "V" ? "℣." : "℟."}
        </span>
      )}
      {parts.map((p, i) =>
        p.startsWith("(") ? (
          <span key={i} className="text-[0.9em] italic text-rubric">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function PrayerText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`scripture space-y-4 ${className}`}>
      {text.split("\n\n").map((para, i) => (
        <p key={i}>
          {para.split("\n").map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              <PrayerLine line={line} />
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

type BtnVariant = "primary" | "outline" | "ghost" | "quiet";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  outline: "border border-input bg-card text-foreground",
  ghost: "text-foreground",
  quiet: "bg-secondary text-foreground",
};
const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";

export function Btn({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return <button type="button" {...props} className={`${BASE} ${BTN[variant]} ${className}`} />;
}

export const btnClass = (variant: BtnVariant = "primary", extra = "") =>
  `${BASE} ${BTN[variant]} ${extra}`;

export function IconBtn({
  label,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`inline-flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary ${className}`}
    >
      {children}
    </button>
  );
}

export function ListenButton({
  id,
  text,
  label = t("Listen", "Pakinggan"),
  lang,
  className = "",
}: {
  id: string;
  text: string;
  label?: string;
  /** Language of `text`; defaults to the app language. Scripture passes "en". */
  lang?: Lang;
  className?: string;
}) {
  const speaking = useSpeaking();
  const on = speaking === id;
  return (
    <button
      type="button"
      onClick={() => (on ? stopSpeaking() : speak(id, text, undefined, lang))}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-secondary"} ${className}`}
      aria-pressed={on}
    >
      {on ? <Square className="size-4" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      {on ? t("Stop", "Ihinto") : label}
    </button>
  );
}

/** One row of a ruled list. Use inside <List>. */
export function Row({
  title,
  detail,
  icon,
  trailing,
  className = "",
}: {
  title: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <span className={`flex min-h-14 items-center gap-3 px-4 py-3 ${className}`}>
      {icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[1.05rem] font-semibold leading-snug">{title}</span>
        {detail && (
          <span className="mt-0.5 block text-[0.95rem] leading-snug text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
      {trailing ?? <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
    </span>
  );
}

export function List({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-surface divide-y overflow-hidden ${className}`}>{children}</div>;
}

export function Switch({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span>
        <span className="block font-medium">{label}</span>
        {detail && <span className="block text-[0.95rem] text-muted-foreground">{detail}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-input transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-card after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
      />
    </label>
  );
}
