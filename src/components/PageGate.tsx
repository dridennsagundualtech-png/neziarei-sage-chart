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
    return <div className="card-soft p-6 text-sm text-muted-foreground">Checking your access…</div>;
  }

  if (access && isPageHidden(access.hiddenPages, page)) {
    return (
      <section className="animate-float-in card-soft space-y-3 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
          <EyeOff className="size-5 text-muted-foreground" />
        </div>
        <h1 className="font-display text-xl font-semibold">{pageLabel(page)} is turned off</h1>
        <p className="text-sm text-muted-foreground">
          An admin has hidden this page for your account. Ask an admin to switch it back on.
        </p>
        <Link to="/settings" className="block">
          <Button variant="secondary" className="h-11 w-full rounded-xl">
            Go to settings
          </Button>
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
