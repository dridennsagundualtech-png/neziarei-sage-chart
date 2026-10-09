import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/account";

/**
 * Gates account-backed screens (journal, statistics, academy): data now lives
 * in the user's account, so a sign-in is required to read or save anything.
 */
export function SignInPrompt({ children, feature }: { children: ReactNode; feature: string }) {
  const session = useSession();

  if (session.loading) {
    return (
      <p className="py-10 text-center text-[15px] text-muted-foreground">Checking your account…</p>
    );
  }

  if (!session.userId) {
    return (
      <section className="flex flex-col items-center px-2 py-14 text-center">
        <LogIn className="size-8 text-muted-foreground" aria-hidden />
        <h2 className="mt-4 font-display text-xl font-semibold">Sign in to use {feature}</h2>
        <p className="mt-1 max-w-sm text-[15px] leading-snug text-muted-foreground">
          Your journal, statistics and learning progress are stored in your account so they sync
          across devices. Create a free account to get started.
        </p>
        <Button asChild className="mt-6 h-12 w-full max-w-sm rounded-xl text-base font-semibold">
          <Link to="/auth">
            <LogIn className="size-5" /> Sign in or create an account
          </Link>
        </Button>
      </section>
    );
  }

  return <>{children}</>;
}
