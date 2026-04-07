// Swipestakes — SettingsPage
// Light theme | White background | Dark text | Pink/purple accents

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { BuyPicksBanner } from "@/components/BuyPicksBanner";
import {
  ArrowLeft, User, Bell, Tag,
  Check, LogOut, ChevronRight, Shield, History,
  Coins, Zap, Share2, Users,
} from "lucide-react";

function ReferralSettingsRow() {
  const { data } = trpc.referral.getStats.useQuery(undefined, { retry: false });
  const code = data?.code ?? "...";
  const referred = data?.totalReferred ?? 0;
  const link = `https://swipestakes.vercel.app?ref=${code}`;

  return (
    <button
      className="w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-gray-50"
      style={{ borderBottom: "1px solid #F9FAFB" }}
      onClick={() => {
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(245,158,11,0.1)" }}>
        <Users size={14} style={{ color: "#F59E0B" }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold block text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>
          Refer Friends
        </span>
        <span className="text-[11px] text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
          {referred} referred · 10 signups = 5 bonus picks
        </span>
      </div>
      <Share2 size={14} className="text-gray-300" />
    </button>
  );
}

const CATEGORIES = [
  { id: "sports",        label: "Sports",        emoji: "🏆" },
  { id: "nba",           label: "NBA",            emoji: "🏀" },
  { id: "nfl",           label: "NFL",            emoji: "🏈" },
  { id: "mlb",           label: "MLB",            emoji: "⚾" },
  { id: "politics",      label: "Politics",       emoji: "🗳️" },
  { id: "finance",       label: "Finance",        emoji: "📈" },
  { id: "tech",          label: "Tech",           emoji: "💻" },
  { id: "ai",            label: "AI",             emoji: "🤖" },
  { id: "culture",       label: "Culture",        emoji: "🎭" },
  { id: "entertainment", label: "Entertainment",  emoji: "🎬" },
];

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = trpc.settings.get.useQuery(undefined, { enabled: !!user });
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => toast.success("Settings saved ✓"),
    onError: (e) => toast.error(e.message),
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const [displayName, setDisplayName] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? user?.name ?? "");
      setNotifications(settings.notificationsEnabled);
      setEmailNotifs(settings.emailNotifications);
      setSelectedCategories((settings.preferredCategories as string[]) ?? []);
    }
  }, [settings, user]);

  function toggleCategory(id: string) {
    setDirty(true);
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleSave() {
    updateMutation.mutate({
      displayName,
      defaultBetAmount: 10,
      notificationsEnabled: notifications,
      emailNotifications: emailNotifs,
      preferredCategories: selectedCategories,
    });
    setDirty(false);
  }

  const displayInitial = (displayName || user?.name || "?")[0]?.toUpperCase() ?? "?";

  if (!user) {
    return (
      <div
        className="flex flex-col overflow-y-auto items-center justify-center"
        style={{ height: "calc(100dvh - 72px)", background: '#FAFAFA' }}
      >
        <div className="text-center px-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)" }}
          >
            <User size={28} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-gray-500" style={{ fontFamily: "Nunito, sans-serif" }}>
            Sign in to access settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{ height: "calc(100dvh - 72px)", background: '#FAFAFA' }}
    >
      {/* ── HEADER ── */}
      <div
        className="sticky top-0 z-50 flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.95)",
          borderBottom: "1px solid #EBEBEB",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "#F5F5F7", border: "1px solid #EBEBEB" }}
        >
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-bold flex-1 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          Settings
        </h1>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 text-white"
            style={{
              background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
              fontFamily: "'Fredoka One', sans-serif",
            }}
          >
            {updateMutation.isPending ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      <div className="px-5 pt-4 pb-8 space-y-5 max-w-lg mx-auto w-full">

        {/* ── PROFILE ── */}
        <section>
          <SectionLabel icon={<User size={13} />} label="Profile" color="#FF3D9A" />
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #F3F4F6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {/* Avatar + name */}
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid #F9FAFB" }}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
                style={{ background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)", fontFamily: "'Fredoka One', sans-serif" }}
              >
                {displayInitial}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }}
                  placeholder={user.name ?? "Display name"}
                  className="w-full bg-transparent text-sm font-bold focus:outline-none text-gray-800"
                  style={{ fontFamily: "'Fredoka One', sans-serif" }}
                />
                <p className="text-xs mt-0.5 text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
                  {user.email ?? ""}
                </p>
              </div>
            </div>

            <LightRow icon={<History size={14} />} iconBg="rgba(139,43,226,0.1)" iconColor="#8B2BE2"
              label="Parlay History" onClick={() => navigate("/profile")} />
            <LightRow icon={<Coins size={14} />} iconBg="rgba(255,61,154,0.1)" iconColor="#FF3D9A"
              label="Credits & Wallet" onClick={() => navigate("/wallet")} last />
          </div>
        </section>

        {/* ── INTERESTS ── */}
        <section>
          <SectionLabel icon={<Tag size={13} />} label="Interests" color="#8B2BE2" />
          <div className="rounded-2xl p-4 bg-white" style={{ border: "1px solid #F3F4F6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-xs mb-3 text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
              Personalize your daily picks
            </p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                    style={{
                      fontFamily: "'Fredoka One', sans-serif",
                      background: active ? "rgba(255,61,154,0.1)" : "#F5F5F7",
                      border: active ? "1.5px solid rgba(255,61,154,0.4)" : "1.5px solid #EBEBEB",
                      color: active ? "#FF3D9A" : "#6B7280",
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {active && <Check size={10} />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── NOTIFICATIONS ── */}
        <section>
          <SectionLabel icon={<Bell size={13} />} label="Notifications" color="#F59E0B" />
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #F3F4F6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <ToggleRow
              label="Push Notifications"
              sublabel="Daily picks ready, results"
              value={notifications}
              accentColor="#FF3D9A"
              onChange={(v) => { setNotifications(v); setDirty(true); }}
            />
            <ToggleRow
              label="Email Notifications"
              sublabel="Weekly summary, big wins"
              value={emailNotifs}
              accentColor="#8B2BE2"
              onChange={(v) => { setEmailNotifs(v); setDirty(true); }}
              last
            />
          </div>
        </section>

        {/* ── ACCOUNT ── */}
        <section>
          <SectionLabel icon={<Shield size={13} />} label="Account" color="#6366F1" />
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #F3F4F6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {/* Member since */}
            <div className="p-4" style={{ borderBottom: "1px solid #F9FAFB" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-400" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Member Since
              </p>
              <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>

            {/* Referral */}
            <ReferralSettingsRow />

            {/* Buy picks */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #F9FAFB" }}>
              <BuyPicksBanner compact />
            </div>

            {/* Sign out */}
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-red-50"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,61,154,0.1)" }}>
                <LogOut size={14} style={{ color: "#FF3D9A" }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#FF3D9A", fontFamily: "Nunito, sans-serif" }}>
                {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
              </span>
            </button>
          </div>
        </section>

        {/* ── SAVE BUTTON ── */}
        {dirty && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 text-white"
            style={{
              background: "linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)",
              fontFamily: "'Fredoka One', sans-serif",
              boxShadow: "0 4px 20px rgba(255,61,154,0.35)",
            }}
          >
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <span style={{ color }}>{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
        {label}
      </span>
    </div>
  );
}

function LightRow({ icon, iconBg, iconColor, label, onClick, last = false }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  label: string; onClick: () => void; last?: boolean;
}) {
  return (
    <button
      className="w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-gray-50"
      style={{ borderTop: last ? "1px solid #F9FAFB" : undefined }}
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <span className="text-sm font-semibold flex-1 text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>
        {label}
      </span>
      <ChevronRight size={14} className="text-gray-300" />
    </button>
  );
}

function ToggleRow({
  label, sublabel, value, onChange, accentColor, last = false,
}: {
  label: string; sublabel?: string; value: boolean;
  onChange: (v: boolean) => void; accentColor: string; last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between p-4"
      style={{ borderBottom: last ? "none" : "1px solid #F9FAFB" }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: "Nunito, sans-serif" }}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] mt-0.5 text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
            {sublabel}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
        style={{
          background: value ? accentColor : "#E5E7EB",
          boxShadow: value ? `0 2px 8px ${accentColor}50` : "none",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
          style={{
            background: "#fff",
            left: value ? "calc(100% - 1.375rem)" : "0.125rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}
