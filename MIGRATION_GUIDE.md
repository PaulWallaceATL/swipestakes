# Swipestakes — Migration Guide
## Manus → Supabase (PostgreSQL) + Railway/Vercel

This guide takes you from the exported Manus project to a fully live stack on
**Supabase** (database + auth) + **Railway** (Express backend) + **Vercel** (React frontend).

---

## 1. Export the Code

In the Manus Management UI:
1. **Settings → GitHub** → connect your account → export to a new private repo
2. Clone locally: `git clone https://github.com/yourname/sw1sh && cd sw1sh`
3. Open in Cursor: `cursor .`

---

## 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (e.g. `us-east-1`)
3. Save the **database password** — you will need it once
4. From **Project Settings → Database**, copy the **Connection string (URI)** — it looks like:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
5. From **Project Settings → API**, copy:
   - `SUPABASE_URL` (e.g. `https://xxxx.supabase.co`)
   - `SUPABASE_ANON_KEY` (public, safe for frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` (private, server-only)

---

## 3. Run the Database Schema

1. In Supabase → **SQL Editor** → New Query
2. Paste the entire contents of `SUPABASE_SCHEMA.sql` from this repo
3. Click **Run** — this creates all 18 tables, enums, indexes, RLS policies, and triggers

> **Note:** The `handle_new_user` trigger auto-creates wallet, credits, loyalty stats,
> and settings rows whenever a new user is inserted into the `users` table.

---

## 4. Enable Supabase Auth

In Supabase → **Authentication → Providers**, enable:
- **Email** (magic link or password — your choice)
- **Google** (add OAuth credentials from Google Cloud Console)
- **Apple** (optional, needed for iOS)

Set the **Site URL** to your production domain (e.g. `https://swipestakes.com`).
Add `http://localhost:3000` to **Redirect URLs** for local dev.

---

## 5. Replace Manus Auth with Supabase Auth

### 5a. Install dependencies (already done if you used this repo)
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 5b. Update environment variables

Create `.env.local` in the project root:
```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres

# Supabase Auth
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # server-only, never expose to frontend
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...     # safe for frontend

# JWT (generate a random 32-char string)
JWT_SECRET=your-random-32-char-secret-here

# Stripe (same keys from Manus)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5c. Replace server/db.ts auth helpers

The `upsertUser` function now uses Supabase user IDs. When a user signs in via
Supabase Auth, their `auth.user.id` (UUID) becomes the `openId` field in your
`users` table. Replace the `upsertUser` call in your auth flow:

```typescript
// server/_core/supabaseAuth.ts  (NEW FILE)
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import * as db from '../db';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function authenticateRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Upsert into our users table using Supabase user ID as openId
  await db.upsertUser({
    openId: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? null,
    loginMethod: user.app_metadata?.provider ?? null,
    lastSignedIn: new Date(),
  });

  return db.getUserByOpenId(user.id);
}
```

### 5d. Update server context

In `server/_core/context.ts`, replace the `sdk.authenticateRequest` call:
```typescript
import { authenticateRequest } from './supabaseAuth';

export async function createContext(opts: CreateExpressContextOptions) {
  let user = null;
  try {
    user = await authenticateRequest(opts.req);
  } catch { user = null; }
  return { req: opts.req, res: opts.res, user };
}
```

### 5e. Update frontend auth

Replace `client/src/_core/hooks/useAuth.ts` to use Supabase client-side auth:

```typescript
// client/src/lib/supabase.ts  (NEW FILE)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

```typescript
// client/src/_core/hooks/useAuth.ts  (REPLACE)
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    logout,
    error: null,
  };
}
```

### 5f. Update tRPC client to send Supabase token

In `client/src/main.tsx`, update the httpBatchLink to include the Supabase JWT:
```typescript
import { supabase } from '@/lib/supabase';

httpBatchLink({
  url: '/api/trpc',
  transformer: superjson,
  async headers() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  },
})
```

### 5g. Remove Manus OAuth route

Delete or comment out the `registerOAuthRoutes(app)` call in `server/_core/index.ts`
and the `server/_core/oauth.ts` file — they are no longer needed.

---

## 6. Remove mysql2 dependency

```bash
pnpm remove mysql2
```

The codebase now uses `postgres` (the `postgres.js` driver) exclusively.

---

## 7. Deploy Backend to Railway

Railway runs the full Express server with zero config changes needed.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Set all environment variables from `.env.local` in the Railway dashboard under
**Variables**. Railway will auto-detect the `pnpm start` script.

Your backend URL will be something like `https://sw1sh-production.up.railway.app`.

---

## 8. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

vercel
```

When prompted:
- **Framework**: Vite
- **Build command**: `pnpm build`
- **Output directory**: `dist`

Set these environment variables in the Vercel dashboard:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://sw1sh-production.up.railway.app
```

