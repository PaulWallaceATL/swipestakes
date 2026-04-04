import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { supabase } from "./lib/supabase";
import "./index.css";

function injectUmamiIfConfigured() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  if (!endpoint?.trim() || !websiteId?.trim()) return;
  try {
    const src = new URL(
      "umami",
      endpoint.endsWith("/") ? endpoint : `${endpoint}/`,
    ).toString();
    const s = document.createElement("script");
    s.defer = true;
    s.src = src;
    s.dataset.websiteId = websiteId;
    document.body.appendChild(s);
  } catch {
    /* ignore invalid analytics URL */
  }
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Same-origin /api/trpc only works if Vercel deploys `api/*` (see vercel.json).
// If /api/* returns 404, deploy the Node server (pnpm start) e.g. on Railway and set:
//   VITE_API_URL=https://your-service.up.railway.app   (no trailing slash)
const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiBase}/api/trpc`,
      transformer: superjson,
      async headers() {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

injectUmamiIfConfigured();

/** Parse #access_token from email confirmation links before first render. */
async function bootstrap() {
  await supabase.auth.getSession();
  createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>,
  );
}

void bootstrap();
