import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, KeyRound, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPremiumUntil, signOutEverywhere, useAccess } from "@/lib/account";
import { redeemPremiumCode } from "@/lib/premium.functions";

export function AccountPanel() {
  const { access, session, loading, refetch } = useAccess();
  const queryClient = useQueryClient();
  const redeem = useServerFn(redeemPremiumCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submitCode = async () => {
    setBusy(true);
    try {
      const result = (await redeem({ data: { code } })) as {
        ok: boolean;
        message: string;
      };
      if (result.ok) {
        toast.success(result.message);
        setCode("");
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

  const signOut = async () => {
    await queryClient.cancelQueries();
    await signOutEverywhere();
    queryClient.clear();
    toast.success("Signed out.");
  };

  return (
    <section className="animate-float-in card-soft space-y-3 p-4">
      <h2 className="font-display text-base font-semibold">Account & premium</h2>

      {loading && <p className="text-sm text-muted-foreground">Checking your account…</p>}

      {!loading && !session.userId && (
        <>
          <p className="text-sm text-muted-foreground">
            You are not signed in. Chart analysis is a premium feature — sign in and enter a premium
            code to unlock it. Your journal always stays in this browser.
          </p>
          <Link to="/auth" className="block">
            <Button className="h-11 w-full rounded-xl">
              <LogIn className="size-4" /> Sign in or create an account
            </Button>
          </Link>
        </>
      )}

      {!loading && session.userId && (
        <>
          <div className="panel space-y-1 p-3">
            <p className="text-sm font-medium">{access?.email ?? session.email}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {access?.isPremium ? (
                <>
                  <Crown className="size-3.5 text-primary" />
                  {access.isAdmin
                    ? "Admin — premium always on"
                    : `Premium active until ${formatPremiumUntil(access.premiumUntil)}`}
                </>
              ) : (
                <>Free account — premium not active</>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="premium-code">Premium code</Label>
            <div className="flex gap-2">
              <Input
                id="premium-code"
                className="h-11 rounded-xl font-mono"
                placeholder="CP-XXXX-XXXX"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
              />
              <Button className="h-11 rounded-xl" onClick={submitCode} disabled={busy || !code}>
                <KeyRound className="size-4" /> Redeem
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Redeeming while premium is still active adds the extra days on top.
            </p>
          </div>

          {access?.isAdmin && (
            <Link to="/admin" className="block">
              <Button variant="outline" className="h-11 w-full rounded-xl">
                <ShieldCheck className="size-4" /> Premium code generator
              </Button>
            </Link>
          )}

          <Button variant="ghost" className="h-11 w-full rounded-xl" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </>
      )}
    </section>
  );
}
