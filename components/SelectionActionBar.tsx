"use client";

import React, { memo } from "react";
import { Star, GitCompare, FileDown, X, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/hooks/useTheme";

interface SelectionActionBarProps {
  selectedCount: number;
  onAddToFavorites: () => void;
  onCompare: () => void;
  onExport: () => void;
  onClear: () => void;
  canCompare?: boolean;
  maxCompareNodes?: number;
}

const SelectionActionBarComponent = ({
  selectedCount,
  onAddToFavorites,
  onCompare,
  onExport,
  onClear,
  canCompare = true,
  maxCompareNodes = 4,
}: SelectionActionBarProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Don't render if no selection
  if (selectedCount === 0) return null;

  const compareDisabled = !canCompare || selectedCount < 2 || selectedCount > maxCompareNodes;
  const compareTooltip = selectedCount < 2 
    ? "Select at least 2 nodes to compare"
    : selectedCount > maxCompareNodes
    ? `Maximum ${maxCompareNodes} nodes for comparison`
    : "Compare selected nodes";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div
        className={clsx(
          "flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300",
          isLight
            ? "bg-white/95 border-black/10 shadow-black/5"
            : "bg-bg-card/95 border-border-app shadow-accent-aqua/5"
        )}
      >
        {/* Selection Count */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-bold text-purple-500">
            {selectedCount} node{selectedCount > 1 ? "s" : ""} selected
          </span>
        </div>

        {/* Divider */}
        <div className={clsx("w-px h-8", isLight ? "bg-black/10" : "bg-border-app")} />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Add to Favorites */}
          <button
            onClick={onAddToFavorites}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isLight
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 hover:shadow-md"
                : "bg-yellow-900/20 text-yellow-400 border border-yellow-700/30 hover:bg-yellow-900/30 hover:shadow-lg hover:shadow-yellow-500/10"
            )}
            title="Add selected nodes to favorites"
          >
            <Star className="w-4 h-4" />
            <span>Add to Favorites</span>
          </button>

          {/* Compare */}
          <button
            onClick={onCompare}
            disabled={compareDisabled}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200",
              compareDisabled
                ? "opacity-50 cursor-not-allowed bg-gray-500/10 text-gray-500 border border-gray-500/20"
                : clsx(
                    "hover:scale-105 active:scale-95",
                    isLight
                      ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-md"
                      : "bg-blue-900/20 text-blue-400 border border-blue-700/30 hover:bg-blue-900/30 hover:shadow-lg hover:shadow-blue-500/10"
                  )
            )}
            title={compareTooltip}
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare ({selectedCount})</span>
          </button>

          {/* Export */}
          <button
            onClick={onExport}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isLight
                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:shadow-md"
                : "bg-green-900/20 text-green-400 border border-green-700/30 hover:bg-green-900/30 hover:shadow-lg hover:shadow-green-500/10"
            )}
            title="Export selected nodes"
          >
            <FileDown className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Divider */}
        <div className={clsx("w-px h-8", isLight ? "bg-black/10" : "bg-border-app")} />

        {/* Clear Selection */}
        <button
          onClick={onClear}
          className={clsx(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
            "hover:scale-110 active:scale-95",
            isLight
              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              : "bg-red-900/20 text-red-400 border border-red-700/30 hover:bg-red-900/30"
          )}
          title="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const SelectionActionBar = memo(SelectionActionBarComponent);
SelectionActionBar.displayName = "SelectionActionBar";
