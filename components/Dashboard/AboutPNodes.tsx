"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Radio, Globe, Zap, ChevronRight, ChevronDown, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface TokenData {
  price: number;
  priceChange24h: number;
}

const useTokenPrice = () => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=xandeum&vs_currencies=usd&include_24hr_change=true',
          {
            next: { revalidate: 300 } // Cache for 5 minutes
          }
        );
        
        if (!response.ok) {
          console.warn('CoinGecko API unavailable, skipping token price');
          return;
        }
        
        const data = await response.json();
        
        if (data.xandeum) {
          setTokenData({
            price: data.xandeum.usd,
            priceChange24h: data.xandeum.usd_24h_change || 0,
          });
        }
      } catch (err) {
        console.warn('Token price fetch failed (API may be rate-limited)');
        // Silently fail - token price is optional
      }
    };

    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, []);

  return tokenData;
};

interface AboutPNodesProps {
  totalStorageCommitted: number;
  totalStorageUsedPods: number;
  totalStorageUsedStats: number;
  networkMetadata: {
    networkTotal: number;
    crawledNodes: number;
    coveragePercent: number;
  };
  countriesCount: number;
  totalNodes: number; // Total number of nodes for average calculation
}

const AboutPNodesComponent = ({
  totalStorageCommitted,
  totalStorageUsedPods,
  totalStorageUsedStats,
  networkMetadata,
  countriesCount,
  totalNodes,
}: AboutPNodesProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default
  const tokenData = useTokenPrice();

  const storageCommittedTB = useMemo(() => {
    // Use decimal TB (1e12) to match other storage displays
    const TB = 1e12;
    return (totalStorageCommitted / TB).toFixed(1);
  }, [totalStorageCommitted]);

  // Calculate MAINNET/DEVNET storage breakdown
  const storageByNetwork = useMemo(() => {
    const TB = 1e12;
    
    const mainnetStorage = pnodes
      .filter(n => n.network === 'MAINNET')
      .reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);
    
    const devnetStorage = pnodes
      .filter(n => n.network === 'DEVNET')
      .reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);
    
    const total = mainnetStorage + devnetStorage;
    
    return {
      mainnet: {
        bytes: mainnetStorage,
        tb: (mainnetStorage / TB).toFixed(1),
        percentage: total > 0 ? Math.round((mainnetStorage / total) * 100) : 0
      },
      devnet: {
        bytes: devnetStorage,
        tb: (devnetStorage / TB).toFixed(1),
        percentage: total > 0 ? Math.round((devnetStorage / total) * 100) : 0
      }
    };
  }, [pnodes]);

  const storageUsedPodsFormatted = useMemo(() => {
    // Use decimal units (1e6, 1e9, etc.) to match AboutPNodes display
    const KB = 1e3;
    const MB = 1e6;
    const GB = 1e9;
    const TB = 1e12;
    
    if (totalStorageUsedPods >= TB) {
      return `${(totalStorageUsedPods / TB).toFixed(2)} TB`;
    } else if (totalStorageUsedPods >= GB) {
      return `${(totalStorageUsedPods / GB).toFixed(2)} GB`;
    } else if (totalStorageUsedPods >= MB) {
      return `${(totalStorageUsedPods / MB).toFixed(2)} MB`;
    } else if (totalStorageUsedPods >= KB) {
      return `${(totalStorageUsedPods / KB).toFixed(2)} KB`;
    } else {
      return `${totalStorageUsedPods} bytes`;
    }
  }, [totalStorageUsedPods]);

  // This is the closest metric to the official dashboard: sum(total_bytes) over active nodes.
  // Use decimal formatting (GB=1e9) to reduce confusion when comparing.
  const storageUsedStatsFormatted = useMemo(() => {
    // Format adaptively based on size (decimal)
    const KB = 1e3;
    const MB = 1e6;
    const GB = 1e9;
    const TB = 1e12;

    if (totalStorageUsedStats >= TB) {
      return `${(totalStorageUsedStats / TB).toFixed(2)} TB`;
    } else if (totalStorageUsedStats >= GB) {
      return `${(totalStorageUsedStats / GB).toFixed(2)} GB`;
    } else if (totalStorageUsedStats >= MB) {
      return `${(totalStorageUsedStats / MB).toFixed(2)} MB`;
    } else if (totalStorageUsedStats >= KB) {
      return `${(totalStorageUsedStats / KB).toFixed(2)} KB`;
    } else {
      return `${totalStorageUsedStats} bytes`;
    }
  }, [totalStorageUsedStats]);


  const avgCommittedPerPodFormatted = useMemo(() => {
    if (totalNodes === 0) return "0 bytes";
    
    const avgBytes = totalStorageCommitted / totalNodes;
    // Use decimal units (1e9, 1e12, etc.) for consistency
    const KB = 1e3;
    const MB = 1e6;
    const GB = 1e9;
    const TB = 1e12;
    
    // Adaptive formatting
    if (avgBytes >= TB) {
      return `${(avgBytes / TB).toFixed(2)} TB`;
    } else if (avgBytes >= GB) {
      return `${(avgBytes / GB).toFixed(2)} GB`;
    } else if (avgBytes >= MB) {
      return `${(avgBytes / MB).toFixed(2)} MB`;
    } else if (avgBytes >= KB) {
      return `${(avgBytes / KB).toFixed(2)} KB`;
    } else {
      return `${avgBytes.toFixed(0)} bytes`;
    }
  }, [totalStorageCommitted, totalNodes]);

  // Stats always visible (when collapsed)
  const compactStats = [
    {
      icon: Database,
      value: `${storageCommittedTB} TB`,
      label: "Storage Committed",
      color: "#7B3FF2", // Xandeum Purple
      extra: (
        <div className="w-full mt-2 space-y-1">
          {/* Mini progress bar */}
          <div className="w-full h-1.5 bg-background-elevated rounded-full overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-accent-aqua transition-all duration-300" 
                style={{ width: `${storageByNetwork.mainnet.percentage}%` }} 
                title={`MAINNET: ${storageByNetwork.mainnet.tb} TB`}
              />
              <div 
                className="bg-purple-400 transition-all duration-300" 
                style={{ width: `${storageByNetwork.devnet.percentage}%` }} 
                title={`DEVNET: ${storageByNetwork.devnet.tb} TB`}
              />
            </div>
          </div>
          {/* Network labels */}
          <div className="flex justify-between text-[10px] text-text-faint">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent-aqua"></span>
              M: {storageByNetwork.mainnet.tb} TB ({storageByNetwork.mainnet.percentage}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              D: {storageByNetwork.devnet.tb} TB ({storageByNetwork.devnet.percentage}%)
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: Database,
      value: storageUsedPodsFormatted,
      label: "Storage Used",
      color: "#14F195", // Xandeum Green
    },
    {
      icon: Database,
      value: avgCommittedPerPodFormatted,
      label: "Avg Committed/Pod",
      color: "#00D4AA", // Aqua
    },
    {
      icon: Globe,
      value: countriesCount.toString(),
      label: "Countries",
      color: "#F59E0B", // Orange
    },
  ];

  // Note: extendedStats removed as we now use the compact token card directly in the expanded view

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-7xl mx-auto px-6 w-full"
    >
      <div
        className="relative overflow-hidden rounded-2xl border theme-transition"
        style={{
          background: isLight
            ? "linear-gradient(135deg, rgba(123, 63, 242, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
            : "linear-gradient(135deg, rgba(123, 63, 242, 0.08) 0%, rgba(20, 241, 149, 0.05) 100%)",
          borderColor: isLight
            ? "rgba(123, 63, 242, 0.15)"
            : "rgba(123, 63, 242, 0.25)",
        }}
      >
        {/* Subtle gradient orbs */}
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{
            background: isLight
              ? "rgba(123, 63, 242, 0.08)"
              : "rgba(123, 63, 242, 0.15)",
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{
            background: isLight
              ? "rgba(20, 241, 149, 0.08)"
              : "rgba(20, 241, 149, 0.12)",
          }}
        />

        {/* Clickable Header with Collapse Indicator */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-10 w-full p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group hover:opacity-90 transition-opacity"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Zap
                className="w-4 h-4"
                style={{ color: "#14F195" }}
                strokeWidth={2.5}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "#14F195" }}
              >
                What are pNodes?
              </span>
            </div>

            <h2
              className="text-lg md:text-xl font-bold mb-2 leading-tight text-left"
              style={{ color: isLight ? "#0f172a" : "#f8fafc" }}
            >
              The Backbone of Xandeum's{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #7B3FF2, #14F195)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Decentralized Storage
              </span>
            </h2>

            <p
              className="text-xs text-left"
              style={{ color: isLight ? "#6b7280" : "#94a3b8" }}
            >
              Click to {isOpen ? "collapse" : "expand"} details
            </p>
          </div>

          {/* Compact Stats - Always Visible */}
          <div className="flex flex-wrap gap-3 md:gap-5">
            {compactStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border theme-transition"
                style={{
                  background: isLight
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(26, 31, 58, 0.5)",
                  borderColor: isLight
                    ? "rgba(0, 0, 0, 0.06)"
                    : "rgba(100, 116, 139, 0.2)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isLight
                      ? `${stat.color}15`
                      : `${stat.color}20`,
                  }}
                >
                  <stat.icon
                    className="w-4 h-4"
                    style={{ color: stat.color }}
                    strokeWidth={2.2}
                  />
                </div>
                <div className="text-left flex-1">
                  <p
                    className="text-base md:text-lg font-bold tracking-tight leading-none"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[10px] font-medium uppercase tracking-wider mt-1 leading-none"
                    style={{ color: isLight ? "#6b7280" : "#64748b" }}
                  >
                    {stat.label}
                  </p>
                  {/* Extra content (like progress bars) */}
                  {(stat as any).extra && (
                    <div className="mt-1">
                      {(stat as any).extra}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {/* Chevron indicator */}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex items-center justify-center w-7 h-7 flex-shrink-0"
              style={{ color: isLight ? "#7B3FF2" : "#14F195" }}
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
            </motion.div>
          </div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="relative z-10 px-6 md:px-8 pb-6 md:pb-8">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Explanation */}
                  <div className="flex-1 max-w-3xl">
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: isLight ? "#4b5563" : "#94a3b8" }}
                    >
                      Xandeum is building a scalable, decentralized storage layer for the Solana blockchain. 
                      It aims to solve the "blockchain storage trilemma" by providing a solution that is scalable, 
                      smart contract native, and allows for random access. Xandeum's liquid staking pool allows SOL 
                      holders to earn rewards from both staking and storage fees, making it the first multi-validator 
                      pool sharing block rewards with stakers. The XAND token serves as the governance token, granting 
                      holders voting rights in the Xandeum DAO to shape the platform's future.
                    </p>

                    <a
                      href="https://www.xandeum.network"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                      style={{ color: "#7B3FF2" }}
                    >
                      Visit Xandeum Network
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>

                  {/* XAND Token Card - Compact */}
                  {tokenData && (() => {
                    const isPositive = tokenData.priceChange24h >= 0;
                    const cardColor = isPositive ? "#10B981" : "#EF4444";
                    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
                    
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full lg:w-48 p-3 rounded-lg transition-all hover:shadow-md"
                        style={{
                          background: isLight
                            ? `linear-gradient(135deg, ${cardColor}10 0%, ${cardColor}03 100%)`
                            : `linear-gradient(135deg, ${cardColor}15 0%, ${cardColor}05 100%)`,
                          border: '1px solid',
                          borderColor: `${cardColor}30`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <DollarSign
                              className="w-4 h-4"
                              style={{ color: cardColor }}
                              strokeWidth={2.5}
                            />
                            <p className="text-xs font-semibold text-text-soft">
                              XAND
                            </p>
                          </div>
                          <TrendIcon
                            className="w-4 h-4"
                            style={{ color: cardColor }}
                            strokeWidth={2.5}
                          />
                        </div>

                        <p className="text-xl font-bold text-text-main mb-0.5">
                          ${tokenData.price.toFixed(6)}
                        </p>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-soft">24h</span>
                          <span className="font-semibold" style={{ color: cardColor }}>
                            {isPositive ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
                          </span>
                        </div>

                        <a
                          href="https://www.coingecko.com/en/coins/xandeum"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-[10px] text-text-soft hover:text-accent-primary transition-colors inline-flex items-center gap-0.5"
                        >
                          CoinGecko
                          <ChevronRight className="w-2.5 h-2.5" />
                        </a>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export const AboutPNodes = memo(AboutPNodesComponent);
AboutPNodes.displayName = "AboutPNodes";

