import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Chrome, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/account";


export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ChartPilot" },
      {
        name: "description",
        content:
          "Sign in to ChartPilot to unlock premium chart analysis with a premium code, or create a free account.",
      },
      { property: "og:title", content: "Sign in — ChartPilot" },
      { property: "og:description", content: "Sign in or create your ChartPilot account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <AppShell>
      <AuthForm />
    </AppShell>
  );
}

function AuthForm() {
  const navigate = useNavigate();
  const session = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session.userId) navigate({ to: "/settings", replace: true });
  }, [session.userId, navigate]);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("Enter your email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/settings` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/settings` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to save your analyses, journal, and premium access across devices.
        </p>
      </header>

      <section className="animate-float-in card-soft space-y-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-11 rounded-xl"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="h-11 rounded-xl"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={busy}>
          {mode === "signin" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <Button variant="outline" className="h-12 w-full rounded-xl" onClick={google}>
          Continue with Google
        </Button>

        <button
          type="button"
          className="w-full pt-1 text-xs text-muted-foreground underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </div>
  );
}
