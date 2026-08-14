import { useState, type ReactNode } from "react";
import { LineChart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/lib/data";

/**
 * ChartPilot is a private journal, so every screen requires a signed-in trader.
 * Data is protected per-user by database row-level policies.
 */
export function AuthGate({ children }: { children: (userId: string) => ReactNode }) {
  const { session, ready } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (session?.user) return <>{children(session.user.id)}</>;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try email instead.");
    }
  };

  return (
    <div className="animate-float-in mx-auto mt-8 max-w-sm card-soft p-6">
      <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary hero-glow">
        <LineChart className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        {mode === "signin" ? "Welcome back" : "Create your journal"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your analyses, screenshots and statistics are private to your account.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <Button variant="secondary" className="mt-3 h-11 w-full rounded-xl" onClick={google}>
        Continue with Google
      </Button>

      <button
        type="button"
        className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
