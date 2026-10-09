import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  GraduationCap,
  Home,
  LineChart,
  ListChecks,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";

import { DISCLAIMER } from "@/lib/analysis-types";
import { useAccess, useSession } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";
import { countUnreadMemberSignals } from "@/lib/member-signals.functions";
import { isPageHidden } from "@/lib/pages";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/analyze", label: "Analyze", icon: LineChart },
  { to: "/learn", label: "Academy", icon: GraduationCap },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { access } = useAccess();
  const session = useSession();
  const nav = NAV.filter((item) => !isPageHidden(access?.hiddenPages, item.to));

  const unreadFn = useServerFn(countUnreadMemberSignals);
  const unreadQuery = useQuery({
    queryKey: ["member-signals-unread", session.userId],
    enabled: Boolean(session.userId) && !session.loading,
    retry: false,
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return 0;
      try {
        const res = (await unreadFn({
          headers: { Authorization: `Bearer ${token}` },
        })) as { count: number };
        return res.count ?? 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 60_000,
  });
  const unread = unreadQuery.data ?? 0;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const badge = (count: number, className?: string) => (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-bear px-1 text-xs font-bold text-bear-foreground",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
      <span className="sr-only"> unread shared signals</span>
    </span>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
          <Link
            to="/"
            className="relative flex shrink-0 items-center gap-2.5"
            aria-label="ChartPilot home"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ListChecks className="size-[18px]" strokeWidth={2.5} />
            </span>
            <span className="font-display text-[1.375rem] font-bold leading-none tracking-wide">
              ChartPilot
            </span>
            {unread > 0 && badge(unread, "absolute -left-1.5 -top-1.5 md:hidden")}
          </Link>

          <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-14 items-center gap-1.5 px-3 text-sm font-semibold transition-colors",
                    active
                      ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {item.to === "/" && unread > 0 && badge(unread)}
                </Link>
              );
            })}
          </nav>

          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <ShieldAlert className="size-3.5 text-warn" />
            Analysis tool, not advice
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-8">{children}</main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-28 md:pb-10">
        <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          {DISCLAIMER}
        </p>
      </footer>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div
          className="mx-auto grid max-w-lg px-1 pt-1.5 pb-2"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, nav.length)}, minmax(0, 1fr))` }}
        >
          {nav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative grid h-7 w-12 place-items-center rounded-full transition-colors",
                    active && "bg-primary text-primary-foreground",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
                  {item.to === "/" && unread > 0 && badge(unread, "absolute -right-1 -top-1")}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
