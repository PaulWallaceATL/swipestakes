// PICK5 — candy-gem progress (Candy Crush–style 5-slot tracker)

import { motion } from "framer-motion";

const GEM = [
  { fill: "linear-gradient(145deg, #FF5FA8 0%, #FF3D9A 45%, #C0267E 100%)", shadow: "0 4px 0 #9D174D, 0 6px 14px rgba(255,61,154,0.45)" },
  { fill: "linear-gradient(145deg, #FFB84D 0%, #FF8C42 45%, #EA580C 100%)", shadow: "0 4px 0 #9A3412, 0 6px 14px rgba(255,140,66,0.4)" },
  { fill: "linear-gradient(145deg, #FFE566 0%, #FFD700 45%, #CA8A04 100%)", shadow: "0 4px 0 #A16207, 0 6px 14px rgba(255,215,0,0.45)" },
  { fill: "linear-gradient(145deg, #C4F06A 0%, #A8E63D 45%, #65A30D 100%)", shadow: "0 4px 0 #3F6212, 0 6px 14px rgba(168,230,61,0.4)" },
  { fill: "linear-gradient(145deg, #5EEBC5 0%, #00D4AA 45%, #0D9488 100%)", shadow: "0 4px 0 #115E59, 0 6px 14px rgba(0,212,170,0.45)" },
];

interface Pick5ProgressProps {
  /** Picks already locked in this round (0–5) */
  filled: number;
  /** 1-based index of the next pick to play, or null if round complete */
  activeIndex: number | null;
  className?: string;
}

export function Pick5Progress({ filled, activeIndex, className = "" }: Pick5ProgressProps) {
  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-1.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const done = n <= filled;
        const active = activeIndex === n && !done;
        const cfg = GEM[n - 1];
        return (
          <motion.div
            key={n}
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 34,
              height: 34,
              background: done ? cfg.fill : "linear-gradient(145deg, #E8E8ED 0%, #D1D5DB 100%)",
              boxShadow: done ? cfg.shadow : "0 3px 0 #9CA3AF, inset 0 1px 0 rgba(255,255,255,0.5)",
              border: done ? "2px solid rgba(255,255,255,0.35)" : "2px solid rgba(255,255,255,0.8)",
            }}
            animate={
              active
                ? { scale: [1, 1.12, 1], y: [0, -3, 0] }
                : { scale: 1, y: 0 }
            }
            transition={active ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" } : {}}
          >
            {done ? (
              <span className="text-sm font-black leading-none text-white drop-shadow-md" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                ✓
              </span>
            ) : (
              <span
                className="text-[11px] font-black leading-none"
                style={{
                  fontFamily: "'Fredoka One', sans-serif",
                  color: active ? "#6B7280" : "#9CA3AF",
                }}
              >
                {n}
              </span>
            )}
            {active && (
              <motion.span
                className="absolute -inset-1 rounded-full pointer-events-none"
                style={{ border: "2px solid #FF3D9A" }}
                animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
