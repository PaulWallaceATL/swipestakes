// Swipestakes — OnboardingFlow
// Light theme | White background | Dark text | Pink/purple accents
// 3-step onboarding: interests → rewards → algorithm settings

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, Sparkles, Brain, Zap, Target, TrendingUp, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── STEP CONFIG ──────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  { id: 'sports',        label: 'Sports',        emoji: '🏆', description: 'NBA, NFL, MLB, NHL' },
  { id: 'finance',       label: 'Finance',        emoji: '📈', description: 'Stocks, crypto, markets' },
  { id: 'tech',          label: 'Tech',           emoji: '💻', description: 'AI, startups, gadgets' },
  { id: 'politics',      label: 'Politics',       emoji: '🗳️', description: 'Elections, policy, news' },
  { id: 'entertainment', label: 'Entertainment',  emoji: '🎬', description: 'Movies, music, TV' },
  { id: 'culture',       label: 'Culture',        emoji: '🎭', description: 'Trends, pop culture' },
  { id: 'gaming',        label: 'Gaming',         emoji: '🎮', description: 'Esports, game releases' },
  { id: 'health',        label: 'Health',         emoji: '💪', description: 'Fitness, wellness' },
];

const SHOPPING_OPTIONS = [
  { id: 'food',          label: 'Food & Delivery',   emoji: '🍔', description: 'DoorDash, Chipotle, Uber Eats' },
  { id: 'coffee',        label: 'Coffee',             emoji: '☕', description: "Starbucks, Dunkin'" },
  { id: 'shopping',      label: 'Online Shopping',    emoji: '📦', description: 'Amazon, Target, Walmart' },
  { id: 'entertainment', label: 'Streaming',          emoji: '🎬', description: 'Netflix, Spotify, Apple' },
  { id: 'sports',        label: 'Sports & Fitness',   emoji: '👟', description: 'Nike, Fanatics, Adidas' },
  { id: 'gaming',        label: 'Gaming',             emoji: '🎮', description: 'Steam, PlayStation, Xbox' },
  { id: 'travel',        label: 'Travel',             emoji: '✈️', description: 'Hotels, airlines, Airbnb' },
  { id: 'fashion',       label: 'Fashion',            emoji: '👗', description: 'Clothing, accessories' },
];

const PICK_STYLE_OPTIONS = [
  { id: 'high_confidence', label: 'High Confidence Only', emoji: '🎯', description: 'AI picks with 70%+ confidence score', color: '#8B2BE2' },
  { id: 'balanced',        label: 'Balanced Mix',         emoji: '⚖️', description: 'Mix of safe and bold predictions',    color: '#FF3D9A' },
  { id: 'contrarian',      label: 'Contrarian Picks',     emoji: '🔥', description: 'Bold calls that go against the crowd', color: '#F59E0B' },
];

const RISK_STYLE_OPTIONS = [
  { id: 'safe',       label: 'Play It Safe',  emoji: '🛡️', description: 'Favorites and likely outcomes',   color: '#00B894' },
  { id: 'moderate',   label: 'Moderate Risk', emoji: '⚡', description: 'Good odds with real upside',       color: '#F59E0B' },
  { id: 'aggressive', label: 'Go Big',        emoji: '🚀', description: 'High-risk, high-reward picks',     color: '#FF3D9A' },
];

const NOTIF_OPTIONS = [
  { id: 'daily',   label: 'Daily Reminder', emoji: '⏰', description: 'Get reminded when new picks drop' },
  { id: 'results', label: 'Result Alerts',  emoji: '🏆', description: 'Know when your picks resolve' },
  { id: 'streaks', label: 'Streak Alerts',  emoji: '🔥', description: 'Celebrate your winning streaks' },
];

// ─── OPTION CHIP (multi-select) ───────────────────────────────────────────────

