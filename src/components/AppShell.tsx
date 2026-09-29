import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  GraduationCap,
  Home,
  LineChart,
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="relative flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary/15 text-primary hero-glow">
              <LineChart className="size-5" />
            </span>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold text-gradient">
                ChartPilot
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Evidence-based chart reading
              </span>
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground sm:flex">
            <ShieldAlert className="size-3.5 text-warn" />
            Analysis tool: not advice
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>

      <p className="px-6 pb-28 text-[11px] leading-relaxed text-muted-foreground/80">{DISCLAIMER}</p>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-xl">
        <div
          className="mx-auto grid max-w-3xl px-1 py-2"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, nav.length)}, minmax(0, 1fr))` }}
        >
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            const showBadge = item.to === "/" && unread > 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-all",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
                  {showBadge && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
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
