"use client";

import React from "react";
import * as Slider from "@radix-ui/react-slider";
import { X, RotateCcw, Filter, Check, Cpu, HardDrive, Activity, Zap, Users, Network } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStatusColors } from "@/lib/utils";
import type { OperatorFilter, NetworkStatusFilter } from "@/hooks/usePnodeDashboard";

type AdvancedFiltersProps = {
  isOpen: boolean;
  onClose: () => void;
  versionBuckets: { id: string; label: string; count: number; color: string }[];
  selectedVersions: string[];
  setSelectedVersions: (versions: string[]) => void;
  selectedHealthStatuses: string[];
  setSelectedHealthStatuses: (statuses: string[]) => void;
  minCpu: number;
  setMinCpu: (val: number) => void;
  minStorage: number;
  setMinStorage: (val: number) => void;
  maxStorageBytes: number;
  sliderToBytes: (val: number) => number;
  onReset: () => void;
  resultsCount: number;
  staleFilter: "hide" | "include";
  setStaleFilter: (v: "hide" | "include") => void;
  // 🆕 Operator filters
  operatorFilter?: OperatorFilter;
  setOperatorFilter?: (filter: OperatorFilter) => void;
  operatorStats?: {
    total: number;
    single: number;
    multi: number;
    noPubkey: number;
    maxNodesPerOperator: number;
  };
  // 🆕 Network status filters
  networkStatusFilters?: NetworkStatusFilter[];
  setNetworkStatusFilters?: (filters: NetworkStatusFilter[]) => void;
};

const HEALTH_STATUSES = ["Excellent", "Good", "Warning", "Critical", "Private"];

