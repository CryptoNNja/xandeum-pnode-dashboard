
"use client";

import { useEffect } from "react";
import clsx from "clsx";
import type { AutoRefreshOption, ViewMode } from "@/hooks/usePnodeDashboard";

type SettingsModalProps = {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  autoRefreshOption: AutoRefreshOption;
  setAutoRefreshOption: (option: AutoRefreshOption) => void;
  defaultView: ViewMode;
  setDefaultView: (view: ViewMode) => void;
  setViewMode: (view: ViewMode) => void;
  isLight: boolean;
};

export const SettingsModal = ({
  isSettingsOpen,
  setIsSettingsOpen,
  autoRefreshOption,
  setAutoRefreshOption,
  defaultView,
  setDefaultView,
  setViewMode,
  isLight,
}: SettingsModalProps) => {
  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#050914] z-50 flex items-center justify-center p-4"
      onClick={() => setIsSettingsOpen(false)}
    >
      <div
        className="bg-bg-app border border-border-app rounded-xl max-w-xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border-app p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-text-main">Dashboard settings</h3>
            <p className="text-sm text-text-faint mt-2">Auto-refresh and default view</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="text-text-faint hover:text-text-main transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Auto-refresh</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "off" as const, label: "Off" },
                  { key: "30s" as const, label: "30s" },
                  { key: "1m" as const, label: "1m" },
                  { key: "5m" as const, label: "5m" },
                ]
              ).map((opt) => {
                const active = autoRefreshOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAutoRefreshOption(opt.key)}
                    className={clsx(
                      "px-3 py-2 rounded-lg border text-sm font-semibold transition-colors",
                      active
                        ? "bg-accent-aqua/15 text-accent-aqua border-accent-aqua/30"
                        : "bg-bg-bg text-text-main border-border-app hover:bg-bg-bg2"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Default View</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "table" as const, label: "Table" },
                  { key: "grid" as const, label: "Grid" },
                  { key: "map" as const, label: "Map" },
                ]
              ).map((opt) => {
                const active = defaultView === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setDefaultView(opt.key);
                      setViewMode(opt.key);
                    }}
                    className={clsx(
                      "px-3 py-2 rounded-lg border text-sm font-semibold transition-colors",
                      active
                        ? "bg-accent-aqua/15 text-accent-aqua border-accent-aqua/30"
                        : "bg-bg-bg text-text-main border-border-app hover:bg-bg-bg2"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border-app p-4 bg-bg-bg">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="w-full px-4 py-2 bg-bg-bg2 hover:bg-bg-card border border-border-app rounded-lg text-sm font-semibold text-text-main transition-colors theme-transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
