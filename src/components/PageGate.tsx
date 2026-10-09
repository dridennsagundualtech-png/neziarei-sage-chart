import { Link } from "@tanstack/react-router";
import { EyeOff } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";
import { isPageHidden, pageLabel } from "@/lib/pages";

/**
 * Hides a page when an admin has turned it off for this account.
 * Admins always see everything; signed-out visitors are unaffected.
 */
export function PageGate({ page, children }: { page: string; children: ReactNode }) {
  const { access, loading } = useAccess();

  if (loading) {
    return (
      <p className="py-10 text-center text-[15px] text-muted-foreground">Checking your access…</p>
    );
  }

  if (access && isPageHidden(access.hiddenPages, page)) {
    return (
      <section className="flex flex-col items-center px-2 py-14 text-center">
        <EyeOff className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">
          {pageLabel(page)} is turned off
        </h1>
        <p className="mt-1 max-w-sm text-[15px] leading-snug text-muted-foreground">
          An admin has hidden this page for your account. Ask an admin to switch it back on.
        </p>
        <Button
          asChild
          variant="secondary"
          className="mt-6 h-12 w-full max-w-sm rounded-xl text-base"
        >
          <Link to="/settings">Go to settings</Link>
        </Button>
      </section>
    );
  }

  return <>{children}</>;
}
