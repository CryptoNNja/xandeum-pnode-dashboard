"use client";

import { useState } from "react";
import { Calculator, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRewardsCalculator } from "@/hooks/useRewardsCalculator";
import { formatStorage, STORAGE_PRESETS, getTierColor } from "@/lib/rewards-calculator";
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
      {/* Next-Gen Compact Calculator Card */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border-2 cursor-pointer group w-full"
        style={{
          background: isLight 
            ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
            : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderColor: "transparent",
          boxShadow: isLight
            ? "0 20px 60px -15px rgba(123, 63, 242, 0.15), 0 0 0 1px rgba(123, 63, 242, 0.1)"
            : "0 20px 60px -15px rgba(123, 63, 242, 0.3), 0 0 0 1px rgba(123, 63, 242, 0.2)",
        }}
        onClick={() => setIsModalOpen(true)}
        whileHover={{ 
          scale: 1.01,
          boxShadow: isLight
            ? "0 25px 70px -15px rgba(123, 63, 242, 0.25), 0 0 0 2px rgba(123, 63, 242, 0.2)"
            : "0 25px 70px -15px rgba(123, 63, 242, 0.4), 0 0 0 2px rgba(123, 63, 242, 0.3)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Animated gradient background */}
        <div 
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 20% 50%, rgba(123, 63, 242, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(20, 241, 149, 0.3) 0%, transparent 50%)",
            filter: "blur(60px)",
          }}
        />
        
        {/* Mesh gradient overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(123, 63, 242, 0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        
        <div className="relative p-10">
          {/* Header - Premium */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              {/* Animated icon container */}
              <motion.div 
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7B3FF2 0%, #14F195 100%)",
                }}
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Calculator className="w-8 h-8 text-white" strokeWidth={2.5} />
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #7B3FF2, #14F195)",
                    opacity: 0.5,
                    filter: "blur(12px)",
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              
              <div>
                <h3 className="text-3xl font-black text-text-main flex items-center gap-2 mb-1">
                  Rewards Calculator
                  <motion.div
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </h3>
                <p className="text-sm text-text-soft font-medium">
                  Estimate earnings • Compare with network • Get optimization tips
                </p>
              </div>
            </div>
            
            {/* Click hint */}
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: isLight 
                  ? "rgba(123, 63, 242, 0.08)"
                  : "rgba(123, 63, 242, 0.15)",
              }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-sm font-bold hidden md:inline" style={{ color: "#7B3FF2" }}>
                Open Full View
              </span>
              <ArrowRight className="w-5 h-5" style={{ color: "#7B3FF2" }} strokeWidth={3} />
            </motion.div>
          </div>
          
          {/* Content Grid - Rich & Colorful */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left: Input Zone - Glassmorphism */}
            <div 
              className="relative p-6 rounded-2xl backdrop-blur-xl"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.9) 100%)"
                  : "linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)",
                border: `1px solid ${isLight ? "rgba(123,63,242,0.1)" : "rgba(123,63,242,0.2)"}`,
              }}
            >
              {/* Storage display with gradient */}
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2" style={{ color: "#7B3FF2" }}>
                  Storage Commitment
                </p>
                <motion.div
                  key={storageGB}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <p 
                    className="text-5xl font-black mb-1"
                    style={{
                      background: "linear-gradient(135deg, #7B3FF2 0%, #14F195 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 2px 8px rgba(123,63,242,0.3))",
                    }}
                  >
                    {formatStorage(storageGB)}
                  </p>
                </motion.div>
                <p className="text-xs text-text-soft uppercase tracking-wider">
                  Tier: <span className="font-bold" style={{ color: getTierColor(calculation.tier) }}>
                    {calculation.tier}
                  </span>
                </p>
              </div>
              
              {/* Premium slider */}
              <div className="relative mb-6">
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={50}
                  value={storageGB}
                  onChange={(e) => setStorageGB(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, 
                      #7B3FF2 0%, 
                      #14F195 ${(storageGB / 5000) * 100}%, 
                      rgba(255,255,255,0.1) ${(storageGB / 5000) * 100}%
                    )`,
                    boxShadow: `0 4px 12px rgba(123,63,242,0.2)`,
                  }}
                />
              </div>
              
              {/* Quick presets - Pills */}
              <div className="flex gap-2 flex-wrap justify-center">
                {STORAGE_PRESETS.slice(0, 3).map((preset) => (
                  <motion.button
                    key={preset.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStorageGB(preset.value);
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-full transition-all"
                    style={{
                      background: storageGB === preset.value
                        ? "linear-gradient(135deg, #7B3FF2, #14F195)"
                        : isLight ? "rgba(123,63,242,0.08)" : "rgba(123,63,242,0.15)",
                      color: storageGB === preset.value ? "#ffffff" : "#7B3FF2",
                      border: `1px solid ${storageGB === preset.value ? "transparent" : "rgba(123,63,242,0.3)"}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Center: Earnings Display - Hero */}
            <div 
              className="relative p-8 rounded-2xl backdrop-blur-xl overflow-hidden"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(123,63,242,0.05) 0%, rgba(20,241,149,0.05) 100%)"
                  : "linear-gradient(135deg, rgba(123,63,242,0.15) 0%, rgba(20,241,149,0.15) 100%)",
                border: `2px solid ${isLight ? "rgba(123,63,242,0.15)" : "rgba(123,63,242,0.25)"}`,
              }}
            >
              {/* Animated glow orb */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(123,63,242,0.3) 0%, transparent 70%)",
                  filter: "blur(40px)",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <div className="relative text-center">
                <p className="text-xs uppercase tracking-[0.25em] font-bold mb-3" style={{ color: "#7B3FF2" }}>
                  💰 Estimated Monthly Earnings
                </p>
                
                {/* HERO NUMBER - Animated */}
                <motion.div
                  key={calculation.creditsPerMonth}
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <p 
                    className="text-6xl md:text-7xl font-black mb-2"
                    style={{
                      background: "linear-gradient(135deg, #7B3FF2 0%, #14F195 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 4px 12px rgba(123,63,242,0.4))",
                      lineHeight: 1,
                    }}
                  >
                    {calculation.creditsPerMonth.toLocaleString()}
                  </p>
                </motion.div>
                
                <p className="text-sm text-text-soft font-semibold mb-6 uppercase tracking-wider">
                  credits / month
                </p>
                
                {/* Quick stats */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div 
                    className="px-3 py-2 rounded-xl backdrop-blur-sm"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)",
                    }}
                  >
                    <TrendingUp className="w-3 h-3 mx-auto mb-1" style={{ color: "#14F195" }} />
                    <p className="text-xs text-text-soft">Daily</p>
                    <p className="text-sm font-bold text-text-main">
                      {calculation.creditsPerDay.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    className="px-3 py-2 rounded-xl backdrop-blur-sm"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)",
                    }}
                  >
                    <TrendingUp className="w-3 h-3 mx-auto mb-1" style={{ color: "#3B82F6" }} />
                    <p className="text-xs text-text-soft">Weekly</p>
                    <p className="text-sm font-bold text-text-main">
                      {calculation.creditsPerWeek.toLocaleString()}
                    </p>
                  </div>
                  <div 
                    className="px-3 py-2 rounded-xl backdrop-blur-sm"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)",
                    }}
                  >
                    <TrendingUp className="w-3 h-3 mx-auto mb-1" style={{ color: "#7B3FF2" }} />
                    <p className="text-xs text-text-soft">Yearly</p>
                    <p className="text-sm font-bold text-text-main">
                      {(calculation.creditsPerYear / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Context & Rank - Vibrant */}
            <div 
              className="relative p-6 rounded-2xl backdrop-blur-xl space-y-4"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.9) 100%)"
                  : "linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)",
                border: `1px solid ${isLight ? "rgba(123,63,242,0.1)" : "rgba(123,63,242,0.2)"}`,
              }}
            >
              {/* Rank Badge - Large */}
              <motion.div 
                className="relative p-5 rounded-2xl text-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7B3FF2 0%, #3B82F6 100%)",
                }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)",
                  }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                <div className="relative">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/80 mb-2">
                    Network Rank
                  </p>
                  <p className="text-5xl font-black text-white mb-1">
                    #{calculation.networkRank}
                  </p>
                  <p className="text-sm text-white/90 font-semibold">
                    of {totalNodes} nodes
                  </p>
                  <div 
                    className="mt-3 px-3 py-1 rounded-full inline-block"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <p className="text-xs font-bold text-white">
                      Top {calculation.percentile.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {/* vs Network Average */}
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: calculation.vsNetworkAvg >= 100
                    ? isLight ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.15)"
                    : isLight ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.15)",
                  border: `1px solid ${calculation.vsNetworkAvg >= 100 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}
              >
                <p className="text-xs uppercase tracking-wider font-bold mb-2" style={{
                  color: calculation.vsNetworkAvg >= 100 ? "#10B981" : "#F59E0B"
                }}>
                  {calculation.vsNetworkAvg >= 100 ? "🚀 Above Average" : "📊 Below Average"}
                </p>
                <p className="text-4xl font-black mb-1" style={{
                  color: calculation.vsNetworkAvg >= 100 ? "#10B981" : "#F59E0B"
                }}>
                  {calculation.vsNetworkAvg}%
                </p>
                <p className="text-xs text-text-soft font-medium">
                  {calculation.vsNetworkAvg >= 100 
                    ? `${calculation.vsNetworkAvg - 100}% above network average`
                    : `${100 - calculation.vsNetworkAvg}% below network average`
                  }
                </p>
              </div>
            </div>
            
          </div>
          
          {/* Bottom CTA - Subtle hint */}
          <motion.div 
            className="flex items-center justify-center gap-3 p-5 rounded-2xl mt-8"
            style={{
              background: "linear-gradient(90deg, rgba(123, 63, 242, 0.08), rgba(20, 241, 149, 0.08))",
              border: `1px dashed ${isLight ? "rgba(123,63,242,0.2)" : "rgba(123,63,242,0.3)"}`,
            }}
            whileHover={{ 
              background: "linear-gradient(90deg, rgba(123, 63, 242, 0.12), rgba(20, 241, 149, 0.12))",
            }}
          >
            <Sparkles className="w-5 h-5" style={{ color: "#14F195" }} />
            <p className="text-sm font-bold text-text-main">
              Click anywhere for detailed insights & optimization tips
            </p>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: "#7B3FF2" }} strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
          }}
          initial={{ backgroundPosition: "200% 0" }}
          whileHover={{ backgroundPosition: "-200% 0" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
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
