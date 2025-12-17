"use client";

import React from "react";
import * as Slider from "@radix-ui/react-slider";
import { X, RotateCcw, Filter, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStatusColors } from "@/lib/utils";

type AdvancedFiltersProps = {
  isOpen: boolean;
  onClose: () => void;
  availableVersions: string[];
  selectedVersions: string[];
  setSelectedVersions: (versions: string[]) => void;
  selectedHealthStatuses: string[];
  setSelectedHealthStatuses: (statuses: string[]) => void;
  minCpu: number;
  setMinCpu: (val: number) => void;
  minStorage: number;
  setMinStorage: (val: number) => void;
  onReset: () => void;
  resultsCount: number;
};

const HEALTH_STATUSES = ["Excellent", "Good", "Warning", "Critical"];

export const AdvancedFilters = ({
  isOpen,
  onClose,
  availableVersions,
  selectedVersions,
  setSelectedVersions,
  selectedHealthStatuses,
  setSelectedHealthStatuses,
  minCpu,
  setMinCpu,
  minStorage,
  setMinStorage,
  onReset,
  resultsCount,
}: AdvancedFiltersProps) => {
  const statusColors = getStatusColors();

  const toggleVersion = (version: string) => {
    if (selectedVersions.includes(version)) {
      setSelectedVersions(selectedVersions.filter((v) => v !== version));
    } else {
      setSelectedVersions([...selectedVersions, version]);
    }
  };

  const toggleHealth = (status: string) => {
    if (selectedHealthStatuses.includes(status)) {
      setSelectedHealthStatuses(selectedHealthStatuses.filter((s) => s !== status));
    } else {
      setSelectedHealthStatuses([...selectedHealthStatuses, status]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent": return statusColors.excellent;
      case "Good": return statusColors.good;
      case "Warning": return statusColors.warning;
      case "Critical": return statusColors.critical;
      default: return "var(--text-soft)";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-bg-card border border-border-app rounded-xl p-6 mb-6 shadow-xl theme-transition">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-accent-aqua" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-main">Advanced Filters</h3>
                <span className="ml-2 px-2 py-0.5 bg-accent-aqua/10 text-accent-aqua text-[10px] font-bold rounded-full">
                  {resultsCount} results
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onReset}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-soft hover:text-text-main transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-text-soft hover:text-text-main transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Health Status */}
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Health Status</p>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_STATUSES.map((status) => {
                    const isSelected = selectedHealthStatuses.includes(status);
                    const color = getStatusColor(status);
                    return (
                      <button
                        key={status}
                        onClick={() => toggleHealth(status)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                          ${isSelected 
                            ? "bg-opacity-20 border-opacity-50" 
                            : "bg-transparent border-border-app text-text-soft hover:border-text-faint"}
                        `}
                        style={{ 
                          backgroundColor: isSelected ? `${color}33` : undefined,
                          borderColor: isSelected ? color : undefined,
                          color: isSelected ? color : undefined
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          {isSelected && <Check className="w-3 h-3" />}
                          {status}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Network Versions */}
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Versions</p>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableVersions.map((version) => {
                    const isSelected = selectedVersions.includes(version);
                    return (
                      <button
                        key={version}
                        onClick={() => toggleVersion(version)}
                        className={`
                          px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border
                          ${isSelected 
                            ? "bg-accent-aqua/20 border-accent-aqua text-accent-aqua" 
                            : "bg-transparent border-border-app text-text-soft hover:border-text-faint"}
                        `}
                      >
                        {version}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CPU Usage Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Min CPU Load</p>
                  <span className="text-xs font-mono font-bold text-accent-aqua">{minCpu}%</span>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[minCpu]}
                  onValueChange={([val]) => setMinCpu(val)}
                  max={100}
                  step={5}
                >
                  <Slider.Track className="bg-border-app relative grow rounded-full h-[4px]">
                    <Slider.Range className="absolute bg-accent-aqua rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-4 h-4 bg-white shadow-xl rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-accent-aqua cursor-grab active:cursor-grabbing"
                    aria-label="Min CPU"
                  />
                </Slider.Root>
                <div className="flex justify-between text-[10px] text-text-faint font-mono">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Storage Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-faint font-bold">Min Storage</p>
                  <span className="text-xs font-mono font-bold text-accent-purple">{minStorage} TB</span>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[minStorage]}
                  onValueChange={([val]) => setMinStorage(val)}
                  max={10}
                  step={0.5}
                >
                  <Slider.Track className="bg-border-app relative grow rounded-full h-[4px]">
                    <Slider.Range className="absolute bg-accent-purple rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-4 h-4 bg-white shadow-xl rounded-full hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-accent-purple cursor-grab active:cursor-grabbing"
                    aria-label="Min Storage"
                  />
                </Slider.Root>
                <div className="flex justify-between text-[10px] text-text-faint font-mono">
                  <span>0 TB</span>
                  <span>10 TB</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

