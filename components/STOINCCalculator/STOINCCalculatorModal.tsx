'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Calculator, TrendingUp, Award, Zap, Shield, Sparkles, Server, HardDrive, Gauge, Gem, Clock, FileDown, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface STOINCCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Official NFT Boost multipliers from xandeum.network/stoinc
const NFT_BOOSTS = {
  none: { label: 'No NFT', boost: 1, icon: '⚪' },
  cricket: { label: 'Cricket NFT', boost: 1.1, icon: '🦗' },
  xeno: { label: 'XENO NFT', boost: 1.1, icon: '👽' },
  rabbit: { label: 'Rabbit NFT', boost: 1.5, icon: '🐰' },
  coyote: { label: 'Coyote NFT', boost: 2.5, icon: '🐺' },
  dragon: { label: 'Dragon NFT', boost: 4, icon: '🐉' },
  titan: { label: 'Titan NFT', boost: 11, icon: '⚡' },
} as const;

// Official pNode Purchase Era multipliers from xandeum.network/stoinc
const PURCHASE_ERA_BOOSTS = {
  none: { label: 'No pNode', boost: 1, icon: '⚪' },
  north: { label: 'North Era', boost: 1.25, icon: '❄️' },
  central: { label: 'Central Era', boost: 2, icon: '🌐' },
  coal: { label: 'Coal Era', boost: 3.5, icon: '⚫' },
  main: { label: 'Main Era', boost: 7, icon: '🔷' },
  south: { label: 'South Era', boost: 10, icon: '🔥' },
  deepsouth: { label: 'DeepSouth Era', boost: 16, icon: '💎' },
} as const;