export const AdvancedFilters = ({
  isOpen,
  onClose,
  versionBuckets,
  selectedVersions,
  setSelectedVersions,
  selectedHealthStatuses,
  setSelectedHealthStatuses,
  minCpu,
  setMinCpu,
  minStorage,
  setMinStorage,
  maxStorageBytes,
  sliderToBytes,
  onReset,
  resultsCount,
  staleFilter,
  setStaleFilter,
  operatorFilter,
  setOperatorFilter,
  operatorStats,
  networkStatusFilters,
  setNetworkStatusFilters,
}: AdvancedFiltersProps) => {
  const statusColors = getStatusColors();

  const toggleVersion = (version: string) => {
    setSelectedVersions(
      selectedVersions.includes(version)
        ? selectedVersions.filter((v) => v !== version)
        : [...selectedVersions, version]
    );
  };

  const toggleHealth = (status: string) => {
    setSelectedHealthStatuses(
      selectedHealthStatuses.includes(status)
        ? selectedHealthStatuses.filter((s) => s !== status)
        : [...selectedHealthStatuses, status]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent": return statusColors.excellent;
      case "Good": return statusColors.good;
      case "Warning": return statusColors.warning;
      case "Critical": return statusColors.critical;
      case "Private": return "var(--kpi-private)";
      default: return "var(--text-soft)";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0, y: -10 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="bg-bg-card/80 backdrop-blur-xl border border-border-app rounded-2xl p-6 mb-8 shadow-2xl relative">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-aqua/5 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="flex items-center justify-between mb-8 border-b border-border-app/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-aqua/10 flex items-center justify-center">
                  <Filter className="w-4 h-4 text-accent-aqua" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-text-main">Precision Filters</h3>
                  <p className="text-[10px] text-text-faint font-medium">Refine your node analysis with specific criteria</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-bg-bg rounded-full border border-border-app flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-aqua animate-pulse" />
                  <span className="text-[11px] font-bold text-text-main">{resultsCount} nodes matching</span>
                </div>
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-text-soft hover:text-accent-aqua hover:bg-accent-aqua/5 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full text-text-faint hover:text-text-main transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {/* 🆕 Operator Type */}
              {operatorFilter && setOperatorFilter && operatorStats && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-text-faint" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Operator Type</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: "all" as const, label: "All Operators", count: operatorStats.total + operatorStats.noPubkey },
                      { key: "single" as const, label: "Single-Node", count: operatorStats.single },
                      { key: "multi" as const, label: "Multi-Node", count: operatorStats.multi },
                      { key: "no_pubkey" as const, label: "Unknown", count: operatorStats.noPubkey },
                    ].map((option) => {
                      const isSelected = operatorFilter === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => setOperatorFilter(option.key)}
                          className={`
                            w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all border flex items-center justify-between
                            ${isSelected 
                              ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-lg" 
                              : "bg-bg-bg border-border-app text-text-soft hover:border-text-faint"}
                          `}
                        >
                          <span>{option.label}</span>
                          <span className="text-[10px] font-mono opacity-60">{option.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🆕 Network Status */}
              {networkStatusFilters && setNetworkStatusFilters && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Network className="w-3.5 h-3.5 text-text-faint" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Network Status</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: "active" as const, label: "Active (Observed)", icon: "🟢" },
                      { key: "registry_only" as const, label: "Registry Only", icon: "🔵" },
                      { key: "stale" as const, label: "Stale/Offline", icon: "🔴" },
                    ].map((option) => {
                      const isSelected = networkStatusFilters.includes(option.key);
                      return (
                        <label
                          key={option.key}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNetworkStatusFilters([...networkStatusFilters, option.key]);
                              } else {
                                setNetworkStatusFilters(networkStatusFilters.filter(f => f !== option.key));
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-border-app bg-bg-bg checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-colors"
                          />
                          <span className="text-xs text-text-main group-hover:text-accent-aqua transition-colors flex items-center gap-1.5">
                            <span>{option.icon}</span>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stale nodes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Stale Nodes</h3>
                </div>
                <div className="flex items-center justify-between bg-bg-bg/40 border border-border-app rounded-xl p-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-soft">Include stale (unreachable)</span>
                    <span className="text-[10px] text-text-faint">Kept for coverage, hidden by default</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaleFilter(staleFilter === "hide" ? "include" : "hide")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                      staleFilter === "include"
                        ? "bg-accent-purple/15 border-accent-purple text-text-main"
                        : "bg-bg-card border-border-app text-text-soft"
                    }`}
                  >
                    {staleFilter === "include" ? "On" : "Off"}
                  </button>
                </div>
              </div>
              {/* Health Status */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-text-faint" />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Health State</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {HEALTH_STATUSES.map((status) => {
                    const isSelected = selectedHealthStatuses.includes(status);
                    const color = getStatusColor(status);
                    return (
                      <button
                        key={status}
                        onClick={() => toggleHealth(status)}
                        className={`
                          px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-left flex items-center justify-between
                          ${isSelected 
                            ? "border-opacity-100 shadow-lg scale-[1.02] ring-1 ring-offset-2 ring-offset-bg-card" 
                            : "bg-transparent border-border-app text-text-soft hover:border-text-faint"}
                        `}
                        style={{ 
                          backgroundColor: isSelected ? `${color}25` : undefined,
                          borderColor: isSelected ? color : undefined,
                          color: isSelected ? color : "var(--text-soft)",
                          // @ts-ignore
                          "--ring-color": color
                        }}
                      >
                        {status}
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Network Versions */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-text-faint" />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Network Releases</p>
                </div>
                <div className="flex flex-col gap-2">
                  {versionBuckets.length > 0 ? versionBuckets.map((bucket) => {
                    const isSelected = selectedVersions.includes(bucket.id);
                    return (
                      <button
                        key={bucket.id}
                        onClick={() => toggleVersion(bucket.id)}
                        className={`
                          w-full px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all border flex items-center justify-between
                          ${isSelected 
                            ? "shadow-lg scale-[1.02] ring-1" 
                            : "bg-bg-bg border-border-app text-text-soft hover:border-text-faint"}
                        `}
                        style={{
                          backgroundColor: isSelected ? `${bucket.color}20` : undefined,
                          borderColor: isSelected ? bucket.color : undefined,
                          color: isSelected ? bucket.color : undefined,
                          // @ts-ignore
                          "--ring-color": bucket.color
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                          <span>{bucket.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] opacity-60 font-mono">{bucket.count} nodes</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  }) : (
                    <p className="text-[10px] text-text-faint italic px-2">No versions detected</p>
                  )}
                </div>
              </div>

              {/* CPU Usage Slider */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-text-faint" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Minimum CPU</p>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${minCpu > 0 ? 'bg-accent-aqua/20 text-accent-aqua ring-1 ring-accent-aqua/50' : 'bg-text-main/5 text-text-faint'}`}>
                    {minCpu}%
                  </span>
                </div>
                <div className="px-2">
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer group"
                    value={[minCpu]}
                    onValueChange={([val]) => setMinCpu(val)}
                    max={100}
                    step={5}
                  >
                    <Slider.Track className="bg-text-main/20 relative grow rounded-full h-[6px] overflow-hidden border border-white/5">
                      <Slider.Range 
                        className="absolute rounded-full h-full transition-all duration-300" 
                        style={{ 
                          background: `linear-gradient(to right, var(--accent-aqua), #F59E0B, #EF4444)` 
                        }}
                      />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-5 h-5 bg-white border-2 shadow-xl rounded-full hover:scale-125 transition-all focus:outline-none focus:ring-4 cursor-grab active:cursor-grabbing z-10"
                      style={{ 
                        borderColor: minCpu > 70 ? '#EF4444' : minCpu > 40 ? '#F59E0B' : 'var(--accent-aqua)',
                        boxShadow: `0 0 15px ${minCpu > 70 ? '#EF4444' : minCpu > 40 ? '#F59E0B' : 'var(--accent-aqua)'}66`
                      }}
                      aria-label="Min CPU"
                    />
                  </Slider.Root>
                  <div className="flex justify-between mt-3 text-[9px] text-text-faint font-mono uppercase tracking-tighter">
                    <span>Idle (0%)</span>
                    <span>Load (100%)</span>
                  </div>
                </div>
              </div>

              {/* Storage Slider */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-text-faint" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Min Storage</p>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${minStorage > 0 ? 'bg-accent-purple/20 text-accent-purple ring-1 ring-accent-purple/50' : 'bg-text-main/5 text-text-faint'}`}>
                    {(() => {
                      const bytes = sliderToBytes(minStorage);
                      if (bytes === 0) return "Any";
                      if (bytes < 1024 * 1024 * 1024 * 1024) {
                        return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
                      }
                      return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
                    })()}
                  </span>
                </div>
                <div className="px-2">
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer group"
                    value={[minStorage]}
                    onValueChange={([val]) => setMinStorage(val)}
                    max={100}
                    step={1}
                  >
                    <Slider.Track className="bg-text-main/20 relative grow rounded-full h-[6px] overflow-hidden border border-white/5">
                      <Slider.Range className="absolute bg-gradient-to-r from-accent-purple to-pink-500 rounded-full h-full" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-5 h-5 bg-white border-2 shadow-xl rounded-full hover:scale-125 transition-all focus:outline-none focus:ring-4 cursor-grab active:cursor-grabbing z-10"
                      style={{ 
                        borderColor: minStorage > 80 ? '#ec4899' : minStorage > 40 ? '#a855f7' : 'var(--accent-purple)',
                        boxShadow: `0 0 15px ${minStorage > 80 ? '#ec4899' : minStorage > 40 ? '#a855f7' : 'var(--accent-purple)'}66`
                      }}
                      aria-label="Min Storage"
                    />
                  </Slider.Root>
                  <div className="flex justify-between mt-3 text-[9px] text-text-faint font-mono uppercase tracking-tighter">
                    <div className="flex flex-col items-start gap-1">
                      <span>0 GB</span>
                      <span className="opacity-40 text-[7px]">Precision Range</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-30">
                      <span className="w-px h-2 bg-text-soft" />
                      <span>1 TB</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span>{(maxStorageBytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB</span>
                      <span className="opacity-40 text-[7px]">Network Max</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
