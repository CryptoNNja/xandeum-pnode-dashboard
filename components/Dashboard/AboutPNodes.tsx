"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Globe, Zap, ChevronRight, ChevronDown, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { PNode } from "@/lib/types";
import { SimpleSparkline } from "@/components/common/SimpleSparkline";

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
      } catch {
        // Token price fetch failed (API may be rate-limited) - silently fail as this is optional
      }
    };

    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, []);

  return tokenData;
};

// Helper function to format bytes adaptively
const formatBytesAdaptive = (bytes: number): string => {
  const KB = 1e3;
  const MB = 1e6;
  const GB = 1e9;
  const TB = 1e12;
  
  if (bytes >= TB) {
    return `${(bytes / TB).toFixed(2)} TB`;
  } else if (bytes >= GB) {
    return `${(bytes / GB).toFixed(2)} GB`;
  } else if (bytes >= MB) {
    return `${(bytes / MB).toFixed(2)} MB`;
  } else if (bytes >= KB) {
    return `${(bytes / KB).toFixed(2)} KB`;
  } else {
    return `${bytes} B`;
  }
};

// Helper function to convert country code to flag emoji
const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface AboutPNodesProps {
  totalStorageCommitted: number;
  totalStorageUsedPods: number;
  networkMetadata: {
    networkTotal: number;
    crawledNodes: number;
    coveragePercent: number;
  };
  countriesCount: number;
  totalNodes: number; // Total number of nodes for average calculation
  pnodes: PNode[]; // Array of pnodes for network breakdown calculation
}

