// One-time walkthrough when opening /feed?play=1 (guests). Matches real controls: → YES, ← NO, ↓ skip.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";

const STEPS = [
  {
    emoji: "👋",
    title: "Welcome to PICK5",
    body: "You’ll answer 5 quick questions. No account needed yet — we’ll help you sign up after your last pick.",
  },
  {
    emoji: "✅",
    title: "Say YES",
    body: "Swipe the card to the right, or tap the big green YES button. That locks in “yes” (or “over” on sports lines).",
    visual: "right" as const,
  },
  {
    emoji: "❌",
    title: "Say NO",
    body: "Swipe left, or tap the red NOPE button. That’s “no” (or “under”).",
    visual: "left" as const,
  },
  {
    emoji: "⏭️",
    title: "Not sure?",
    body: "Swipe down on the card or tap SKIP. It still uses one of your five picks — use it whenever you want to pass.",
    visual: "down" as const,
  },
  {
    emoji: "🎯",
    title: "You’re set",
    body: "Make all 5 picks. Then we’ll take you to create a free account so your picks are saved and you can earn credits for gift cards.",
    visual: null,
  },
];

interface FirstPlayGuideProps {
  open: boolean;
  onComplete: () => void;
}

export function FirstPlayGuide({ open, onComplete }: FirstPlayGuideProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const isLast = step >= STEPS.length - 1;
  const s = STEPS[step];

  const advance = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((x) => x + 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4"
          style={{ background: "rgba(8, 5, 28, 0.78)", backdropFilter: "blur(8px)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="first-play-guide-title"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-[400px] rounded-[28px] p-6 pb-7 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(165deg, #2d1065 0%, #1a0a3d 100%)",
              border: "2px solid rgba(255,61,154,0.35)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
              maxHeight: "min(90dvh, 520px)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5 opacity-90"
              style={{
                background: "linear-gradient(90deg, #FF3D9A, #FFD700, #00D4AA)",
              }}
            />

            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: "Nunito, sans-serif", color: "rgba(255,255,255,0.4)" }}>
              Quick tour · {step + 1} / {STEPS.length}
            </p>

            <div className="text-5xl mb-3" aria-hidden>
              {s.emoji}
            </div>

            <h2
              id="first-play-guide-title"
              className="text-2xl mb-3"
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                background: "linear-gradient(135deg, #FFD700, #FF3D9A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {s.title}
            </h2>

            <p className="text-sm leading-relaxed mb-5 px-1" style={{ fontFamily: "Nunito, sans-serif", color: "rgba(255,255,255,0.75)" }}>
              {s.body}
            </p>

            {s.visual && (
              <div className="flex justify-center mb-5">
                <SwipeMini visual={s.visual} />
              </div>
            )}

            <button
              type="button"
              onClick={advance}
              className="w-full py-3.5 rounded-2xl font-bold text-base"
              style={{
                background: "linear-gradient(135deg, #FF3D9A, #FFD700)",
                color: "#1a0a3d",
                boxShadow: "0 5px 0 rgba(0,0,0,0.25), 0 8px 24px rgba(255,61,154,0.35)",
                fontFamily: "'Fredoka One', sans-serif",
                letterSpacing: "0.03em",
              }}
            >
              {isLast ? "Start playing" : "Next"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SwipeMini({ visual }: { visual: "left" | "right" | "down" }) {
  return (
    <div
      className="relative rounded-2xl px-6 py-5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="w-24 h-32 mx-auto rounded-xl bg-gradient-to-br from-pink-500/30 to-violet-600/40 border border-white/20 relative overflow-hidden">
        <motion.div
          className="absolute inset-2 rounded-lg bg-white/20 border border-white/30"
          animate={
            visual === "right"
              ? { x: [0, 28, 0] }
              : visual === "left"
                ? { x: [0, -28, 0] }
                : { y: [0, 20, 0] }
          }
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        />
      </div>
      <div className="flex items-center justify-center gap-2 mt-3 text-white/90">
        {visual === "left" && (
          <>
            <ChevronLeft size={22} className="text-rose-400" />
            <span className="text-xs font-bold" style={{ fontFamily: "Nunito, sans-serif" }}>
              Swipe left
            </span>
          </>
        )}
        {visual === "right" && (
          <>
            <span className="text-xs font-bold" style={{ fontFamily: "Nunito, sans-serif" }}>
              Swipe right
            </span>
            <ChevronRight size={22} className="text-emerald-400" />
          </>
        )}
        {visual === "down" && (
          <>
            <ChevronDown size={22} className="text-slate-300" />
            <span className="text-xs font-bold" style={{ fontFamily: "Nunito, sans-serif" }}>
              Swipe down
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export const FIRST_PLAY_GUIDE_STORAGE_KEY = "sw1sh_first_play_guide_done";
