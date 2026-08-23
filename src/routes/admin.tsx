import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Copy, Crown, KeyRound, MinusCircle, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPremiumUntil, useAccess } from "@/lib/account";
import {
  adjustPremium,
  createPremiumCodes,
  deletePremiumCode,
  listPremiumCodes,
  listPremiumUsers,
} from "@/lib/premium.functions";

interface PremiumUser {
  userId: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  premiumUntil: string | null;
  daysLeft: number | null;
  isPremium: boolean;
  isAdmin: boolean;
  lastCode: string | null;
}



export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Premium code generator — ChartPilot" },
      {
        name: "description",
        content:
          "Admin tools for ChartPilot: generate premium access codes with a custom duration, usage limit and code expiry.",
      },
      { property: "og:title", content: "Premium code generator — ChartPilot" },
      { property: "og:description", content: "Generate and manage ChartPilot premium codes." },
    ],
  }),
  component: AdminPage,
});

interface CodeRow {
  id: string;
  code: string;
  duration_days: number;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  note: string | null;
  created_at: string;
}

function AdminPage() {
  return (
    <AppShell>
      <AdminPanel />
    </AppShell>
  );
}

function AdminPanel() {
  const { access, session, loading } = useAccess();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listPremiumCodes);
  const createFn = useServerFn(createPremiumCodes);
  const deleteFn = useServerFn(deletePremiumCode);

  const [durationDays, setDurationDays] = useState(30);
  const [count, setCount] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [codeExpiresInDays, setCodeExpiresInDays] = useState(0);
  const [prefix, setPrefix] = useState("CP");
  const [note, setNote] = useState("");

  const isAdmin = Boolean(access?.isAdmin);

  const codesQuery = useQuery({
    queryKey: ["premium-codes"],
    enabled: isAdmin,
    queryFn: async (): Promise<CodeRow[]> => (await listFn()) as CodeRow[],
  });

  const create = useMutation({
    mutationFn: async () =>
      (await createFn({
        data: {
          count,
          durationDays,
          maxUses,
          codeExpiresInDays: codeExpiresInDays > 0 ? codeExpiresInDays : null,
          prefix,
          note,
        },
      })) as CodeRow[],
    onSuccess: (rows) => {
      toast.success(`Created ${rows.length} code${rows.length === 1 ? "" : "s"}.`);
      queryClient.invalidateQueries({ queryKey: ["premium-codes"] });
    },
    onError: () => toast.error("Could not create codes."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["premium-codes"] }),
  });

  if (loading) {
    return <p className="card-soft p-5 text-sm text-muted-foreground">Checking your access…</p>;
  }

  if (!session.userId) {
    return (
      <div className="card-soft space-y-3 p-5">
        <h1 className="font-display text-lg font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">Sign in with the admin account to continue.</p>
        <Link to="/auth" className="inline-flex">
          <Button className="h-11 rounded-xl">Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card-soft space-y-2 p-5">
        <h1 className="font-display text-lg font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          This account ({access?.email ?? "unknown"}) does not have admin access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">Premium code generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how long premium lasts, how many people can use one code, and when the code itself
          stops working.
        </p>
      </header>

      <section className="animate-float-in card-soft space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="duration">Premium lasts (days)</Label>
            <Input
              id="duration"
              inputMode="numeric"
              className="h-11 rounded-xl"
              value={durationDays}
              onChange={(event) => setDurationDays(Number(event.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">7 = a week, 30 = a month, 365 = a year.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="count">How many codes</Label>
            <Input
              id="count"
              inputMode="numeric"
              className="h-11 rounded-xl"
              value={count}
              onChange={(event) => setCount(Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxuses">Uses per code</Label>
            <Input
              id="maxuses"
              inputMode="numeric"
              className="h-11 rounded-xl"
              value={maxUses}
              onChange={(event) => setMaxUses(Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codeexp">Code itself expires in (days, 0 = never)</Label>
            <Input
              id="codeexp"
              inputMode="numeric"
              className="h-11 rounded-xl"
              value={codeExpiresInDays}
              onChange={(event) => setCodeExpiresInDays(Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prefix">Code prefix</Label>
            <Input
              id="prefix"
              className="h-11 rounded-xl"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value.toUpperCase().slice(0, 8))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              className="h-11 rounded-xl"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <Button
          className="h-12 w-full rounded-xl"
          onClick={() => create.mutate()}
          disabled={create.isPending}
        >
          <KeyRound className="size-4" /> Generate codes
        </Button>
      </section>

      <PremiumUsersPanel />

      <section className="animate-float-in card-soft space-y-2 p-4">
        <h2 className="font-display text-base font-semibold">Existing codes</h2>
        {codesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {codesQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No codes yet.</p>
        )}
        <ul className="space-y-2">
          {(codesQuery.data ?? []).map((row) => (
            <li key={row.id} className="panel flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold">{row.code}</p>
                <p className="text-xs text-muted-foreground">
                  {row.duration_days} day{row.duration_days === 1 ? "" : "s"} premium · {row.uses}/
                  {row.max_uses} used
                  {row.expires_at
                    ? ` · code expires ${new Date(row.expires_at).toLocaleDateString()}`
                    : ""}
                  {row.note ? ` · ${row.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Copy ${row.code}`}
                  onClick={() => {
                    navigator.clipboard.writeText(row.code);
                    toast.success("Code copied.");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${row.code}`}
                  onClick={() => remove.mutate(row.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
