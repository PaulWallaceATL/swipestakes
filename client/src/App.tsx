// Swipestakes — App Router
// Light colorful theme | Mobile-first 480px shell

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./components/AppShell";
import HomeFeed from "./pages/HomeFeed";
import WalletPage from "./pages/WalletPage";
import BetLogPage from "./pages/BetLogPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingFlow from "./pages/OnboardingFlow";
import RedeemPage from "./pages/RedeemPage";
import LoyaltyPage from "./pages/LoyaltyPage";
import { trpc } from "./lib/trpc";

const ONBOARDING_KEY = "sw1sh_onboarding_done";

// Proper component so hooks rules are satisfied
function OnboardingRoute({ onDone }: { onDone: () => void }) {
  return <OnboardingFlow onComplete={onDone} />;
}

function useCaptureReferralCode() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) localStorage.setItem("sw1sh_referral_code", ref);
    } catch { /* SSR-safe */ }
  }, []);
}

function AppRouter() {
  useCaptureReferralCode();
  const [, navigate] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: !!user });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user || isLoading || settings === undefined) return;
    const serverDone = !!(settings as any)?.onboardingCompletedAt;
    let localDone = false;
    try {
      localDone = !!localStorage.getItem(ONBOARDING_KEY);
    } catch {
      /* private mode */
    }
    if (!serverDone && !localDone) {
      setShowOnboarding(true);
    }
  }, [user, settings, isLoading]);

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          try {
            localStorage.setItem(ONBOARDING_KEY, "1");
          } catch {
            /* ignore */
          }
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <AppShell>
      <Switch>
        <Route path="/feed" component={HomeFeed} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/bets" component={BetLogPage} />
        <Route path="/redeem" component={RedeemPage} />
        <Route path="/loyalty" component={LoyaltyPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        {/* /saved redirects to /profile — using Redirect component avoids hook-in-callback violation */}
        <Route path="/saved"><Redirect to="/profile" /></Route>
        <Route path="/onboarding">
          <OnboardingRoute onDone={() => {
            try {
              localStorage.setItem(ONBOARDING_KEY, "1");
            } catch {
              /* ignore */
            }
            navigate("/feed");
          }} />
        </Route>
        <Route component={HomeFeed} />
      </Switch>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={AppRouter} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            theme="light"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                color: '#1a1a2e',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