export function STOINCCalculatorModal({ isOpen, onClose }: STOINCCalculatorModalProps) {
  // Core parameters
  const [numPNodes, setNumPNodes] = useState(1);
  const [storageSpace, setStorageSpace] = useState(100); // GB per node
  const [performanceScore, setPerformanceScore] = useState(0.9); // 0-1 (like pGlobe)
  const [xandStaked, setXandStaked] = useState(0); // XAND tokens staked
  const [nftTier, setNftTier] = useState<keyof typeof NFT_BOOSTS>('none');
  const [purchaseEra, setPurchaseEra] = useState<keyof typeof PURCHASE_ERA_BOOSTS>('none');
  
  // Network parameters (user can adjust or use defaults)
  const [totalNetworkFees, setTotalNetworkFees] = useState(50000); // SOL per epoch (default estimate)
  const [totalNetworkCredits, setTotalNetworkCredits] = useState(100000); // Total boosted credits across all wallets
  const [pNodeShare, setPNodeShare] = useState(0.94); // 94% goes to pNode operators


  // Calculate STOINC based on official formula from xandeum.network/stoinc
  const calculation = useMemo(() => {
    // Step 1: Storage Credits = number of pNodes × storage space × performance score × stake
    const storageCredits = numPNodes * storageSpace * performanceScore * (1 + xandStaked / 10000);
    
    // Step 2: NFT Boost (multiplier)
    const nftMultiplier = NFT_BOOSTS[nftTier].boost;
    
    // Step 3: Purchase Era Boost (multiplier)
    const eraMultiplier = PURCHASE_ERA_BOOSTS[purchaseEra].boost;
    
    // Step 4: Combined GeoBoost = NFT × Era
    const geoBoost = nftMultiplier * eraMultiplier;
    
    // Step 5: Boosted Credits = storageCredits × ∏(boost_i)
    const boostedCredits = storageCredits * geoBoost;
    
    // Step 6: Boosted Weight = user's boostedCredits relative to network
    const boostedWeight = totalNetworkCredits > 0 ? boostedCredits : 0;
    
    // Step 7: Final STOINC per epoch = (total fees × pNode share × boostedCredits) / total boostedCredits
    const stoinc = totalNetworkCredits > 0 
      ? (totalNetworkFees * pNodeShare * boostedCredits) / totalNetworkCredits
      : 0;
    
    return {
      storageCredits: Math.round(storageCredits),
      nftMultiplier,
      eraMultiplier,
      geoBoost,
      boostedCredits: Math.round(boostedCredits),
      boostedWeight: Math.round(boostedWeight),
      stoincPerEpoch: Math.round(stoinc * 100) / 100, // 2 decimals
      stoincPerMonth: Math.round(stoinc * 30 * 100) / 100, // Assuming ~30 epochs/month
    };
  }, [numPNodes, storageSpace, performanceScore, xandStaked, nftTier, purchaseEra, totalNetworkFees, totalNetworkCredits, pNodeShare]);

  // Generate 12-month projection data for chart
  const projectionData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: `M${i + 1}`,
      accumulated: calculation.stoincPerMonth * (i + 1),
      monthly: calculation.stoincPerMonth,
    }));
  }, [calculation.stoincPerMonth]);

  // Export PDF Handler
  const handleExportPDF = async () => {
    const data = {
      title: 'STOINC Calculator Results',
      timestamp: new Date().toISOString(),
      params: { 
        numPNodes, 
        storageSpace, 
        performanceScore, 
        xandStaked,
        nftTier: NFT_BOOSTS[nftTier].label,
        purchaseEra: PURCHASE_ERA_BOOSTS[purchaseEra].label,
      },
      results: calculation,
      projection: projectionData,
    };
    
    // TODO: Implement using lib/pdf-export.ts
    console.log('Exporting PDF...', data);
    
    // Show notification (temporary)
    alert('PDF Export feature coming soon! Data logged to console.');
  };

  // Share Link Handler
  const handleShareLink = () => {
    const params = new URLSearchParams({
      nodes: numPNodes.toString(),
      storage: storageSpace.toString(),
      perf: performanceScore.toString(),
      stake: xandStaked.toString(),
      nft: nftTier,
      era: purchaseEra,
    });
    
    const url = `${window.location.origin}?calculator=${encodeURIComponent(params.toString())}`;
    navigator.clipboard.writeText(url);
    
    // Show notification (temporary)
    alert('Link copied to clipboard! 🎉\n\n' + url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(20, 241, 149, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981, #14F195)' }}
              >
                <Calculator className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">STOINC Calculator</h2>
                <p className="text-sm text-gray-400">Simulate rewards with all parameters</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content - Ultra-compact 4-column no scroll */}
          <div className="p-5">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              
              {/* Left Column: Core Parameters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Core Parameters</h3>
                </div>
                
                {/* PNodes Count - Compact */}
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-semibold text-gray-300">PNodes</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={numPNodes}
                      onChange={(e) => setNumPNodes(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-right rounded bg-white/10 border border-white/20 text-white text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Storage - Enhanced UX */}
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-semibold text-gray-300">Storage</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={300000}
                      value={storageSpace}
                      onChange={(e) => setStorageSpace(Math.min(300000, Math.max(0, Number(e.target.value))))}
                      className="w-20 px-2 py-1 text-right rounded bg-white/10 border border-white/20 text-white text-xs font-bold"
                      placeholder="GB"
                    />
                  </div>
                  
                  {/* Quick Presets */}
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[
                      { label: '100GB', value: 100 },
                      { label: '1TB', value: 1000 },
                      { label: '5TB', value: 5000 },
                      { label: '10TB', value: 10000 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setStorageSpace(preset.value)}
                        className={`
                          px-2 py-1 rounded text-[9px] font-semibold transition-all
                          ${storageSpace === preset.value
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Fine-tune slider */}
                  <input
                    type="range"
                    min={0}
                    max={300000}
                    step={100}
                    value={storageSpace}
                    onChange={(e) => setStorageSpace(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, #10b981 ${(storageSpace / 300000) * 100}%, rgba(255,255,255,0.1) ${(storageSpace / 300000) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                    <span>0</span>
                    <span>300 TB</span>
                  </div>
                </div>

                {/* Performance - Compact (0-1) */}
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-semibold text-gray-300">Performance</span>
                    </div>
                    <span className="text-sm font-bold text-white">{performanceScore.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={performanceScore}
                    onChange={(e) => setPerformanceScore(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, #10b981 ${performanceScore * 100}%, rgba(255,255,255,0.1) ${performanceScore * 100}%)`,
                    }}
                  />
                </div>

                {/* XAND Staked */}
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs font-semibold text-gray-300">XAND Staked</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={xandStaked}
                      onChange={(e) => setXandStaked(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-right rounded bg-white/10 border border-white/20 text-white text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Network Params - Compact */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs font-bold text-blue-400 mb-2 uppercase">Network Params</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Total Fees</span>
                      <input
                        type="number"
                        min={0}
                        value={totalNetworkFees}
                        onChange={(e) => setTotalNetworkFees(Number(e.target.value))}
                        className="w-24 px-2 py-1 text-right rounded bg-white/10 border border-white/20 text-white text-xs font-bold"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Network Credits</span>
                      <input
                        type="number"
                        min={0}
                        value={totalNetworkCredits}
                        onChange={(e) => setTotalNetworkCredits(Number(e.target.value))}
                        className="w-24 px-2 py-1 text-right rounded bg-white/10 border border-white/20 text-white text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Column: Boost Multipliers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Gem className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Boost Multipliers</h3>
                </div>

                {/* NFT Selection - Premium Box - COMPACT */}
                <div 
                  className="p-3 rounded-xl border relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {/* Animated Background Glow */}
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{ background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.4), transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Award className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider leading-tight">NFT Ownership</p>
                        <p className="text-[9px] text-gray-400 leading-tight">Up to 11x</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {Object.entries(NFT_BOOSTS).map(([key, { label, boost, icon }]) => (
                        <button
                          key={key}
                          onClick={() => setNftTier(key as keyof typeof NFT_BOOSTS)}
                          className={`
                            w-full px-2 py-1.5 rounded-lg text-left transition-all flex items-center justify-between group
                            ${nftTier === key 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }
                          `}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{icon}</span>
                            <span className="text-[10px] font-semibold">{label}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className={`text-[10px] font-bold ${nftTier === key ? 'text-white' : 'text-purple-400'}`}>
                              {boost}x
                            </span>
                            {nftTier === key && (
                              <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Purchase Era Selection - Premium Box - COMPACT */}
                <div 
                  className="p-3 rounded-xl border relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    borderColor: 'rgba(6, 182, 212, 0.3)',
                  }}
                >
                  {/* Animated Background Glow */}
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{ background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.4), transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                  />
                  
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider leading-tight">Purchase Era</p>
                        <p className="text-[9px] text-gray-400 leading-tight">Up to 16x</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {Object.entries(PURCHASE_ERA_BOOSTS).map(([key, { label, boost, icon }]) => (
                        <button
                          key={key}
                          onClick={() => setPurchaseEra(key as keyof typeof PURCHASE_ERA_BOOSTS)}
                          className={`
                            w-full px-2 py-1.5 rounded-lg text-left transition-all flex items-center justify-between group
                            ${purchaseEra === key 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }
                          `}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{icon}</span>
                            <span className="text-[10px] font-semibold">{label}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className={`text-[10px] font-bold ${purchaseEra === key ? 'text-white' : 'text-cyan-400'}`}>
                              {boost}x
                            </span>
                            {purchaseEra === key && (
                              <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Results */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Results</h3>
                </div>

                {/* Hero Result - Compact */}
                <div 
                  className="p-6 rounded-xl text-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(20, 241, 149, 0.15))',
                    border: '2px solid rgba(20, 241, 149, 0.3)',
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle, rgba(20,241,149,0.2) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative">
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-cyan-400 mb-2">
                      💰 EST. STOINC
                    </p>
                    <p 
                      className="text-5xl font-black mb-1"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #14F195)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {calculation.stoincPerEpoch.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">XAND per epoch</p>
                    <div className="pt-3 border-t border-white/20">
                      <p className="text-2xl font-bold text-white">
                        {calculation.stoincPerMonth.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">XAND per month</p>
                    </div>
                  </div>
                </div>

                {/* Calculation Steps - Ultra Compact */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    Calculation
                  </p>
                  
                  <div className="p-2 rounded-lg bg-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Storage Credits</span>
                    <span className="text-sm font-bold text-white">{calculation.storageCredits.toLocaleString()}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-400">GeoBoost (NFT×Era)</span>
                    <span className="text-sm font-bold text-purple-400">{calculation.geoBoost.toFixed(1)}x</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Boosted Credits</span>
                    <span className="text-sm font-bold text-cyan-400">{calculation.boostedCredits.toLocaleString()}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Final Formula</span>
                      <Sparkles className="w-3 h-3 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      ({totalNetworkFees} × {pNodeShare} × {calculation.boostedCredits}) / {totalNetworkCredits}
                    </p>
                  </div>

                  {/* Action Buttons - Moved here */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-3 py-2 rounded-lg font-bold text-xs text-white
                        bg-gradient-to-r from-green-500 to-cyan-500
                        hover:from-green-600 hover:to-cyan-600
                        transform hover:scale-105 active:scale-95
                        transition-all duration-200
                        flex items-center justify-center gap-2
                        shadow-lg hover:shadow-xl"
                    >
                      <FileDown className="w-3 h-3" />
                      Export PDF
                    </button>
                    
                    <button
                      onClick={handleShareLink}
                      className="w-full px-3 py-2 rounded-lg font-bold text-xs text-white
                        bg-gradient-to-r from-blue-500 to-purple-500
                        hover:from-blue-600 hover:to-purple-600
                        transform hover:scale-105 active:scale-95
                        transition-all duration-200
                        flex items-center justify-center gap-2
                        shadow-lg hover:shadow-xl"
                    >
                      <Share2 className="w-3 h-3" />
                      Share Link
                    </button>
                  </div>
                </div>

                {/* Tips - Ultra Compact */}
                {(calculation.nftMultiplier < 11 || calculation.eraMultiplier < 16 || performanceScore < 0.9) && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <p className="text-xs font-bold text-yellow-400 uppercase">Optimize</p>
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {calculation.nftMultiplier < 11 && <li>• Get Titan NFT → 11x</li>}
                      {calculation.eraMultiplier < 16 && <li>• DeepSouth Era → 16x</li>}
                      {performanceScore < 0.9 && <li>• Improve perf → {0.9}</li>}
                    </ul>
                  </div>
                )}
              </div>

              {/* Column 4: Projection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Projection</h3>
                </div>

                {/* Mini Timeline Chart */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase">12-Month Accumulation</p>
                  <div style={{ height: '150px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <defs>
                          <linearGradient id="colorStoinc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="month" 
                          stroke="#6b7280" 
                          style={{ fontSize: '10px' }}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#6b7280" 
                          style={{ fontSize: '10px' }}
                          tickLine={false}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number) => [`${value.toFixed(0)} XAND`, 'Total']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="accumulated" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorStoinc)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-white/5 text-center">
                      <p className="text-xs text-gray-400">Year 1</p>
                      <p className="text-sm font-bold text-white">{(calculation.stoincPerMonth * 12).toFixed(0)}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5 text-center">
                      <p className="text-xs text-gray-400">Daily Avg</p>
                      <p className="text-sm font-bold text-white">{(calculation.stoincPerEpoch).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* ROI Estimator - Ultra Compact */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                  <p className="text-xs font-bold text-yellow-400 uppercase mb-1">💎 ROI Estimate</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Break-even</span>
                    <span className="text-sm font-bold text-white">~6 months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
