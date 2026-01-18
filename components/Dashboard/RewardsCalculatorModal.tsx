"use client";

import { X, Calculator, TrendingUp, Award, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRewardsCalculator } from "@/hooks/useRewardsCalculator";
import { formatStorage, STORAGE_PRESETS, getTierColor } from "@/lib/rewards-calculator";
import type { CreditsDataPoint } from "@/lib/rewards-calculator";

interface RewardsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsData: CreditsDataPoint[];
  isLight: boolean;
  totalNodes: number;
}

export const RewardsCalculatorModal = ({ 
  isOpen, 
  onClose, 
  creditsData, 
  isLight, 
  totalNodes 
}: RewardsCalculatorModalProps) => {
  const { storageGB, setStorageGB, calculation } = useRewardsCalculator(creditsData);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0, 0, 0, 0.7)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: isLight ? "#ffffff" : "#0f172a",
            borderColor: "var(--border-default)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7B3FF2, #3B82F6)" }}
              >
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-main">Rewards Calculator</h2>
                <p className="text-sm text-text-soft">Estimate your earning potential</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-text-soft" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 100px)" }}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left: Input Zone */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-4">Storage Input</h3>
                  
                  {/* Current Value Display */}
                  <div className="p-4 rounded-lg border mb-4" style={{
                    background: isLight ? "rgba(123, 63, 242, 0.05)" : "rgba(123, 63, 242, 0.1)",
                    borderColor: "var(--border-subtle)",
                  }}>
                    <p className="text-sm text-text-soft mb-1">Current Storage</p>
                    <p className="text-4xl font-bold text-text-main">{formatStorage(storageGB)}</p>
                    <p className="text-xs text-text-soft mt-1">
                      Tier: <span style={{ color: getTierColor(calculation.tier) }} className="font-semibold uppercase">{calculation.tier}</span>
                    </p>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min={0}
                    max={10000}
                    step={50}
                    value={storageGB}
                    onChange={(e) => setStorageGB(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer mb-4"
                    style={{
                      background: `linear-gradient(90deg, 
                        rgba(123, 63, 242, 0.8) 0%, 
                        rgba(59, 130, 246, 0.8) ${(storageGB / 10000) * 100}%, 
                        rgba(255, 255, 255, 0.1) ${(storageGB / 10000) * 100}%
                      )`,
                    }}
                  />
                  
                  {/* Presets */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-text-soft mb-3">Quick Presets</p>
                    {STORAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setStorageGB(preset.value)}
                        className="w-full p-3 rounded-lg border text-left transition-all hover:border-accent-aqua"
                        style={{
                          background: isLight ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)",
                          borderColor: storageGB === preset.value ? "#14F195" : "var(--border-subtle)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-main">{preset.label}</span>
                          <span className="text-sm text-text-soft">{formatStorage(preset.value)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Center: Earnings Display */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-4">Projected Earnings</h3>
                  
                  {/* Main Number */}
                  <div className="p-6 rounded-xl border text-center mb-6" style={{
                    background: isLight 
                      ? "linear-gradient(135deg, rgba(123, 63, 242, 0.05), rgba(20, 241, 149, 0.05))"
                      : "linear-gradient(135deg, rgba(123, 63, 242, 0.15), rgba(20, 241, 149, 0.15))",
                    borderColor: "var(--border-subtle)",
                  }}>
                    <p className="text-xs uppercase tracking-widest text-text-soft mb-2">Monthly</p>
                    <p 
                      className="text-5xl font-bold mb-2"
                      style={{
                        background: "linear-gradient(135deg, #7B3FF2, #14F195)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {calculation.creditsPerMonth.toLocaleString()}
                    </p>
                    <p className="text-sm text-text-soft">credits</p>
                  </div>
                  
                  {/* Breakdown */}
                  <div className="space-y-3">
                    {[
                      { label: "Daily", value: calculation.creditsPerDay, icon: TrendingUp },
                      { label: "Weekly", value: calculation.creditsPerWeek, icon: TrendingUp },
                      { label: "Yearly", value: calculation.creditsPerYear, icon: Award },
                    ].map((item) => (
                      <div 
                        key={item.label}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: isLight ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-accent-aqua" />
                          <span className="text-sm text-text-soft">{item.label}</span>
                        </div>
                        <span className="font-semibold text-text-main">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right: Context & Tips */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-4">Your Position</h3>
                  
                  {/* Rank */}
                  <div className="p-4 rounded-lg border mb-4" style={{
                    background: isLight ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.1)",
                    borderColor: "var(--border-subtle)",
                  }}>
                    <p className="text-sm text-text-soft mb-1">Network Rank</p>
                    <p className="text-3xl font-bold text-text-main">
                      #{calculation.networkRank}
                    </p>
                    <p className="text-xs text-text-soft mt-1">
                      Top {calculation.percentile.toFixed(1)}% of {totalNodes} nodes
                    </p>
                  </div>
                  
                  {/* vs Average */}
                  <div className="p-4 rounded-lg border mb-6" style={{
                    background: isLight ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.1)",
                    borderColor: "var(--border-subtle)",
                  }}>
                    <p className="text-sm text-text-soft mb-1">vs Network Average</p>
                    <p className="text-3xl font-bold" style={{
                      color: calculation.vsNetworkAvg >= 100 ? "#10B981" : "#F59E0B"
                    }}>
                      {calculation.vsNetworkAvg}%
                    </p>
                    <p className="text-xs text-text-soft mt-1">
                      {calculation.vsNetworkAvg >= 100 
                        ? `${calculation.vsNetworkAvg - 100}% above average`
                        : `${100 - calculation.vsNetworkAvg}% below average`
                      }
                    </p>
                  </div>
                  
                  {/* Optimization Tips */}
                  {calculation.optimizationTips.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        <h4 className="text-sm font-semibold text-text-main">Optimization Tips</h4>
                      </div>
                      <div className="space-y-2">
                        {calculation.optimizationTips.map((tip, idx) => (
                          <div 
                            key={idx}
                            className="p-3 rounded-lg text-sm text-text-soft"
                            style={{
                              background: isLight ? "rgba(251, 191, 36, 0.05)" : "rgba(251, 191, 36, 0.1)",
                            }}
                          >
                            • {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
