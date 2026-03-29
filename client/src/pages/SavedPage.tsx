import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, BookmarkX, TrendingUp, Clock, Zap } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  sports: "#00C8FF",
  nba: "#00C8FF",
  nfl: "#00C8FF",
  mlb: "#00C8FF",
  politics: "#FF6B35",
  geopolitical: "#FF6B35",
  finance: "#A855F7",
  tech: "#22D3EE",
  ai: "#C8FF00",
  culture: "#FF6B9D",
  entertainment: "#FF6B9D",
  daily: "#FFFFFF",
};

function formatOdds(price: string | null | undefined): string {
  if (!price) return "+100";
  const p = parseFloat(price);
  if (p >= 0.5) return `-${Math.round((p / (1 - p)) * 100)}`;
  return `+${Math.round(((1 - p) / p) * 100)}`;
}

function formatDeadline(ts: Date | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 0) return "CLOSED";
  if (diffH < 1) return `${Math.floor(diffMs / 60000)}m left`;
  if (diffH < 24) return `${diffH}h left`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SavedPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: savedList, isLoading } = trpc.markets.mySaved.useQuery(undefined, {
    enabled: !!user,
  });

  const unsaveMutation = trpc.markets.unsave.useMutation({
    onSuccess: () => {
      utils.markets.mySaved.invalidate();
      utils.markets.savedIds.invalidate();
      toast.success("Removed from saved");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="text-center px-6">
          <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
            SIGN IN TO VIEW SAVED MARKETS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0A", color: "white" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-4"
        style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => navigate("/bets")}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" style={{ color: "#C8FF00" }} />
          <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em" }}>
            SAVED MARKETS
          </h1>
        </div>
        {savedList && savedList.length > 0 && (
          <span
            className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-black"
            style={{ background: "rgba(200,255,0,0.15)", color: "#C8FF00", fontFamily: "JetBrains Mono, monospace" }}
          >
            {savedList.length}
          </span>
        )}
      </div>

      <div className="px-4 pt-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : !savedList || savedList.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {savedList.map((item) => {
              const catColor = CATEGORY_COLORS[(item.eventCategory ?? "").toLowerCase()] ?? "#FFFFFF";
              const yesOdds = formatOdds(item.yesPrice as string | null);
              const deadline = formatDeadline(item.resolutionDeadline);
              const impliedProb = item.yesPrice ? Math.round(parseFloat(String(item.yesPrice)) * 100) : 50;

              return (
                <div
                  key={item.marketId}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Top row: category + deadline + unsave */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-black"
                      style={{
                        background: `${catColor}18`,
                        color: catColor,
                        fontFamily: "JetBrains Mono, monospace",
                        letterSpacing: "0.06em",
                        border: `1px solid ${catColor}30`,
                      }}
                    >
                      {(item.leagueOrTopic ?? item.eventCategory ?? "MARKET").toUpperCase()}
                    </span>
                    {deadline && (
                      <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                        <Clock className="w-3 h-3" />
                        {deadline}
                      </span>
                    )}
                    <button
                      onClick={() => unsaveMutation.mutate({ marketId: item.marketId })}
                      className="ml-auto w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-red-500/10"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                      title="Remove from saved"
                    >
                      <BookmarkX className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question */}
                  <p
                    className="font-bold leading-snug mb-3"
                    style={{ fontSize: 15, fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}
                  >
                    {item.question ?? "—"}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4">
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>ODDS</p>
                      <p style={{ color: "#C8FF00", fontSize: 16, fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700 }}>{yesOdds}</p>
                    </div>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>PROB</p>
                      <p style={{ color: "white", fontSize: 16, fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700 }}>{impliedProb}%</p>
                    </div>
                    {item.volume24h && parseFloat(String(item.volume24h)) > 0 && (
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>VOL 24H</p>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700 }}>
                          ${parseFloat(String(item.volume24h)).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {item.aiConfidence && (
                      <div className="ml-auto flex items-center gap-1">
                        <Zap className="w-3 h-3" style={{ color: "#C8FF00" }} />
                        <span style={{ color: "#C8FF00", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                          {item.aiConfidence}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Event title */}
                  {item.eventTitle && (
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "JetBrains Mono, monospace", marginTop: 8 }}>
                      {item.eventTitle}
                    </p>
                  )}

                  {/* Place bet CTA */}
                  <button
                    onClick={() => navigate("/feed")}
                    className="w-full mt-3 py-2.5 rounded-lg text-sm font-black transition-all active:scale-95"
                    style={{
                      background: "rgba(200,255,0,0.1)",
                      border: "1px solid rgba(200,255,0,0.3)",
                      color: "#C8FF00",
                      fontFamily: "Barlow Condensed, sans-serif",
                      letterSpacing: "0.06em",
                    }}
                  >
                    PLACE BET
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)" }}
      >
        <Bookmark className="w-7 h-7" style={{ color: "#C8FF00" }} />
      </div>
      <h3
        style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 8 }}
      >
        NO SAVED MARKETS
      </h3>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6, marginBottom: 24 }}>
        Tap SAVE on any bet card to bookmark markets you want to come back to.
      </p>
      <button
        onClick={() => navigate("/feed")}
        className="px-6 py-3 rounded-full font-black text-sm"
        style={{ background: "#C8FF00", color: "#000", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.08em" }}
      >
        BROWSE MARKETS
      </button>
    </div>
  );
}
