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
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
      void utils.auth.me.invalidate();
    });
    return () => subscription.unsubscribe();
  }, [utils.auth.me]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: authReady,
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
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    const apiUser = meQuery.data ?? null;
    const supaUser = supabaseSession?.user;
    const apiFailed =
      meQuery.isFetched && meQuery.isError && Boolean(supaUser);
    /** App features (wallet, picks, etc.) need a real row from auth.me */
    const isAuthenticated = Boolean(apiUser);
    /** Nav / account menu: Supabase signed in even when API is unreachable */
    const showSignedInNav = Boolean(apiUser) || apiFailed;
    const accountEmail = apiUser?.email ?? supaUser?.email ?? null;
    const accountLabel =
      apiUser?.name?.trim() ||
      apiUser?.email ||
      (supaUser?.email ? supaUser.email.split("@")[0] : null) ||
      "Account";
    const profileSyncDown = apiFailed;

    return {
      user: apiUser,
      loading:
        !authReady || meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated,
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
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.isAuthenticated) return;
    if (supabaseSession?.user && meQuery.isFetched && meQuery.isError) return;
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
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
