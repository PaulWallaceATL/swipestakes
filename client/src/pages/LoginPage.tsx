import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

function safeReturn(search: string): string {
  const raw = new URLSearchParams(search).get("return") ?? "/feed";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/feed";
  return raw;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const returnPath = safeReturn(search);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || password.length < 6) {
      toast.error("Enter email and a password (min 6 characters).");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: trimmed,
          password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Account ready — you're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      navigate(returnPath);
    } finally {
      setLoading(false);
    }
  };

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
