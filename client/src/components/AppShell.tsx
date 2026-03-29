// Swipestakes — AppShell
// Clean light theme | Mobile-first shell with simple bottom dock

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, Wallet, BarChart3, Star, User } from "lucide-react";
import { ReactNode } from "react";

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
  activeColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/feed",    icon: Home,      label: "Home",    activeColor: "#FF3D9A" },
  { path: "/wallet",  icon: Wallet,    label: "Wallet",  activeColor: "#8B2BE2" },
  { path: "/bets",    icon: BarChart3, label: "Results", activeColor: "#00B894" },
  { path: "/loyalty", icon: Star,      label: "Loyalty", activeColor: "#F59E0B" },
  { path: "/profile", icon: User,      label: "Profile", activeColor: "#6366F1" },
];

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [location, navigate] = useLocation();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F5F5F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="relative flex flex-col w-full"
        style={{
          maxWidth: 480,
          height: '100%',
          background: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Page content — scrolls above bottom nav */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          {children}
        </div>

        {/* ── BOTTOM NAV ── */}
        <nav
          className="relative z-50 flex-shrink-0"
          style={{
            background: '#FFFFFF',
            borderTop: '1px solid #EBEBEB',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          }}
        >
          <div className="flex items-center justify-around px-1 pt-2 pb-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (location === '/' && item.path === '/feed');

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
                  style={{ minWidth: 52 }}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: `${item.activeColor}15` }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <motion.div
                    animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Icon
                      size={22}
                      className="relative z-10 transition-all duration-200"
                      style={{
                        color: isActive ? item.activeColor : '#BDBDBD',
                        strokeWidth: isActive ? 2.5 : 1.8,
                      }}
                    />
                  </motion.div>

                  <span
                    className="relative z-10 text-[9px] font-bold transition-all duration-200"
                    style={{
                      fontFamily: "'Fredoka One', 'Nunito', sans-serif",
                      color: isActive ? item.activeColor : '#BDBDBD',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
