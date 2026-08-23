import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Copy, Crown, KeyRound, LineChart, MinusCircle, Search, ShieldCheck, Trash2 } from "lucide-react";
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
        <Link to="/market" className="mt-3 inline-flex">
          <Button variant="secondary" className="h-10 rounded-xl">
            <LineChart className="size-4" /> Live market analysis
          </Button>
        </Link>
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

function PremiumUsersPanel() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listPremiumUsers);
  const adjustFn = useServerFn(adjustPremium);

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [daysInput, setDaysInput] = useState<Record<string, number>>({});
  const [dateInput, setDateInput] = useState<Record<string, string>>({});

  const usersQuery = useQuery({
    queryKey: ["premium-users", activeSearch],
    queryFn: async (): Promise<PremiumUser[]> =>
      (await listFn({ data: { search: activeSearch } })) as PremiumUser[],
  });

  const adjust = useMutation({
    mutationFn: async (input: { userId: string; action: "add" | "set" | "revoke"; days?: number; until?: string }) =>
      (await adjustFn({ data: input })) as { ok: boolean; message: string; premiumUntil: string | null },
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["premium-users"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error("Could not update that account."),
  });

  const users = usersQuery.data ?? [];
  const premiumCount = users.filter((user) => user.isPremium).length;

  return (
    <section className="animate-float-in card-soft space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Users & premium</h2>
          <p className="text-xs text-muted-foreground">
            {users.length} account{users.length === 1 ? "" : "s"} · {premiumCount} premium active.
            Add or remove days, set an exact end date, or revoke premium instantly.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          className="h-11 rounded-xl"
          placeholder="Search by email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && setActiveSearch(search)}
        />
        <Button
          variant="secondary"
          className="h-11 rounded-xl"
          onClick={() => setActiveSearch(search)}
          aria-label="Search users"
        >
          <Search className="size-4" />
        </Button>
      </div>

      {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading accounts…</p>}
      {usersQuery.isError && (
        <p className="text-sm text-muted-foreground">Could not load accounts. Try again.</p>
      )}
      {!usersQuery.isLoading && users.length === 0 && (
        <p className="text-sm text-muted-foreground">No accounts match.</p>
      )}

      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.userId} className="panel space-y-2.5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.email ?? "(no email)"}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                  {user.lastSignInAt
                    ? ` · last sign-in ${new Date(user.lastSignInAt).toLocaleDateString()}`
                    : ""}
                  {user.lastCode ? ` · last code ${user.lastCode}` : ""}
                </p>
              </div>
              {user.isAdmin ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-elevated px-2 py-0.5 text-[11px] font-medium text-primary">
                  <ShieldCheck className="size-3" /> Admin
                </span>
              ) : user.isPremium ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-elevated px-2 py-0.5 text-[11px] font-medium text-primary">
                  <Crown className="size-3" /> {user.daysLeft} day{user.daysLeft === 1 ? "" : "s"} left
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  Free
                </span>
              )}
            </div>

            {user.premiumUntil && (
              <p className="text-xs text-muted-foreground">
                Ends {formatPremiumUntil(user.premiumUntil)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Input
                inputMode="numeric"
                className="h-9 w-20 rounded-lg text-sm"
                placeholder="± days"
                value={daysInput[user.userId] ?? ""}
                onChange={(event) =>
                  setDaysInput((current) => ({
                    ...current,
                    [user.userId]: Number(event.target.value) || 0,
                  }))
                }
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-9 rounded-lg"
                disabled={adjust.isPending}
                onClick={() =>
                  adjust.mutate({ userId: user.userId, action: "add", days: daysInput[user.userId] ?? 0 })
                }
              >
                <CalendarClock className="size-3.5" /> Add days
              </Button>
              <Input
                type="date"
                className="h-9 w-36 rounded-lg text-sm"
                value={dateInput[user.userId] ?? ""}
                onChange={(event) =>
                  setDateInput((current) => ({ ...current, [user.userId]: event.target.value }))
                }
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-9 rounded-lg"
                disabled={adjust.isPending || !dateInput[user.userId]}
                onClick={() =>
                  adjust.mutate({ userId: user.userId, action: "set", until: dateInput[user.userId]! })
                }
              >
                Set end date
              </Button>
              {user.isPremium && !user.isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-lg text-destructive"
                  disabled={adjust.isPending}
                  onClick={() => adjust.mutate({ userId: user.userId, action: "revoke" })}
                >
                  <MinusCircle className="size-3.5" /> Revoke
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