const AboutPNodesComponent = ({
  totalStorageCommitted,
  totalStorageUsedPods,
  countriesCount,
  totalNodes,
  pnodes,
}: AboutPNodesProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default
  const tokenData = useTokenPrice();
  
  // Fetch storage history for sparkline
  const [storageHistory, setStorageHistory] = useState<Array<{
    date: string;
    avgCommittedPerNode: number;
    totalNodes: number;
    totalCommitted: number;
  }>>([]);
  
  useEffect(() => {
    fetch('/api/storage-history')
      .then(res => res.json())
      .then(data => {
        if (data.history && data.hasData) {
          setStorageHistory(data.history);
        }
      })
      .catch(() => {
        // Storage history is optional and non-critical, fail silently
      });
  }, []);
  
  const storageCommittedTB = useMemo(() => {
    // Use decimal TB (1e12) to match other storage displays
    const TB = 1e12;
    return (totalStorageCommitted / TB).toFixed(1);
  }, [totalStorageCommitted]);

  // Calculate MAINNET/DEVNET storage committed breakdown
  const storageByNetwork = useMemo(() => {
    
    const mainnetStorage = pnodes
      .filter(n => n.network === 'MAINNET')
      .reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);
    
    const devnetStorage = pnodes
      .filter(n => n.network === 'DEVNET')
      .reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);
    
    const total = mainnetStorage + devnetStorage;
    
    // Ensure percentages sum to 100%
    let mainnetPct = 0;
    let devnetPct = 0;
    if (total > 0) {
      mainnetPct = Math.round((mainnetStorage / total) * 100);
      devnetPct = 100 - mainnetPct; // Ensures sum is exactly 100%
    }
    
    return {
      mainnet: {
        bytes: mainnetStorage,
        formatted: formatBytesAdaptive(mainnetStorage),
        percentage: mainnetPct
      },
      devnet: {
        bytes: devnetStorage,
        formatted: formatBytesAdaptive(devnetStorage),
        percentage: devnetPct
      }
    };
  }, [pnodes]);

  // Calculate MAINNET/DEVNET storage used breakdown (from stats.storage_used)
  const storageUsedByNetwork = useMemo(() => {
    
    const mainnetUsed = pnodes
      .filter(n => n.network === 'MAINNET')
      .reduce((sum, n) => sum + (n.stats?.storage_used || 0), 0);
    
    const devnetUsed = pnodes
      .filter(n => n.network === 'DEVNET')
      .reduce((sum, n) => sum + (n.stats?.storage_used || 0), 0);
    
    const total = mainnetUsed + devnetUsed;
    
    // Ensure percentages sum to 100%
    let mainnetPct = 0;
    let devnetPct = 0;
    if (total > 0) {
      mainnetPct = Math.round((mainnetUsed / total) * 100);
      devnetPct = 100 - mainnetPct; // Ensures sum is exactly 100%
    }
    
    return {
      mainnet: {
        bytes: mainnetUsed,
        formatted: formatBytesAdaptive(mainnetUsed),
        percentage: mainnetPct
      },
      devnet: {
        bytes: devnetUsed,
        formatted: formatBytesAdaptive(devnetUsed),
        percentage: devnetPct
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

  // Calculate top 3 countries by node count
  const topCountries = useMemo(() => {
    const countryMap = new Map<string, { count: number; code: string }>();
    
    pnodes.forEach((node) => {
      if (node.country && node.country !== "Unknown" && node.country_code) {
        const normalizedCountry = node.country === "The Netherlands" ? "Netherlands" : node.country;
        const existing = countryMap.get(normalizedCountry);
        if (existing) {
          existing.count++;
        } else {
          countryMap.set(normalizedCountry, { 
            count: 1, 
            code: node.country_code.toUpperCase() 
          });
        }
      }
    });

    return Array.from(countryMap.entries())
      .map(([country, data]) => ({ 
        country, 
        count: data.count,
        code: data.code
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [pnodes]);

  // Auto-rotating carousel for top countries
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  
  useEffect(() => {
    if (topCountries.length > 1) {
      const interval = setInterval(() => {
        setCurrentCountryIndex((prev) => (prev + 1) % topCountries.length);
      }, 3000); // Rotate every 3 seconds
      return () => clearInterval(interval);
    }
  }, [topCountries.length]);

  // Stats always visible (when collapsed)
  const compactStats = [
    {
      icon: Database,
      value: `${storageCommittedTB} TB`,
      label: "Storage Committed",
      color: "#7B3FF2", // Xandeum Purple
      extra: (
        <div className="w-full mt-2">
          {/* Single progress bar with both networks */}
          <div 
            className="w-full h-1.5 bg-background-elevated rounded-full overflow-hidden cursor-help"
            title={`🟢 MAINNET: ${storageByNetwork.mainnet.formatted} (${storageByNetwork.mainnet.percentage}%)
🟡 DEVNET: ${storageByNetwork.devnet.formatted} (${storageByNetwork.devnet.percentage}%)`}
          >
            <div className="h-full flex">
              <div 
                className="bg-green-500 transition-all duration-300" 
                style={{ width: `${storageByNetwork.mainnet.percentage}%` }}
              />
              <div 
                className="bg-yellow-500 transition-all duration-300" 
                style={{ width: `${storageByNetwork.devnet.percentage}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Database,
      value: storageUsedPodsFormatted,
      label: "Storage Used",
      color: "#14F195", // Xandeum Green
      extra: (
        <div className="w-full mt-2">
          {/* Single progress bar with both networks */}
          <div 
            className="w-full h-1.5 bg-background-elevated rounded-full overflow-hidden cursor-help"
            title={`🟢 MAINNET: ${storageUsedByNetwork.mainnet.formatted} (${storageUsedByNetwork.mainnet.percentage}%)
🟡 DEVNET: ${storageUsedByNetwork.devnet.formatted} (${storageUsedByNetwork.devnet.percentage}%)`}
          >
            <div className="h-full flex">
              <div 
                className="bg-green-500 transition-all duration-300" 
                style={{ width: `${storageUsedByNetwork.mainnet.percentage}%` }}
              />
              <div 
                className="bg-yellow-500 transition-all duration-300" 
                style={{ width: `${storageUsedByNetwork.devnet.percentage}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Database,
      value: avgCommittedPerPodFormatted,
      label: "Avg Committed/Pod",
      color: "#00D4AA", // Aqua
      extra: (
        <div className="w-full mt-1">
          <SimpleSparkline
            data={storageHistory.map(h => h.avgCommittedPerNode)}
            dates={storageHistory.map(h => h.date)}
            color="#00D4AA"
            height={20}
            hasData={storageHistory.length >= 2}
            formatValue={(value) => {
              // Format bytes adaptively for tooltip
              const TB = 1e12;
              const GB = 1e9;
              const MB = 1e6;
              if (value >= TB) return `${(value / TB).toFixed(2)} TB`;
              if (value >= GB) return `${(value / GB).toFixed(2)} GB`;
              return `${(value / MB).toFixed(2)} MB`;
            }}
          />
        </div>
      ),
    },
    {
      icon: Globe,
      value: countriesCount.toString(),
      label: "Countries",
      color: "#F59E0B", // Orange
      extra: topCountries.length > 0 ? (
        <div className="w-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {topCountries.map((country, index) => 
              index === currentCountryIndex ? (
                <motion.div
                  key={country.country}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg" role="img" aria-label={country.country}>
                      {getFlagEmoji(country.code)}
                    </span>
                    <span className="text-xs font-medium text-text-soft truncate max-w-[100px]">
                      {country.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold" style={{ color: "#F59E0B" }}>
                      {country.count}
                    </span>
                    <span className="text-[10px] text-text-faint">
                      {country.count === 1 ? 'node' : 'nodes'}
                    </span>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
          
          {/* Carousel indicators */}
          {topCountries.length > 1 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              {topCountries.map((_, index) => (
                <div
                  key={index}
                  className="w-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: index === currentCountryIndex ? "#F59E0B" : "#94a3b8",
                    opacity: index === currentCountryIndex ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : undefined,
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
              The Backbone of Xandeum&apos;s{" "}
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
          <div className="flex flex-wrap gap-3 md:gap-5 items-start">
            {compactStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className="flex flex-col gap-2.5 px-4 py-2.5 rounded-lg border theme-transition min-w-[200px]"
                style={{
                  background: isLight
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(26, 31, 58, 0.5)",
                  borderColor: isLight
                    ? "rgba(0, 0, 0, 0.06)"
                    : "rgba(100, 116, 139, 0.2)",
                }}
              >
                <div className="flex items-center gap-2.5">
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
                  </div>
                </div>
                {/* Extra content (like progress bars and sparkline) - Fixed height for alignment */}
                {'extra' in stat && (
                  <div className="w-full h-[32px] flex items-center">
                    {(stat as { extra: React.ReactNode }).extra}
                  </div>
                )}
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
                      It aims to solve the &quot;blockchain storage trilemma&quot; by providing a solution that is scalable, 
                      smart contract native, and allows for random access. Xandeum&apos;s liquid staking pool allows SOL 
                      holders to earn rewards from both staking and storage fees, making it the first multi-validator 
                      pool sharing block rewards with stakers. The XAND token serves as the governance token, granting 
                      holders voting rights in the Xandeum DAO to shape the platform&apos;s future.
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

