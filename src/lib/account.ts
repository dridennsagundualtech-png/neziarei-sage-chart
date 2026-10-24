/**
 * Client-side account + premium state.
 *
 * Chart analyses stay local to the browser; the account only controls who you
 * are and whether premium analysis is unlocked.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "./premium.functions";

export interface AccessState {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  premiumUntil: string | null;
  isPremium: boolean;
  marketDataEnabled: boolean;
  hiddenPages: string[];
}

/**
 * The last session any screen saw, shared so a screen mounted later starts
 * with it instead of "signed out, loading". Set only in the browser (effects).
 */
let knownSession: { userId: string | null; email: string | null } | null = null;

export function useSession() {
  const [state, setState] = useState<{
    loading: boolean;
    userId: string | null;
    email: string | null;
  }>(() =>
    knownSession
      ? { loading: false, ...knownSession }
      : { loading: true, userId: null, email: null },
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const apply = (userId: string | null, email: string | null) => {
      knownSession = { userId, email };
      if (active) setState({ loading: false, userId, email });
    };

    supabase.auth.getSession().then(({ data }) => {
      apply(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      apply(session?.user.id ?? null, session?.user.email ?? null);
      // Every listener gets INITIAL_SESSION when it subscribes, and tokens refresh
      // hourly; neither changes who you are. Re-checking access on those made
      // every newly mounted screen refetch it, which could loop.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["access"] });
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient]);

  return state;
}

export function useAccess() {
  const session = useSession();
  const fetchAccess = useServerFn(getMyAccess);

  const query = useQuery({
    queryKey: ["access", session.userId],
    enabled: Boolean(session.userId),
    retry: false,
    // A failed check must not re-run each time a screen mounts: gates hide the
    // page while this loads, so that used to loop. Sign-in changes still refetch.
    staleTime: 60_000,
    retryOnMount: false,
    queryFn: async (): Promise<AccessState | null> => {
      // Read the live session immediately before the protected RPC and attach
      // its token to this call. This avoids a race where the global middleware
      // runs while Supabase is still hydrating or clearing its stored session.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return null;
      try {
        return (await fetchAccess({
          headers: { Authorization: `Bearer ${token}` },
        })) as AccessState;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // A stale/invalid session (e.g. token issued by a previous backend)
        // can never recover on its own — clear it and fall back to signed out.
        if (/unauthorized|invalid token|jwt/i.test(message)) {
          await supabase.auth.signOut().catch(() => {});
          return null;
        }
        throw error;
      }
    },
  });

  return {
    session,
    access: query.data ?? null,
    loading: session.loading || (Boolean(session.userId) && query.isLoading),
    refetch: query.refetch,
  };
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}

export function formatPremiumUntil(value: string | null): string {
  if (!value) return "not active";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
