import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Completing sign-in — ChartPilot" },
      {
        name: "description",
        content: "Completing Google sign-in for ChartPilot.",
      },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) setStatus(`Sign-in failed: ${error.message}`);
          return;
        }
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (!cancelled) setStatus("Could not verify your sign-in. Please try again.");
        return;
      }

      if (!cancelled) navigate({ to: "/settings", replace: true });
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </AppShell>
  );
}
