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
    return <div className="card-soft p-6 text-sm text-muted-foreground">Checking your account…</div>;
  }

  if (!session.userId) {
    return (
      <section className="animate-float-in card-soft space-y-3 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <LogIn className="size-5 text-primary" />
        </div>
        <h1 className="font-display text-xl font-semibold">Sign in to use {feature}</h1>
        <p className="text-sm text-muted-foreground">
          Your journal, statistics and learning progress are stored in your account so they sync
          across devices. Create a free account to get started.
        </p>
        <Link to="/auth" className="block">
          <Button className="h-12 w-full rounded-xl">
            <LogIn className="size-4" /> Sign in or create an account
          </Button>
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
