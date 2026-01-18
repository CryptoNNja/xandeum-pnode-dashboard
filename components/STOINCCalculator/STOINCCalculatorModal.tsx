'use client';

import { useState, useMemo } from 'react';
import { X, Calculator, TrendingUp, Award, Zap, Shield, Sparkles, Server, HardDrive, Gauge, Gem, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

          {/* Content - Ultra-compact 3-column no scroll */}
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Core Parameters */}
              <div className="space-y-4">
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

                {/* Storage - Compact */}
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-semibold text-gray-300">Storage</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {storageSpace >= 1000 ? `${(storageSpace / 1000).toFixed(1)} TB` : `${storageSpace} GB`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={300000}
                    step={storageSpace < 1000 ? 50 : 1000}
                    value={storageSpace}
                    onChange={(e) => setStorageSpace(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, #10b981 ${(storageSpace / 300000) * 100}%, rgba(255,255,255,0.1) ${(storageSpace / 300000) * 100}%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gem className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Boost Multipliers</h3>
                </div>

                {/* NFT Selection */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">NFT Ownership</p>
                  <div className="space-y-1">
                    {Object.entries(NFT_BOOSTS).map(([key, { label, boost, icon }]) => (
                      <button
                        key={key}
                        onClick={() => setNftTier(key as keyof typeof NFT_BOOSTS)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-left transition-all flex items-center justify-between
                          ${nftTier === key 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{icon}</span>
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <span className="text-xs font-bold">{boost}x</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purchase Era Selection */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Purchase Era</p>
                  <div className="space-y-1">
                    {Object.entries(PURCHASE_ERA_BOOSTS).map(([key, { label, boost, icon }]) => (
                      <button
                        key={key}
                        onClick={() => setPurchaseEra(key as keyof typeof PURCHASE_ERA_BOOSTS)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-left transition-all flex items-center justify-between
                          ${purchaseEra === key 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{icon}</span>
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <span className="text-xs font-bold">{boost}x</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="space-y-4">
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