Update the tRPC client URL in `client/src/main.tsx` to use `VITE_API_URL`:
```typescript
url: `${import.meta.env.VITE_API_URL ?? ''}/api/trpc`,
```

---

## 9. Configure CORS on the Backend

In `server/_core/index.ts`, add CORS to allow your Vercel domain:
```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://swipestakes.com',
    'https://sw1sh.vercel.app',
  ],
  credentials: true,
}));
```

Install: `pnpm add cors && pnpm add -D @types/cors`

---

## 10. Data Feeds — What Carries Over

All the data feeds work identically after migration — they run on the server and
write to the database. No changes needed to the feed logic itself.

| Feed | Source | How it works | Changes needed |
|---|---|---|---|
| **Daily picks** | Kalshi public API | `server/betIngestion.ts` polls `api.elections.kalshi.com` | None |
| **Pick images** | Unsplash/Pexels CDN | Category-based URL mapping in `betIngestion.ts` | None |
| **Video clips** | YouTube Data API | `server/videoFeed.ts` fetches by sport keyword | Add `YOUTUBE_API_KEY` to Railway env |
| **Odds/prices** | Kalshi market prices | Embedded in market fetch | None |
| **AI confidence** | Built-in LLM | `server/_core/llm.ts` calls Manus Forge API | Replace with OpenAI API key |

### Replacing the Manus LLM helper

In `server/_core/llm.ts`, the `invokeLLM` function calls the Manus Forge API.
Replace with the OpenAI SDK:

```bash
pnpm add openai
```

```typescript
// server/_core/llm.ts  (REPLACE invokeLLM)
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function invokeLLM({ messages }: { messages: any[] }) {
  return openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });
}
```

Add `OPENAI_API_KEY` to your Railway environment variables.

---

## 11. Environment Variables Summary

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Railway | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Railway | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway | Server-side Supabase admin key |
| `JWT_SECRET` | Railway | Session signing (keep for cookie fallback) |
| `STRIPE_SECRET_KEY` | Railway | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Railway | Stripe webhook verification |
| `YOUTUBE_API_KEY` | Railway | Video clip fetching |
| `OPENAI_API_KEY` | Railway | AI confidence scoring |
| `VITE_SUPABASE_URL` | Vercel | Frontend Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel | Frontend Supabase public key |
| `VITE_SITE_URL` | Vercel | **Public app URL** (e.g. `https://your-app.vercel.app`) — used in confirmation-email links so they never point at `localhost` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Vercel | Frontend Stripe |
| `VITE_API_URL` | Vercel | Railway backend URL |

### Supabase Auth URL configuration (required for email confirmation)

In **Supabase Dashboard → Authentication → URL Configuration**:

1. **Site URL** — set to your **production** origin (same as `VITE_SITE_URL`), not `http://localhost:3000`.
2. **Redirect URLs** — add your production URLs, for example:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/login`
   - (optional for local dev) `http://localhost:5173/**` and `http://localhost:5173/login`

The app sends `emailRedirectTo` to `{VITE_SITE_URL or current origin}/login?return=...`. Those URLs must be allowed in **Redirect URLs**, or Supabase will fall back to Site URL / block the redirect.

---

## 12. Checklist

- [ ] Supabase project created
- [ ] `SUPABASE_SCHEMA.sql` executed in SQL Editor
- [ ] Supabase Auth providers enabled (Email + Google)
- [ ] `.env.local` created with all variables
- [ ] `mysql2` removed, `postgres` driver confirmed
- [ ] `server/_core/supabaseAuth.ts` created
- [ ] `server/_core/context.ts` updated
- [ ] `client/src/lib/supabase.ts` created
- [ ] `client/src/_core/hooks/useAuth.ts` updated
- [ ] `client/src/main.tsx` tRPC client updated with auth headers
- [ ] Manus OAuth routes removed
- [ ] `invokeLLM` replaced with OpenAI SDK
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] CORS configured for production domain
- [ ] Stripe webhook URL updated to Railway endpoint
- [ ] `VITE_SITE_URL` set on Vercel to production origin; Supabase Site URL + Redirect URLs match
- [ ] End-to-end test: sign up → pick 5 → see results

---

## Data Model Notes

The `users.openId` field maps directly to `auth.users.id` in Supabase (a UUID
stored as text). This is the single join key between Supabase Auth and your
application data. Every user-owned table (`wallets`, `daily_picks`, `credits`,
etc.) references `users.id` (the serial integer PK), not the UUID directly —
this keeps foreign keys fast and your queries simple.

The `handle_new_user` PostgreSQL trigger auto-provisions wallet, credits,
loyalty stats, and settings rows the moment a user row is inserted, so you
never need to manually create these in application code.
