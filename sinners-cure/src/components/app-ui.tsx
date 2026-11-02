import { Link } from "@tanstack/react-router";
import { BookOpen, CircleDot, HandHeart, Menu, Square, Sun, Volume2 } from "lucide-react";
import { speak, stopSpeaking, useSpeaking } from "@/lib/speech";
import { useEffect, useState, type ReactNode } from "react";

const TABS = [
  { to: "/", label: "Today", icon: Sun, exact: true },
  { to: "/bible", label: "Bible", icon: BookOpen, exact: false },
  { to: "/rosary", label: "Rosary", icon: CircleDot, exact: false },
  { to: "/prayers", label: "Prayers", icon: HandHeart, exact: false },
  { to: "/more", label: "More", icon: Menu, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.8rem] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <Icon className="size-6" aria-hidden />
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
      <div className="rounded-full bg-foreground px-5 py-2.5 text-background">{msg}</div>
    </div>
  );
}

export function Page({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-4 pb-28 pt-6">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="font-serif text-[2rem] font-semibold leading-tight">{title}</h1>
        </div>
        {action}
      </header>
      {children}
    </main>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card-surface p-5 ${className}`}>{children}</section>;
}

export function PrayerText({ text }: { text: string }) {
  return (
    <div className="scripture space-y-4">
      {text.split("\n\n").map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

type BtnVariant = "primary" | "outline" | "ghost";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  outline: "border border-input bg-card text-foreground",
  ghost: "text-foreground",
};

export function Btn({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-opacity active:opacity-80 disabled:opacity-40 ${BTN[variant]} ${className}`}
    />
  );
}

export const btnClass = (variant: BtnVariant = "primary", extra = "") =>
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-opacity active:opacity-80 ${BTN[variant]} ${extra}`;

export function ListenButton({ id, text, label = "Listen", className = "" }: { id: string; text: string; label?: string; className?: string }) {
  const speaking = useSpeaking();
  const on = speaking === id;
  return (
    <button
      type="button"
      onClick={() => (on ? stopSpeaking() : speak(id, text))}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 font-semibold ${on ? "text-primary" : ""} ${className}`}
      aria-pressed={on}
    >
      {on ? <Square className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      {on ? "Stop" : label}
    </button>
  );
}
