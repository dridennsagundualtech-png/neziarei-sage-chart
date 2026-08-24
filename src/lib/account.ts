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
}

export function useSession() {
  const [state, setState] = useState<{
    loading: boolean;
    userId: string | null;
    email: string | null;
  }>({ loading: true, userId: null, email: null });
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const apply = (userId: string | null, email: string | null) => {
      if (active) setState({ loading: false, userId, email });
    };

    supabase.auth.getSession().then(({ data }) => {
      apply(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user.id ?? null, session?.user.email ?? null);
      queryClient.invalidateQueries({ queryKey: ["access"] });
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
    queryFn: async (): Promise<AccessState> => (await fetchAccess()) as AccessState,
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
