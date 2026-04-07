// Swipestakes — RedeemPage
// Gift card catalog personalized by user shopping preferences
// Credits → Gift cards

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Gift, CheckCircle2, ChevronRight, Lock, Star, Sparkles, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ─── GIFT CARD CATALOG ────────────────────────────────────────────────────────

interface GiftCard {
  id: string;
  brand: string;
  logo: string;
  description: string;
  creditCost: number;
  dollarValue: string;
  category: string[];
  popular?: boolean;
  color: string;
  gradient: string;
}

const gc = (
  id: string, brand: string, logo: string, category: string[], color: string, gradientEnd: string, popular?: boolean,
): GiftCard => ({
  id, brand, logo,
  description: `$50 ${brand} Gift Card`,
  creditCost: 250,
  dollarValue: "$50",
  category,
  popular,
  color,
  gradient: `linear-gradient(135deg, ${color}, ${gradientEnd})`,
});

const GIFT_CARDS: GiftCard[] = [
  // Shopping
  gc("amazon",     "Amazon",       "https://logo.clearbit.com/amazon.com",       ["shopping", "tech", "everything"],             "#FF9900", "#FF6600", true),
  gc("target",     "Target",       "https://logo.clearbit.com/target.com",       ["shopping", "grocery", "home"],                "#CC0000", "#990000"),
  gc("walmart",    "Walmart",      "https://logo.clearbit.com/walmart.com",      ["shopping", "grocery", "everything"],           "#0071CE", "#004C97"),
  gc("costco",     "Costco",       "https://logo.clearbit.com/costco.com",       ["shopping", "grocery", "everything"],           "#E31837", "#005DAA"),
  gc("bestbuy",    "Best Buy",     "https://logo.clearbit.com/bestbuy.com",      ["shopping", "tech"],                            "#0046BE", "#003399"),
  gc("sephora",    "Sephora",      "https://logo.clearbit.com/sephora.com",      ["shopping", "fashion"],                         "#000000", "#333333"),
  gc("nordstrom",  "Nordstrom",    "https://logo.clearbit.com/nordstrom.com",    ["shopping", "fashion"],                         "#1B1B1B", "#444444"),
  gc("macys",      "Macy's",       "https://logo.clearbit.com/macys.com",        ["shopping", "fashion"],                         "#E21A2C", "#B0141F"),

  // Food & Drink
  gc("starbucks",  "Starbucks",    "https://logo.clearbit.com/starbucks.com",    ["food", "coffee", "drinks"],                    "#00704A", "#1E3932", true),
  gc("doordash",   "DoorDash",     "https://logo.clearbit.com/doordash.com",     ["food", "delivery"],                            "#FF3008", "#CC2600"),
  gc("ubereats",   "Uber Eats",    "https://logo.clearbit.com/ubereats.com",     ["food", "delivery"],                            "#06C167", "#048A49"),
  gc("chipotle",   "Chipotle",     "https://logo.clearbit.com/chipotle.com",     ["food", "restaurant"],                          "#A81612", "#7A100D"),
  gc("chickfila",  "Chick-fil-A",  "https://logo.clearbit.com/chick-fil-a.com",  ["food", "restaurant"],                          "#E51636", "#B3102A"),
  gc("grubhub",    "Grubhub",      "https://logo.clearbit.com/grubhub.com",      ["food", "delivery"],                            "#F63440", "#CC2A34"),

  // Entertainment
  gc("netflix",    "Netflix",      "https://logo.clearbit.com/netflix.com",      ["entertainment", "streaming", "movies"],         "#E50914", "#B20710", true),
  gc("spotify",    "Spotify",      "https://logo.clearbit.com/spotify.com",      ["entertainment", "music", "streaming"],          "#1DB954", "#158A3E"),
  gc("apple",      "Apple",        "https://logo.clearbit.com/apple.com",        ["tech", "entertainment", "apps"],                "#555555", "#222222"),
  gc("disney",     "Disney+",      "https://logo.clearbit.com/disneyplus.com",   ["entertainment", "streaming", "movies"],         "#113CCF", "#0D2D9E"),
  gc("hulu",       "Hulu",         "https://logo.clearbit.com/hulu.com",         ["entertainment", "streaming"],                   "#1CE783", "#17B86A"),
  gc("playstation","PlayStation",   "https://logo.clearbit.com/playstation.com",  ["gaming", "entertainment", "tech"],              "#003087", "#00246B"),
  gc("xbox",       "Xbox",         "https://logo.clearbit.com/xbox.com",         ["gaming", "entertainment", "tech"],              "#107C10", "#0B5B0B"),
  gc("steam",      "Steam",        "https://logo.clearbit.com/steampowered.com", ["gaming", "entertainment", "tech"],              "#1B2838", "#2A475E"),

  // Fashion & Sports
  gc("nike",       "Nike",         "https://logo.clearbit.com/nike.com",         ["sports", "fashion", "fitness"],                 "#111111", "#333333"),
  gc("adidas",     "Adidas",       "https://logo.clearbit.com/adidas.com",       ["sports", "fashion", "fitness"],                 "#000000", "#333333"),
  gc("fanatics",   "Fanatics",     "https://logo.clearbit.com/fanatics.com",     ["sports", "nba", "nfl", "mlb"],                 "#003087", "#001A4D"),
  gc("footlocker", "Foot Locker",  "https://logo.clearbit.com/footlocker.com",   ["sports", "fashion"],                            "#000000", "#2D2D2D"),
  gc("lululemon",  "Lululemon",    "https://logo.clearbit.com/lululemon.com",    ["sports", "fashion", "fitness"],                 "#D31334", "#A60F29"),

  // General / Prepaid
  gc("visa",       "Visa Prepaid",       "https://logo.clearbit.com/visa.com",        ["everything", "cash"],  "#1A1F71", "#F7B600"),
  gc("mastercard", "Mastercard Prepaid",  "https://logo.clearbit.com/mastercard.com",  ["everything", "cash"],  "#EB001B", "#F79E1B"),
];

