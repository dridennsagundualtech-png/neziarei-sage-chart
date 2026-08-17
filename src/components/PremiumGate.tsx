import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Lock, LogIn } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccess } from "@/lib/account";
import { redeemPremiumCode } from "@/lib/premium.functions";

/** Wraps premium-only screens: analysis requires a signed-in premium account. */
export function PremiumGate({ children }: { children: ReactNode }) {
  const { access, session, loading, refetch } = useAccess();
  const redeem = useServerFn(redeemPremiumCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="card-soft p-6 text-sm text-muted-foreground">Checking your access…</div>
    );
  }

  if (access?.isPremium) return <>{children}</>;

  const submitCode = async () => {
    setBusy(true);
    try {
      const result = (await redeem({ data: { code } })) as { ok: boolean; message: string };
      if (result.ok) {
        toast.success(result.message);
        await refetch();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Could not check that code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="animate-float-in card-soft space-y-3 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="size-5 text-primary" />
        </div>
        <h1 className="font-display text-xl font-semibold">Chart analysis is premium</h1>
        <p className="text-sm text-muted-foreground">
          Sign in and enter a premium code to run AI-assisted chart analysis. The Academy, Practice,
          History and Statistics tabs stay free.
        </p>

        {!session.userId ? (
          <Link to="/auth" className="block">
            <Button className="h-12 w-full rounded-xl">
              <LogIn className="size-4" /> Sign in to continue
            </Button>
          </Link>
        ) : (
          <div className="space-y-2 text-left">
            <Label htmlFor="gate-code">Premium code</Label>
            <div className="flex gap-2">
              <Input
                id="gate-code"
                className="h-11 rounded-xl font-mono"
                placeholder="CP-XXXX-XXXX"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
              <Button className="h-11 rounded-xl" onClick={submitCode} disabled={busy || !code}>
                <Crown className="size-4" /> Unlock
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Signed in as {access?.email ?? session.email}. Manage your account in Settings.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
