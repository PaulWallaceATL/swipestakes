// Swipestakes — Share Win Card
// Renders a stylized win card and lets users copy/share it
// Uses html-to-image for canvas export (no external deps needed)

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Download, Copy, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";

interface WinCardProps {
  question: string;
  outcomeLabel: string;
  odds: string;
  stake: number;
  payout: number;
  category?: string;
  eventTitle?: string;
  username?: string;
  onClose: () => void;
}

// ─── WIN CARD VISUAL ──────────────────────────────────────────────────────────
function WinCardVisual({
  question,
  outcomeLabel,
  odds,
  stake,
  payout,
  category,
  eventTitle,
  username,
  cardRef,
}: WinCardProps & { cardRef: React.RefObject<HTMLDivElement> }) {
  const profit = payout - stake;
  const roi = ((profit / stake) * 100).toFixed(0);

  return (
    <div
      ref={cardRef}
      style={{
        width: 340,
        background: "linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0D1A00 100%)",
        border: "1.5px solid rgba(200,255,0,0.35)",
        borderRadius: 24,
        padding: "28px 24px 24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 0 60px rgba(200,255,0,0.2), 0 0 120px rgba(200,255,0,0.08)",
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,255,0,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
          borderRadius: 24,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#C8FF00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 16,
              color: "#0A0A0A",
              fontFamily: "Barlow Condensed, sans-serif",
            }}
          >
            S
          </div>
          <span
            style={{
              fontFamily: "Barlow Condensed, sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: "#fff",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            SWIPESTAKES
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            background: "rgba(0,255,136,0.12)",
            border: "1px solid rgba(0,255,136,0.3)",
          }}
        >
          <Trophy size={12} color="#00FF88" />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#00FF88", fontWeight: 700 }}>
            WIN
          </span>
        </div>
      </div>

      {/* Category badge */}
      {category && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(0,245,255,0.1)",
            border: "1px solid rgba(0,245,255,0.25)",
            marginBottom: 12,
          }}
        >
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#00F5FF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {category}
          </span>
        </div>
      )}

      {/* Question */}
      <p
        style={{
          fontFamily: "Barlow Condensed, sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: "#fff",
          lineHeight: 1.2,
          marginBottom: 6,
          position: "relative",
        }}
      >
        {question}
      </p>
      {eventTitle && (
        <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
          {eventTitle}
        </p>
      )}

      {/* Outcome pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 20,
          background: "rgba(200,255,0,0.12)",
          border: "1.5px solid rgba(200,255,0,0.4)",
          marginBottom: 20,
        }}
      >
        <Zap size={12} color="#C8FF00" />
        <span
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: "#C8FF00",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {outcomeLabel} · {odds}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "STAKED", value: `$${stake.toFixed(0)}`, color: "rgba(255,255,255,0.5)" },
          { label: "PAYOUT", value: `$${payout.toFixed(2)}`, color: "#00FF88" },
          { label: "ROI", value: `+${roi}%`, color: "#C8FF00" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              {label}
            </p>
            <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 18, color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {username ? `@${username.toLowerCase().replace(/\s+/g, "")}` : "swipestakes.app"}
        </span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "rgba(200,255,0,0.4)" }}>
          swipestakes.app
        </span>
      </div>
    </div>
  );
}

// ─── SHARE WIN CARD MODAL ─────────────────────────────────────────────────────
export default function ShareWinCard(props: WinCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      // Use html-to-image if available, otherwise fallback to clipboard text
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });

      // Try Web Share API first (mobile)
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "swipestakes-win.png", { type: "image/png" });
        await navigator.share({
          title: "I just won on Swipestakes! 🔥",
          text: `${props.question} — ${props.outcomeLabel} @ ${props.odds} · Payout: $${props.payout.toFixed(2)}`,
          files: [file],
        });
        toast("Shared! 🔥");
      } else {
        // Desktop: download the image
        const link = document.createElement("a");
        link.download = "swipestakes-win.png";
        link.href = dataUrl;
        link.click();
        toast("Win card downloaded! 📸");
      }
    } catch {
      // Fallback: copy text to clipboard
      const text = `🏆 I just won on Swipestakes!\n\n${props.question}\n${props.outcomeLabel} @ ${props.odds}\nPayout: $${props.payout.toFixed(2)}\n\nswipestakes.app`;
      await navigator.clipboard.writeText(text).catch(() => {});
      toast("Win details copied to clipboard! 📋");
    } finally {
      setCopying(false);
    }
  };

  const handleCopyText = async () => {
    const text = `🏆 I just won on Swipestakes!\n\n${props.question}\n${props.outcomeLabel} @ ${props.odds}\nPayout: $${props.payout.toFixed(2)}\n\nswipestakes.app`;
    await navigator.clipboard.writeText(text).catch(() => {});
    toast("Copied to clipboard! 📋");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-sm pb-8 px-4"
      >
        {/* Close */}
        <div className="flex justify-end mb-4">
          <button
            onClick={props.onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <X size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>

        {/* Card preview */}
        <div className="flex justify-center mb-6">
          <WinCardVisual {...props} cardRef={cardRef as React.RefObject<HTMLDivElement>} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopyText}
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Copy size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
            <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
              Copy
            </span>
          </button>

          <button
            onClick={handleShare}
            disabled={copying}
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: "#C8FF00",
              boxShadow: "0 0 20px rgba(200,255,0,0.3)",
            }}
          >
            <Share2 size={16} style={{ color: "#0A0A0A" }} />
            <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 15, color: "#0A0A0A" }}>
              {copying ? "Saving..." : "Share"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
