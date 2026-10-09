import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CandlestickChart, Crown, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LinkRow, Section } from "@/components/settings/parts";
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
    <>
      <Section title="Account">
        {loading && (
          <p className="py-4 text-[15px] text-muted-foreground">Checking your account…</p>
        )}

        {!loading && !session.userId && (
          <div className="space-y-4 py-4">
            <p className="text-[15px] leading-snug text-muted-foreground">
              You are not signed in. Chart analysis is a premium feature: sign in and enter a
              premium code to unlock it. Your journal and settings sync to your account on any
              device.
            </p>
            <Button asChild className="h-12 w-full rounded-xl text-base font-semibold">
              <Link to="/auth">
                <LogIn className="size-5" /> Sign in or create an account
              </Link>
            </Button>
          </div>
        )}

        {!loading && session.userId && (
          <>
            <div className="py-4">
              <p className="truncate text-base font-semibold">{access?.email ?? session.email}</p>
              <p className="mt-1 flex items-center gap-2 text-[15px] text-muted-foreground">
                {access?.isPremium ? (
                  <>
                    <Crown className="size-4 shrink-0 text-foreground" aria-hidden />
                    {access.isAdmin
                      ? "Admin: premium always on"
                      : `Premium active until ${formatPremiumUntil(access.premiumUntil)}`}
                  </>
                ) : (
                  <>Free account: premium not active</>
                )}
              </p>
            </div>

            <div className="space-y-2 py-4">
              <Label htmlFor="premium-code" className="text-base font-semibold leading-snug">
                Premium code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="premium-code"
                  className="h-11 rounded-xl font-mono text-base md:text-base"
                  placeholder="CP-XXXX-XXXX"
                  autoComplete="off"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                />
                <Button
                  variant="secondary"
                  className="h-11 rounded-xl px-5 text-[15px]"
                  onClick={submitCode}
                  disabled={busy || !code}
                >
                  {busy ? "Checking…" : "Redeem"}
                </Button>
              </div>
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                Redeeming while premium is still active adds the extra days on top.
              </p>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="flex min-h-[56px] w-full items-center gap-3 py-3 text-left text-base font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-5" aria-hidden /> Sign out
            </button>
          </>
        )}
      </Section>

      {!loading && session.userId && access?.isAdmin && (
        <Section title="Admin tools">
          <LinkRow
            to="/admin"
            icon={<ShieldCheck />}
            label="Premium code generator"
            hint="Codes, users and who has premium"
          />
          <LinkRow
            to="/charts"
            icon={<CandlestickChart />}
            label="Pro Charts"
            hint="Live charts for admin accounts"
          />
          <LinkRow
            to="/backtest"
            icon={<BarChart3 />}
            label="Den Backtest"
            hint="Replay history against the Den rulebook"
          />
        </Section>
      )}
    </>
  );
}
