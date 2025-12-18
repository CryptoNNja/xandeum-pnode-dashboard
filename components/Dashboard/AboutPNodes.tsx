"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Database, Server, Globe, Zap, ChevronRight } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { TB_IN_BYTES } from "@/lib/utils";

interface AboutPNodesProps {
  totalStorageBytes: number;
  activeNodesCount: number;
  countriesCount: number;
}

const AboutPNodesComponent = ({
  totalStorageBytes,
  activeNodesCount,
  countriesCount,
}: AboutPNodesProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const totalStorageTB = useMemo(() => {
    return (totalStorageBytes / TB_IN_BYTES).toFixed(1);
  }, [totalStorageBytes]);

  const stats = [
    {
      icon: Database,
      value: `${totalStorageTB} TB`,
      label: "Storage Committed",
      color: "#7B3FF2", // Xandeum Purple
    },
    {
      icon: Server,
      value: activeNodesCount.toString(),
      label: "Active Nodes",
      color: "#14F195", // Xandeum Green
    },
    {
      icon: Globe,
      value: countriesCount.toString(),
      label: "Countries",
      color: "#00D4AA", // Aqua
    },
  ];

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

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Explanation */}
            <div className="flex-1 max-w-2xl">
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
                className="text-lg md:text-xl font-bold mb-3 leading-tight"
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
                className="text-sm leading-relaxed"
                style={{ color: isLight ? "#4b5563" : "#94a3b8" }}
              >
                Provider Nodes (pNodes) solve Solana's state bloat problem by offloading 
                account data to a distributed network. Each node commits storage capacity, 
                enabling Xandeum to scale beyond traditional blockchain limitations.
              </p>

              <a
                href="https://www.xandeum.network/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-4 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: "#7B3FF2" }}
              >
                Learn more about Xandeum
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {/* Right: Stats */}
            <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex-1 min-w-[100px] p-4 rounded-xl border theme-transition text-center"
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
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
                  <p
                    className="text-xl md:text-2xl font-black tracking-tight"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[10px] font-medium uppercase tracking-wider mt-1"
                    style={{ color: isLight ? "#6b7280" : "#64748b" }}
                  >
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export const AboutPNodes = memo(AboutPNodesComponent);
AboutPNodes.displayName = "AboutPNodes";

