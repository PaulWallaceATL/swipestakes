import { Zap } from "lucide-react";
import { useLocation } from "wouter";

export function BuyPicksBanner({ compact = false }: { compact?: boolean }) {
  const [, navigate] = useLocation();

  if (compact) {
    return (
      <button
        onClick={() => navigate("/feed")}
        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(139,43,226,0.08) 100%)",
          border: "1.5px solid rgba(0,212,170,0.25)",
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #00D4AA, #00B894)" }}
        >
          <Zap size={16} color="#fff" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            Want more picks?
          </p>
          <p className="text-[10px] text-gray-400" style={{ fontFamily: "Nunito, sans-serif" }}>
            $5 for 5 extra picks — unlimited
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
          style={{
            background: "linear-gradient(135deg, #00D4AA, #00B894)",
            color: "#fff",
            fontFamily: "'Fredoka One', sans-serif",
          }}
        >
          $5
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(139,43,226,0.06))",
        border: "1.5px solid rgba(0,212,170,0.2)",
      }}
    >
      <div className="text-3xl mb-2">🎯</div>
      <p className="text-sm font-bold text-gray-700 mb-1" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
        Get more picks today
      </p>
      <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>
        5 extra picks for $5 — or invite 10 friends for free
      </p>
      <button
        onClick={() => navigate("/feed")}
        className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
        style={{
          background: "linear-gradient(135deg, #00D4AA, #00B894)",
          boxShadow: "0 4px 16px rgba(0,212,170,0.35)",
          fontFamily: "'Fredoka One', sans-serif",
        }}
      >
        <Zap size={14} className="inline mr-1.5 -mt-0.5" />
        Buy 5 Picks — $5
      </button>
    </div>
  );
}
