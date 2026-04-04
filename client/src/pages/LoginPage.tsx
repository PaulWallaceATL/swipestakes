import { useState, useEffect, useRef, type FormEvent } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getSiteOrigin } from "@/lib/siteUrl";
import { trpc } from "@/lib/trpc";

function safeReturn(search: string): string {
  const raw = new URLSearchParams(search).get("return") ?? "/feed";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/feed";
  return raw;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const returnPath = safeReturn(search);
  const utils = trpc.useUtils();
  const serverUnreachableToastRef = useRef(false);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  /** Email confirmation required — user must click link before signing in */
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");
  const [sessionResolved, setSessionResolved] = useState(false);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setHasSupabaseSession(!!session);
      setSessionResolved(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only redirect when the API recognizes the user. Supabase-only checks caused a bounce:
  // session in localStorage + failing auth.me (e.g. API 404) looked like "Sign in → home refresh".
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: sessionResolved && hasSupabaseSession,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!sessionResolved || !hasSupabaseSession) return;
    if (meQuery.isLoading) return;
    if (!meQuery.data) return;
    const path = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", path);
    navigate(returnPath);
  }, [
    sessionResolved,
    hasSupabaseSession,
    meQuery.isLoading,
    meQuery.data,
    navigate,
    returnPath,
  ]);

  useEffect(() => {
    if (!sessionResolved || !hasSupabaseSession) return;
    if (meQuery.isLoading) return;
    if (meQuery.data) return;
    if (!meQuery.error) return;
    if (serverUnreachableToastRef.current) return;
    serverUnreachableToastRef.current = true;
    toast.error("Can't reach the server. Check your connection or try again later.");
  }, [
    sessionResolved,
    hasSupabaseSession,
    meQuery.isLoading,
    meQuery.data,
    meQuery.error,
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || password.length < 6) {
      toast.error("Enter email and a password (min 6 characters).");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const origin = getSiteOrigin();
        if (!origin) {
          toast.error("Missing site URL. Set VITE_SITE_URL for production auth emails.");
          return;
        }
        const redirect = new URL("/login", origin);
        redirect.searchParams.set("return", returnPath);
        const { data, error } = await supabase.auth.signUp({
          email: trimmed,
          password,
          options: {
            emailRedirectTo: redirect.toString(),
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          setAwaitingEmailConfirm(false);
          toast.success("Account created — you're signed in.");
          await utils.auth.me.invalidate();
          navigate(returnPath);
          return;
        }
        setSentToEmail(trimmed);
        setAwaitingEmailConfirm(true);
        toast.success("Check your email to confirm your account.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Confirm your email first — we sent you a link.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Signed in.");
        await utils.auth.me.invalidate();
        navigate(returnPath);
      }
    } finally {
      setLoading(false);
    }
  };

  if (
    !awaitingEmailConfirm &&
    (!sessionResolved || (hasSupabaseSession && meQuery.isLoading))
  ) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: "#F8F7FF", fontFamily: "Nunito, sans-serif" }}
      >
        <p className="text-sm font-semibold text-gray-500">Checking your session…</p>
      </div>
    );
  }

  if (awaitingEmailConfirm) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: "#F8F7FF", fontFamily: "Nunito, sans-serif" }}
      >
        <div
          className="w-full max-w-md rounded-3xl p-8 shadow-xl bg-white text-center"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="text-5xl mb-4">📬</div>
          <h1
            className="text-2xl font-black mb-3"
            style={{
              fontFamily: "'Fredoka One', sans-serif",
              background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Check your email
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            We sent a confirmation link to{" "}
            <span className="font-bold text-gray-800">{sentToEmail}</span>. Open it on this device — you&apos;ll be signed in
            and can play your daily PICK5.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Link must open on the same site you signed up on. If it opens localhost, set{" "}
            <code className="text-gray-600">VITE_SITE_URL</code> on Vercel and Supabase Site URL to your live domain.
          </p>
          <button
            type="button"
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm mb-3"
            style={{
              background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
              fontFamily: "'Fredoka One', sans-serif",
            }}
            onClick={() => {
              setAwaitingEmailConfirm(false);
              setSentToEmail("");
            }}
          >
            Back to sign in
          </button>
          <button
            type="button"
            className="w-full text-sm text-gray-400 font-semibold"
            onClick={() => navigate("/")}
          >
            ← Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "#F8F7FF", fontFamily: "Nunito, sans-serif" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-xl bg-white"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-black mb-2"
            style={{
              fontFamily: "'Fredoka One', sans-serif",
              background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Swipestakes
          </h1>
          <p className="text-sm text-gray-500">
            {mode === "signin" ? "Sign in with email" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-xs font-bold text-gray-600 block mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-bold text-gray-600 block mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
              boxShadow: "0 4px 16px rgba(255,61,154,0.3)",
              fontFamily: "'Fredoka One', sans-serif",
            }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="font-bold text-purple-600"
                onClick={() => setMode("signup")}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-bold text-purple-600"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <button
          type="button"
          className="w-full mt-4 text-sm text-gray-400 font-semibold"
          onClick={() => navigate("/")}
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
