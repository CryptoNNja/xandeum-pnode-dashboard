"use client";

import { X, RefreshCw, LayoutGrid, List, Check } from "lucide-react";
import clsx from "clsx";

type AutoRefreshOption = "off" | "30s" | "1m" | "5m";
type ViewMode = "table" | "grid" | "map";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  autoRefreshOption: AutoRefreshOption;
  setAutoRefreshOption: (opt: AutoRefreshOption) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isLight: boolean;
};

export const SettingsModal = ({
  isOpen,
  onClose,
  autoRefreshOption,
  setAutoRefreshOption,
  viewMode,
  setViewMode,
  isLight,
}: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-border-app shadow-2xl overflow-hidden theme-transition"
        style={{
          backgroundColor: isLight ? "rgba(247,249,255,0.98)" : "rgba(5,9,24,0.98)",
        }}
      >
        <div className="p-6 border-b border-border-app flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-main">Dashboard Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-text-faint hover:text-text-main theme-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Auto Refresh */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-main">
                Auto-Refresh Interval
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["off", "30s", "1m", "5m"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAutoRefreshOption(opt)}
                  className={clsx(
                    "px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between theme-transition",
                    autoRefreshOption === opt
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-white/5 border-border-app text-text-soft hover:border-text-faint"
                  )}
                >
                  <span>{opt === "off" ? "Manual Only" : opt}</span>
                  {autoRefreshOption === opt && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Default View */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-main">
                Default View Mode
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(
                [
                  { id: "table", label: "Compact Table", icon: List },
                  { id: "grid", label: "Performance Grid", icon: LayoutGrid },
                  { id: "map", label: "Global Node Map", icon: RefreshCw },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setViewMode(opt.id)}
                    className={clsx(
                      "px-4 py-4 rounded-xl border text-sm font-medium flex items-center justify-between theme-transition",
                      viewMode === opt.id
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-white/5 border-border-app text-text-soft hover:border-text-faint"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{opt.label}</span>
                    </div>
                    {viewMode === opt.id && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 bg-black/20 text-center">
          <p className="text-xs text-text-faint">
            Settings are saved to your browser session
          </p>
        </div>
      </div>
    </div>
  );
};
