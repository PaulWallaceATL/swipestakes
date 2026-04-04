import { getLoginUrl } from "@/const";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const redirectOnUnauthenticated =
    options?.redirectOnUnauthenticated ?? false;
  const redirectPath = options?.redirectPath;
  const utils = trpc.useUtils();
  const [authReady, setAuthReady] = useState(false);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSupabaseSession(session);
      setAuthReady(true);
      void utils.auth.me.invalidate();
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSupabaseSession(session);
      setAuthReady(true);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [utils.auth.me]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30_000,
    enabled: authReady,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (
        error instanceof TRPCClientError &&
        (error.data?.code === "UNAUTHORIZED" ||
          error.data?.httpStatus === 401)
      ) {
        return false;
      }
      return true;
    },
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    try {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data ?? null),
      );
    } catch {
      /* private mode / quota */
    }
    const apiUser = meQuery.data ?? null;
    const supaUser = supabaseSession?.user;
    const apiFailed =
      meQuery.isFetched && meQuery.isError && Boolean(supaUser);
    /** App features (wallet, picks, etc.) need a real row from auth.me */
    const isAuthenticated = Boolean(apiUser);
    const hasSupabaseSession = Boolean(supaUser);
    /** Session OK but API returned 200 with no user (e.g. service role / DB mismatch) — not the same as network error */
    const accountProfileMissing =
      hasSupabaseSession &&
      meQuery.isFetched &&
      !meQuery.isError &&
      !apiUser;
    /** Nav: show account entry whenever Supabase has a session, or API user, or known API outage */
    const showSignedInNav =
      Boolean(apiUser) || apiFailed || hasSupabaseSession;
    const accountEmail = apiUser?.email ?? supaUser?.email ?? null;
    const accountLabel =
      apiUser?.name?.trim() ||
      apiUser?.email ||
      (supaUser?.email ? supaUser.email.split("@")[0] : null) ||
      "Account";
    const profileSyncDown = apiFailed;
    /** Guest PICK5 (5 swipes, then sign-up): only without a Supabase session — not when auth.me is slow/errors. */
    const useGuestPick5Flow = !hasSupabaseSession;
    const accountLinkPending =
      hasSupabaseSession && (meQuery.isLoading || !meQuery.isFetched);
    const accountSyncFailed =
      hasSupabaseSession &&
      meQuery.isFetched &&
      !apiUser &&
      meQuery.isError;

    return {
      user: apiUser,
      loading:
        !authReady || meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated,
      hasSupabaseSession,
      useGuestPick5Flow,
      accountLinkPending,
      accountSyncFailed,
      accountProfileMissing,
      showSignedInNav,
      accountEmail,
      accountLabel,
      profileSyncDown,
    };
  }, [
    authReady,
    meQuery.data,
    meQuery.error,
    meQuery.isFetched,
    meQuery.isLoading,
    meQuery.isError,
    logoutMutation.error,
    logoutMutation.isPending,
    supabaseSession,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (logoutMutation.isPending) return;
    if (state.isAuthenticated) return;
    if (supabaseSession?.user && (meQuery.isLoading || !meQuery.isFetched)) return;
    if (supabaseSession?.user && meQuery.isFetched && meQuery.isError) return;
    if (
      supabaseSession?.user &&
      meQuery.isFetched &&
      !meQuery.isError &&
      meQuery.data == null
    )
      return;
    if (typeof window === "undefined") return;
    const target = redirectPath ?? getLoginUrl();
    try {
      const next = new URL(target, window.location.href);
      if (next.href === window.location.href) return;
    } catch {
      return;
    }
    window.location.href = target;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isError,
    meQuery.isFetched,
    meQuery.isLoading,
    state.isAuthenticated,
    supabaseSession?.user,
    meQuery.data,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
