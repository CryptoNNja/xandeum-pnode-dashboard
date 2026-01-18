"use client";

import { useState } from "react";
import { Calculator, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRewardsCalculator } from "@/hooks/useRewardsCalculator";
import { formatStorage, STORAGE_PRESETS } from "@/lib/rewards-calculator";
import type { CreditsDataPoint } from "@/lib/rewards-calculator";
import { RewardsCalculatorModal } from "./RewardsCalculatorModal";

interface RewardsCalculatorCardProps {
  creditsData: CreditsDataPoint[];
  isLight: boolean;
  totalNodes: number;
}

export const RewardsCalculatorCard = ({ 
  creditsData, 
  isLight, 
  totalNodes 
}: RewardsCalculatorCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { storageGB, setStorageGB, calculation } = useRewardsCalculator(creditsData);
  
  return (
    <>
      {/* Teaser Card - Encourages click to open modal */}
      <motion.div
        className="relative overflow-hidden rounded-2xl border cursor-pointer group mt-6"
        style={{
          background: isLight 
            ? "linear-gradient(135deg, rgba(123, 63, 242, 0.03) 0%, rgba(59, 130, 246, 0.03) 50%, rgba(20, 241, 149, 0.03) 100%)"
            : "linear-gradient(135deg, rgba(123, 63, 242, 0.08) 0%, rgba(59, 130, 246, 0.08) 50%, rgba(20, 241, 149, 0.08) 100%)",
          borderColor: "var(--border-default)",
        }}
        onClick={() => setIsModalOpen(true)}
        whileHover={{ scale: 1.005 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, rgba(123, 63, 242, 0.12), transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7B3FF2, #3B82F6)",
                }}
              >
                <Calculator className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
                  Rewards Calculator
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </h3>
                <p className="text-sm text-text-soft mt-1">
                  Estimate your earning potential based on storage commitment
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-accent-aqua group-hover:translate-x-1 transition-transform">
              <span className="text-sm font-semibold hidden md:inline">Open Calculator</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Quick Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-text-soft">Storage Input</span>
                <span className="text-lg font-bold text-text-main">
                  {formatStorage(storageGB)}
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={50}
                  value={storageGB}
                  onChange={(e) => setStorageGB(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()} // Don't trigger modal
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, 
                      rgba(123, 63, 242, 0.6) 0%, 
                      rgba(59, 130, 246, 0.6) ${(storageGB / 5000) * 100}%, 
                      rgba(255, 255, 255, 0.1) ${(storageGB / 5000) * 100}%
                    )`,
                  }}
                />
              </div>
              
              {/* Quick presets */}
              <div className="flex gap-2 flex-wrap">
                {STORAGE_PRESETS.slice(0, 3).map((preset) => (
                  <button
                    key={preset.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStorageGB(preset.value);
                    }}
                    className="px-3 py-1 text-xs rounded-full border transition-colors"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Center: Earnings Display */}
            <div 
              className="p-6 rounded-xl border text-center"
              style={{
                background: isLight 
                  ? "rgba(255, 255, 255, 0.6)" 
                  : "rgba(15, 23, 42, 0.6)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <p className="text-xs uppercase tracking-widest text-text-soft mb-2">
                Estimated Earnings
              </p>
              <p 
                className="text-4xl md:text-5xl font-bold mb-1"
                style={{
                  background: "linear-gradient(135deg, #7B3FF2, #14F195)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {calculation.creditsPerMonth.toLocaleString()}
              </p>
              <p className="text-sm text-text-soft">credits per month</p>
              
              <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                <TrendingUp className="w-4 h-4 text-accent-aqua" />
                <span className="text-xs text-text-soft">
                  ~{calculation.creditsPerDay.toLocaleString()}/day
                </span>
              </div>
            </div>
            
            {/* Right: Context */}
            <div className="space-y-3">
              <div 
                className="p-3 rounded-lg"
                style={{
                  background: isLight ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.4)",
                }}
              >
                <p className="text-xs text-text-soft mb-1">Your Projected Rank</p>
                <p className="text-2xl font-bold text-text-main">
                  #{calculation.networkRank}
                  <span className="text-sm font-normal text-text-soft ml-2">
                    / {totalNodes}
                  </span>
                </p>
                <p className="text-xs text-text-soft mt-1">
                  Top {calculation.percentile.toFixed(1)}%
                </p>
              </div>
              
              <div 
                className="p-3 rounded-lg"
                style={{
                  background: isLight ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.4)",
                }}
              >
                <p className="text-xs text-text-soft mb-1">vs Network Avg</p>
                <p className="text-2xl font-bold" style={{
                  color: calculation.vsNetworkAvg >= 100 ? "#10B981" : "#F59E0B"
                }}>
                  {calculation.vsNetworkAvg}%
                </p>
              </div>
            </div>
            
          </div>
          
          {/* CTA */}
          <div 
            className="flex items-center justify-between p-4 rounded-lg mt-6"
            style={{
              background: "linear-gradient(90deg, rgba(123, 63, 242, 0.1), rgba(20, 241, 149, 0.1))",
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-aqua" />
              <p className="text-sm font-semibold text-text-main">
                Click to see detailed breakdown, tips, and more
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-accent-aqua" />
          </div>
        </div>
      </motion.div>
      
      {/* Full Calculator Modal */}
      <RewardsCalculatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creditsData={creditsData}
        isLight={isLight}
        totalNodes={totalNodes}
      />
    </>
  );
};