// Category → shopping preference mapping
const CATEGORY_MAP: Record<string, string[]> = {
  sports: ['sports', 'nba', 'nfl', 'mlb', 'fitness'],
  food: ['food', 'delivery', 'restaurant', 'coffee', 'drinks'],
  entertainment: ['entertainment', 'streaming', 'music', 'movies'],
  shopping: ['shopping', 'everything', 'home', 'grocery'],
  fashion: ['fashion'],
  gaming: ['gaming'],
};

// ─── GIFT CARD TILE ───────────────────────────────────────────────────────────

function GiftCardTile({
  card,
  balance,
  onRedeem,
}: {
  card: GiftCard;
  balance: number;
  onRedeem: (card: GiftCard) => void;
}) {
  const canAfford = balance >= card.creditCost;

  return (
    <motion.button
      onClick={() => canAfford && onRedeem(card)}
      whileTap={canAfford ? { scale: 0.97 } : {}}
      className="relative flex flex-col rounded-2xl overflow-hidden text-left w-full"
      style={{
        background: '#fff',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
        opacity: canAfford ? 1 : 0.65,
      }}
    >
      {/* Color band */}
      <div
        className="h-20 flex items-center justify-center relative"
        style={{ background: card.gradient }}
      >
        <img src={card.logo} alt={card.brand} className="w-9 h-9 rounded-lg object-contain" style={{ background: '#fff' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).insertAdjacentText('afterend', card.brand[0]); }} />
        {card.popular && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            <Star size={8} fill="currentColor" /> Popular
          </div>
        )}
        {!canAfford && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <Lock size={20} className="text-white/80" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-400 mb-0.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {card.brand}
        </p>
        <p className="text-sm font-black text-gray-900 leading-tight mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {card.dollarValue}
        </p>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full w-fit"
          style={{
            background: canAfford ? 'linear-gradient(135deg, #7C3AED15, #EC489915)' : '#f5f5f5',
          }}
        >
          <Coins size={10} style={{ color: canAfford ? '#7C3AED' : '#9CA3AF' }} />
          <span
            className="text-[11px] font-bold"
            style={{ color: canAfford ? '#7C3AED' : '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            {card.creditCost} CR
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────

function ConfirmModal({
  card,
  balance,
  onConfirm,
  onCancel,
  loading,
}: {
  card: GiftCard;
  balance: number;
  onConfirm: (email: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [email, setEmail] = useState('');
  const { user } = useAuth();
  const deliveryEmail = email || user?.email || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full rounded-t-3xl p-6 pb-10"
        style={{ background: '#fff', maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Card preview */}
        <div
          className="w-full h-28 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: card.gradient }}
        >
          <img src={card.logo} alt={card.brand} className="w-12 h-12 rounded-xl object-contain" style={{ background: '#fff' }} />
        </div>

        <h3 className="text-xl font-black mb-1" style={{ fontFamily: 'Poppins, sans-serif', color: '#1a1a2e' }}>
          {card.description}
        </h3>
        <p className="text-sm text-gray-500 mb-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
          This will deduct <strong>{card.creditCost} credits</strong> from your balance. You'll have{' '}
          <strong>{balance - card.creditCost} CR</strong> remaining.
        </p>

        {/* Email input */}
        <div className="mb-5">
          <label className="text-xs font-bold text-gray-500 mb-1.5 block" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Delivery email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={user?.email || 'your@email.com'}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: '#f8f8fc',
              border: '1.5px solid rgba(124,58,237,0.15)',
              fontFamily: 'Nunito, sans-serif',
              color: '#1a1a2e',
            }}
          />
        </div>

        <button
          onClick={() => onConfirm(deliveryEmail)}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 mb-3"
          style={{
            background: loading ? '#ccc' : 'linear-gradient(135deg, #7C3AED, #EC4899)',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {loading ? 'Processing...' : (
            <>
              <Gift size={18} />
              Confirm Redemption
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl font-semibold text-gray-500 text-sm"
          style={{ fontFamily: 'Nunito, sans-serif', background: '#f5f5f5' }}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────

function SuccessScreen({ card, onDone }: { card: GiftCard; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#fff' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: card.gradient, boxShadow: `0 12px 40px ${card.color}44` }}
      >
        <img src={card.logo} alt={card.brand} className="w-11 h-11 rounded-xl object-contain" style={{ background: '#fff' }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <CheckCircle2 size={20} className="text-green-500" />
          <span className="text-sm font-semibold text-green-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Redemption submitted!
          </span>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#1a1a2e' }}>
          {card.description}
        </h2>
        <p className="text-sm text-gray-500 mb-8" style={{ fontFamily: 'Nunito, sans-serif', lineHeight: 1.6 }}>
          Your gift card will be delivered to your email within 24 hours. Keep earning credits for more rewards!
        </p>
        <button
          onClick={onDone}
          className="px-8 py-4 rounded-2xl font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
            fontFamily: 'Poppins, sans-serif',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
          }}
        >
          Keep earning credits
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function RedeemPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [successCard, setSuccessCard] = useState<GiftCard | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { data: statusData } = trpc.credits.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const { data: settingsData } = trpc.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: historyData } = trpc.credits.getRedeemHistory.useQuery(undefined, { enabled: isAuthenticated });

  const redeemMutation = trpc.credits.redeem.useMutation({
    onSuccess: (result) => {
      if (result.success && selectedCard) {
        setSuccessCard(selectedCard);
        setSelectedCard(null);
      } else {
        toast.error(result.error || 'Redemption failed');
      }
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });

  const balance = statusData?.balance ?? 0;
  const shoppingPrefs = (settingsData?.shoppingPreferences as string[] | null) ?? [];

  // Personalized sort: cards matching user's shopping prefs come first
  const sortedCards = useMemo(() => {
    if (shoppingPrefs.length === 0) return GIFT_CARDS;
    const preferredCategories = shoppingPrefs.flatMap(pref => CATEGORY_MAP[pref] ?? [pref]);
    return [...GIFT_CARDS].sort((a, b) => {
      const aMatch = a.category.some(c => preferredCategories.includes(c)) ? 1 : 0;
      const bMatch = b.category.some(c => preferredCategories.includes(c)) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [shoppingPrefs]);

  // Filter tabs
  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'food', label: '🍔 Food' },
    { id: 'shopping', label: '🛍️ Shop' },
    { id: 'entertainment', label: '🎬 Fun' },
    { id: 'sports', label: '🏆 Sports' },
    { id: 'fashion', label: '👗 Fashion' },
    { id: 'gaming', label: '🎮 Gaming' },
  ];

  const filteredCards = useMemo(() => {
    if (activeFilter === 'all') return sortedCards;
    const cats = CATEGORY_MAP[activeFilter] ?? [activeFilter];
    return sortedCards.filter(c => c.category.some(cat => cats.includes(cat)));
  }, [sortedCards, activeFilter]);

  const handleConfirmRedeem = (email: string) => {
    if (!selectedCard) return;
    redeemMutation.mutate({
      giftCardType: selectedCard.id,
      giftCardLabel: selectedCard.description,
      creditCost: selectedCard.creditCost,
      deliveryEmail: email || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 8px 32px rgba(124,58,237,0.3)' }}
        >
          <Gift size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#1a1a2e' }}>
          Redeem your credits
        </h2>
        <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: 'Nunito, sans-serif', lineHeight: 1.6 }}>
          Sign in to earn credits and redeem them for gift cards from your favorite brands.
        </p>
        <a
          href={getLoginUrl()}
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
            fontFamily: 'Poppins, sans-serif',
            textDecoration: 'none',
          }}
        >
          Sign in to redeem <ChevronRight size={18} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3"
        style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: 'Poppins, sans-serif', color: '#1a1a2e', letterSpacing: '-0.03em' }}>
              Redeem
            </h1>
            <p className="text-xs text-gray-400 font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Spend PICK5 credits on gift cards
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              color: '#fff',
              boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <Coins size={14} />
            <span>{balance} CR</span>
          </div>
        </div>

        {/* Personalized banner */}
        {shoppingPrefs.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf4ff)', border: '1px solid rgba(124,58,237,0.1)' }}
          >
            <Sparkles size={14} className="text-purple-500" />
            <p className="text-xs font-semibold text-purple-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Personalized for you based on your preferences
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: activeFilter === f.id ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : '#f0f0f5',
                color: activeFilter === f.id ? '#fff' : '#6B7280',
                fontFamily: 'Nunito, sans-serif',
                boxShadow: activeFilter === f.id ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {filteredCards.map(card => (
            <GiftCardTile
              key={card.id}
              card={card}
              balance={balance}
              onRedeem={setSelectedCard}
            />
          ))}
        </div>

        {/* Redemption history */}
        {historyData?.requests && historyData.requests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-black text-gray-700 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Recent Redemptions
            </h3>
            <div className="space-y-2">
              {historyData.requests.slice(0, 5).map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-2xl"
                  style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {req.giftCardLabel}
                    </p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: req.status === 'fulfilled' ? '#DCFCE7' : '#FEF3C7',
                        color: req.status === 'fulfilled' ? '#16A34A' : '#D97706',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      {req.status === 'fulfilled' ? '✓ Sent' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf4ff)', border: '1px solid rgba(124,58,237,0.1)' }}
        >
          <h3 className="text-sm font-black text-purple-800 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            How credits work
          </h3>
          <div className="space-y-2">
            {[
              { icon: '🎯', text: '5 free picks every day' },
              { icon: '✅', text: 'Go 3/5 → earn 5 credits' },
              { icon: '🔥', text: 'Go 4/5 → earn 10 credits' },
              { icon: '⭐', text: 'Perfect 5/5 → earn 25 credits' },
              { icon: '🎁', text: 'Redeem credits for gift cards' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2">
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span className="text-xs text-purple-700" style={{ fontFamily: 'Nunito, sans-serif' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {selectedCard && (
          <ConfirmModal
            card={selectedCard}
            balance={balance}
            onConfirm={handleConfirmRedeem}
            onCancel={() => setSelectedCard(null)}
            loading={redeemMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Success screen */}
      <AnimatePresence>
        {successCard && (
          <SuccessScreen card={successCard} onDone={() => setSuccessCard(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