function OptionChip({
  option,
  selected,
  onToggle,
  accentColor,
}: {
  option: { id: string; label: string; emoji: string; description?: string };
  selected: boolean;
  onToggle: () => void;
  accentColor?: string;
}) {
  const accent = accentColor || '#FF3D9A';
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className="relative flex items-center gap-3 p-4 rounded-2xl text-left w-full transition-all bg-white"
      style={{
        border: selected ? `2px solid ${accent}` : '2px solid #EBEBEB',
        boxShadow: selected ? `0 4px 16px ${accent}25` : '0 1px 4px rgba(0,0,0,0.04)',
        background: selected ? `${accent}08` : '#FFFFFF',
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1 }}>{option.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          {option.label}
        </p>
        {option.description && (
          <p className="text-xs text-gray-400 truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {option.description}
          </p>
        )}
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <CheckCircle2 size={20} style={{ color: accent, flexShrink: 0 }} />
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── RADIO CHIP (single-select) ───────────────────────────────────────────────

function RadioChip({
  option,
  selected,
  onSelect,
}: {
  option: { id: string; label: string; emoji: string; description?: string; color?: string };
  selected: boolean;
  onSelect: () => void;
}) {
  const accent = option.color || '#FF3D9A';
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-3 p-4 rounded-2xl text-left w-full bg-white"
      style={{
        border: selected ? `2.5px solid ${accent}` : '2px solid #EBEBEB',
        boxShadow: selected ? `0 4px 16px ${accent}25` : '0 1px 4px rgba(0,0,0,0.04)',
        background: selected ? `${accent}08` : '#FFFFFF',
        transition: 'all 0.18s ease',
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1 }}>{option.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          {option.label}
        </p>
        {option.description && (
          <p className="text-xs text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {option.description}
          </p>
        )}
      </div>
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{
          border: selected ? `2px solid ${accent}` : '2px solid #D1D5DB',
          background: selected ? accent : 'transparent',
        }}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </motion.button>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-2 flex-1 rounded-full overflow-hidden bg-gray-100">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FF3D9A, #8B2BE2)' }}
            animate={{ width: i <= step ? '100%' : '0%' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(-1); // -1 = welcome splash
  const [interests, setInterests] = useState<string[]>([]);
  const [shoppingPrefs, setShoppingPrefs] = useState<string[]>([]);
  const [pickStyle, setPickStyle] = useState<string>('balanced');
  const [riskStyle, setRiskStyle] = useState<string>('moderate');
  const [notifPrefs, setNotifPrefs] = useState<string[]>(['daily', 'results']);
  const [saving, setSaving] = useState(false);

  const updateSettings = trpc.settings.update.useMutation();
  const completeOnboarding = trpc.settings.completeOnboarding.useMutation();

  const toggleInterest = (id: string) =>
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleShopping = (id: string) =>
    setShoppingPrefs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleNotif = (id: string) =>
    setNotifPrefs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSkip = async () => {
    try { await completeOnboarding.mutateAsync(); } catch { /* non-fatal */ }
    localStorage.setItem('sw1sh_onboarding_done', '1');
    onComplete();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({
        interests,
        shoppingPreferences: shoppingPrefs,
        preferredCategories: [...interests, ...shoppingPrefs],
        pickStyle: pickStyle as 'high_confidence' | 'balanced' | 'contrarian',
        riskStyle: riskStyle as 'safe' | 'moderate' | 'aggressive',
        notificationPrefs: notifPrefs,
      });
      await completeOnboarding.mutateAsync();
      localStorage.setItem('sw1sh_onboarding_done', '1');
      onComplete();
    } catch {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_STEPS = 3;

  // ── WELCOME SPLASH ──
  if (stepIndex === -1) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#FAFAFA' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-full max-w-xs"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
              boxShadow: '0 16px 48px rgba(255,61,154,0.3)',
            }}
          >
            <span style={{ fontSize: 52 }}>🎯</span>
          </motion.div>

          <h1
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.01em' }}
          >
            <span className="text-gray-800">Welcome to</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Swipestakes!
            </span>
          </h1>
          <p
            className="text-base mb-8 text-gray-500"
            style={{ fontFamily: 'Nunito, sans-serif', lineHeight: 1.6 }}
          >
            5 free picks every day. Swipe to predict. Earn credits. Redeem for gift cards.
          </p>

          {/* How it works mini-cards */}
          <div className="grid grid-cols-3 gap-3 mb-8 w-full">
            {[
              { emoji: '👆', label: 'Swipe', sub: '5 picks/day', color: '#FF3D9A' },
              { emoji: '🏆', label: 'Win', sub: 'Earn credits', color: '#8B2BE2' },
              { emoji: '🎁', label: 'Redeem', sub: 'Gift cards', color: '#00B894' },
            ].map(item => (
              <div
                key={item.label}
                className="flex flex-col items-center p-3 rounded-2xl bg-white"
                style={{
                  border: `1.5px solid ${item.color}25`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: 22, marginBottom: 4 }}>{item.emoji}</span>
                <p className="text-xs font-bold" style={{ color: item.color, fontFamily: "'Fredoka One', sans-serif" }}>{item.label}</p>
                <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>{item.sub}</p>
              </div>
            ))}
          </div>

          <motion.button
            onClick={() => setStepIndex(0)}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 mb-3 text-white"
            style={{
              background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
              boxShadow: '0 6px 24px rgba(255,61,154,0.35)',
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: '1.1rem',
            }}
          >
            Let's personalize your feed <ChevronRight size={18} />
          </motion.button>

          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 underline"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    );
  }

  // ── STEP 0: INTERESTS ──
  if (stepIndex === 0) {
    const canContinue = interests.length >= 1;
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAFAFA' }}>
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <ProgressBar step={0} total={TOTAL_STEPS} />
          <div className="flex items-center gap-3 mt-5 mb-1">
            <span style={{ fontSize: 28 }}>🎯</span>
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              What are you into?
            </h2>
          </div>
          <p className="text-sm text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Pick your interests so we can show you the best daily picks.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {INTEREST_OPTIONS.map((option, i) => (
            <motion.div key={option.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <OptionChip
                option={option}
                selected={interests.includes(option.id)}
                onToggle={() => toggleInterest(option.id)}
                accentColor="#FF3D9A"
              />
            </motion.div>
          ))}
        </div>

        <div className="flex-shrink-0 px-6 pb-8 pt-3">
          <p className="text-xs text-center mb-3 text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {interests.length} selected
            {interests.length < 1 && <span style={{ color: '#FF3D9A' }}> · Pick at least 1</span>}
          </p>
          <motion.button
            onClick={() => setStepIndex(1)}
            disabled={!canContinue}
            whileTap={canContinue ? { scale: 0.97 } : {}}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: canContinue ? 'linear-gradient(135deg, #FF3D9A, #8B2BE2)' : '#E5E7EB',
              color: canContinue ? '#fff' : '#9CA3AF',
              boxShadow: canContinue ? '0 4px 20px rgba(255,61,154,0.35)' : 'none',
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: '1.05rem',
            }}
          >
            Continue <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>
    );
  }

  // ── STEP 1: REWARDS ──
  if (stepIndex === 1) {
    const canContinue = shoppingPrefs.length >= 1;
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAFAFA' }}>
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <ProgressBar step={1} total={TOTAL_STEPS} />
          <div className="flex items-center gap-3 mt-5 mb-1">
            <span style={{ fontSize: 28 }}>🎁</span>
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              Where do you shop?
            </h2>
          </div>
          <p className="text-sm text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            We'll personalize your gift card rewards to match your favorites.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {SHOPPING_OPTIONS.map((option, i) => (
            <motion.div key={option.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <OptionChip
                option={option}
                selected={shoppingPrefs.includes(option.id)}
                onToggle={() => toggleShopping(option.id)}
                accentColor="#8B2BE2"
              />
            </motion.div>
          ))}
        </div>

        <div className="flex-shrink-0 px-6 pb-8 pt-3">
          <p className="text-xs text-center mb-3 text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {shoppingPrefs.length} selected
            {shoppingPrefs.length < 1 && <span style={{ color: '#8B2BE2' }}> · Pick at least 1</span>}
          </p>
          <motion.button
            onClick={() => setStepIndex(2)}
            disabled={!canContinue}
            whileTap={canContinue ? { scale: 0.97 } : {}}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: canContinue ? 'linear-gradient(135deg, #8B2BE2, #FF3D9A)' : '#E5E7EB',
              color: canContinue ? '#fff' : '#9CA3AF',
              boxShadow: canContinue ? '0 4px 20px rgba(139,43,226,0.35)' : 'none',
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: '1.05rem',
            }}
          >
            Continue <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>
    );
  }

  // ── STEP 2: ALGORITHM SETTINGS ──
  if (stepIndex === 2) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#FAFAFA' }}>
        <div className="flex-shrink-0 px-6 pt-6 pb-3">
          <ProgressBar step={2} total={TOTAL_STEPS} />
          <div className="flex items-center gap-3 mt-5 mb-1">
            <Brain size={26} style={{ color: '#8B2BE2' }} />
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              Set your algorithm
            </h2>
          </div>
          <p className="text-sm text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Tell the AI how to pick your 5 daily predictions.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">

          {/* Pick Style */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={15} style={{ color: '#8B2BE2' }} />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Pick Style
              </p>
            </div>
            <div className="space-y-2">
              {PICK_STYLE_OPTIONS.map(opt => (
                <RadioChip
                  key={opt.id}
                  option={opt}
                  selected={pickStyle === opt.id}
                  onSelect={() => setPickStyle(opt.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Risk Style */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} style={{ color: '#F59E0B' }} />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Risk Appetite
              </p>
            </div>
            <div className="space-y-2">
              {RISK_STYLE_OPTIONS.map(opt => (
                <RadioChip
                  key={opt.id}
                  option={opt}
                  selected={riskStyle === opt.id}
                  onSelect={() => setRiskStyle(opt.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell size={15} style={{ color: '#00B894' }} />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Notifications
              </p>
            </div>
            <div className="space-y-2">
              {NOTIF_OPTIONS.map(opt => (
                <OptionChip
                  key={opt.id}
                  option={opt}
                  selected={notifPrefs.includes(opt.id)}
                  onToggle={() => toggleNotif(opt.id)}
                  accentColor="#00B894"
                />
              ))}
            </div>
          </motion.div>

          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-2xl p-4 bg-white"
            style={{
              border: '1.5px solid rgba(255,61,154,0.2)',
              boxShadow: '0 2px 8px rgba(255,61,154,0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: '#FF3D9A' }} />
              <p className="text-xs font-bold text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Your AI Profile
              </p>
            </div>
            <p className="text-xs leading-relaxed text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <span className="text-gray-700 font-bold">
                {interests.slice(0, 2).map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' + ')}
                {interests.length > 2 ? ` +${interests.length - 2} more` : ''}
              </span>
              {' '}picks · {' '}
              <span className="text-gray-700 font-bold">
                {PICK_STYLE_OPTIONS.find(p => p.id === pickStyle)?.label}
              </span>
              {' '}· {' '}
              <span className="text-gray-700 font-bold">
                {RISK_STYLE_OPTIONS.find(r => r.id === riskStyle)?.label}
              </span>
            </p>
          </motion.div>
        </div>

        <div className="flex-shrink-0 px-6 pb-8 pt-3">
          <motion.button
            onClick={handleFinish}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white"
            style={{
              background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
              boxShadow: '0 6px 24px rgba(255,61,154,0.35)',
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: '1.1rem',
            }}
          >
            {saving ? 'Setting up your feed...' : (
              <>
                <Zap size={18} />
                Start playing!
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
}
