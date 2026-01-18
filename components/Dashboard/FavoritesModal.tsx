"use client";

import React, { memo, useState, useMemo } from "react";
import { X, Star, Trash2, Eye, GitCompare, Search, Filter, Download, Upload, Sparkles } from "lucide-react";
import clsx from "clsx";
import { PNode } from "@/lib/types";
import { FavoriteNode } from "@/hooks/useFavorites";
import { formatBytesAdaptive } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteNode[];
  allNodes: (PNode & { _score?: number; _healthStatus?: string })[];
  onRemoveFavorite: (ip: string) => void;
  onClearAll: () => void;
  onCompare: (ips: string[]) => void;
  onExport: () => void;
  onImport: (jsonString: string) => boolean;
  isLight?: boolean;
}

const FavoritesModalComponent = ({
  isOpen,
  onClose,
  favorites,
  allNodes,
  onRemoveFavorite,
  onClearAll,
  onCompare,
  onExport,
  onImport,
  isLight = false,
}: FavoritesModalProps) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  // Get full node data for favorites
  const favoriteNodes = useMemo(() => {
    const nodesMap = new Map(allNodes.map(node => [node.ip, node]));
    return favorites
      .map(fav => ({
        favorite: fav,
        node: nodesMap.get(fav.ip),
      }))
      .filter(item => item.node !== undefined);
  }, [favorites, allNodes]);

  // Filter favorites by search
  const filteredFavorites = useMemo(() => {
    if (!searchTerm) return favoriteNodes;
    const query = searchTerm.toLowerCase();
    return favoriteNodes.filter(item => 
      item.favorite.ip.toLowerCase().includes(query) ||
      item.favorite.category?.toLowerCase().includes(query) ||
      item.favorite.note?.toLowerCase().includes(query)
    );
  }, [favoriteNodes, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const nodes = favoriteNodes.map(item => item.node!);
    const avgScore = nodes.reduce((sum, node) => sum + (node._score ?? 0), 0) / (nodes.length || 1);
    const avgUptime = nodes.reduce((sum, node) => sum + (node.stats?.uptime ?? 0), 0) / (nodes.length || 1);
    const healthyCount = nodes.filter(node => (node._score ?? 0) >= 70).length;
    const bestPerformer = nodes.reduce((best, node) => 
      (node._score ?? 0) > (best._score ?? 0) ? node : best
    , nodes[0]);

    return {
      total: nodes.length,
      avgScore: Math.round(avgScore),
      avgUptimeHours: Math.round(avgUptime / 3600),
      healthyCount,
      bestPerformer,
    };
  }, [favoriteNodes]);

  const handleToggleCompareSelection = (ip: string) => {
    setSelectedForCompare(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ip)) {
        newSet.delete(ip);
      } else {
        if (newSet.size >= 4) {
          // Max 4 nodes for comparison
          return prev;
        }
        newSet.add(ip);
      }
      return newSet;
    });
  };

  const handleCompareSelected = () => {
    if (selectedForCompare.size >= 2) {
      onCompare(Array.from(selectedForCompare));
      setSelectedForCompare(new Set());
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const success = onImport(content);
          if (success) {
            alert('Favorites imported successfully!');
          } else {
            alert('Failed to import favorites. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  const getHealthColor = (status?: string) => {
    switch (status) {
      case "Excellent": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "Good": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "Warning": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "Critical": return "text-red-500 bg-red-500/10 border-red-500/30";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={clsx(
          "w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl animate-scale-up flex flex-col",
          isLight ? "bg-white border-black/10" : "bg-bg-card border-border-app"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={clsx("flex items-center justify-between p-6 border-b", isLight ? "border-black/10" : "border-border-app")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-main">My Favorites</h2>
              <p className="text-sm text-text-soft">{stats.total} node{stats.total !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              "p-2 rounded-lg transition-all hover:scale-110",
              isLight ? "hover:bg-black/5" : "hover:bg-white/5"
            )}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Bar */}
        {stats.total > 0 && (
          <div className={clsx("p-4 border-b", isLight ? "bg-gray-50 border-black/5" : "bg-bg-bg2 border-border-app")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-text-soft uppercase tracking-wider font-bold mb-1">Avg Score</p>
                <p className="text-2xl font-black text-accent-aqua">{stats.avgScore}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-soft uppercase tracking-wider font-bold mb-1">Healthy</p>
                <p className="text-2xl font-black text-green-500">{stats.healthyCount}/{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-soft uppercase tracking-wider font-bold mb-1">Avg Uptime</p>
                <p className="text-2xl font-black text-blue-500">{stats.avgUptimeHours}h</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-soft uppercase tracking-wider font-bold mb-1">Best</p>
                <p className="text-lg font-black text-purple-500">{stats.bestPerformer?.ip?.split('.').slice(-2).join('.') || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Actions */}
        <div className={clsx("p-4 border-b flex items-center gap-3", isLight ? "border-black/5" : "border-border-app")}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={clsx(
                "w-full pl-10 pr-4 py-2 rounded-lg border outline-none transition-all",
                isLight
                  ? "bg-white border-black/10 focus:border-black/30"
                  : "bg-bg-bg border-border-app focus:border-accent-aqua/50"
              )}
            />
          </div>
          <button
            onClick={onExport}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105",
              isLight
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-blue-900/20 text-blue-400 border border-blue-700/30"
            )}
            title="Export favorites"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleImportClick}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105",
              isLight
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-green-900/20 text-green-400 border border-green-700/30"
            )}
            title="Import favorites"
          >
            <Upload className="w-4 h-4" />
          </button>
          {stats.total > 0 && (
            <button
              onClick={onClearAll}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105",
                isLight
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-red-900/20 text-red-400 border border-red-700/30"
              )}
              title="Clear all favorites"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compare Selection Bar */}
        {selectedForCompare.size > 0 && (
          <div className={clsx("p-3 border-b flex items-center justify-between", isLight ? "bg-purple-50 border-purple-200" : "bg-purple-900/10 border-purple-700/30")}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-500">
                {selectedForCompare.size} selected for comparison
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCompareSelected}
                disabled={selectedForCompare.size < 2}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  selectedForCompare.size < 2
                    ? "opacity-50 cursor-not-allowed bg-gray-500/10 text-gray-500"
                    : "hover:scale-105 bg-purple-500 text-white"
                )}
              >
                <GitCompare className="w-4 h-4" />
                Compare
              </button>
              <button
                onClick={() => setSelectedForCompare(new Set())}
                className="p-1.5 rounded-lg hover:bg-purple-500/20 transition-all"
              >
                <X className="w-4 h-4 text-purple-500" />
              </button>
            </div>
          </div>
        )}

        {/* Favorites List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredFavorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Star className="w-16 h-16 text-text-faint mb-4" />
              <h3 className="text-xl font-bold text-text-main mb-2">
                {favorites.length === 0 ? "No favorites yet" : "No results found"}
              </h3>
              <p className="text-sm text-text-soft max-w-md">
                {favorites.length === 0 
                  ? "Select nodes from the table and add them to your favorites to track them easily."
                  : "Try adjusting your search terms."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFavorites.map(({ favorite, node }, index) => {
                const isSelectedForCompare = favorite.ip ? selectedForCompare.has(favorite.ip) : false;
                
                return (
                  <div
                    key={favorite.ip || `favorite-${index}`}
                    className={clsx(
                      "p-4 rounded-xl border-2 transition-all",
                      isSelectedForCompare && "ring-2 ring-purple-500 ring-offset-2",
                      isLight ? "bg-white border-black/10 hover:border-black/20" : "bg-bg-bg2 border-border-app hover:border-accent-aqua/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelectedForCompare}
                          onChange={() => favorite.ip && handleToggleCompareSelection(favorite.ip)}
                          disabled={!favorite.ip}
                          className="mt-1 w-4 h-4 rounded border-2 border-border-app bg-bg-card checked:bg-purple-500 checked:border-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Select for comparison"
                        />
                        <div>
                          <p className="text-sm font-mono font-bold text-text-main">{node?.ip}</p>
                          <p className="text-xs text-text-soft">
                            Added {new Date(favorite.addedAt).toLocaleDateString("en-US")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                          style={{
                            backgroundColor: `${node?._score ?? 0 >= 80 ? '#10B981' : node?._score ?? 0 >= 60 ? '#3B82F6' : '#F59E0B'}20`,
                            color: node?._score ?? 0 >= 80 ? '#10B981' : node?._score ?? 0 >= 60 ? '#3B82F6' : '#F59E0B',
                          }}
                        >
                          {node?._score ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-soft">Status</span>
                        <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border", getHealthColor(node?._healthStatus))}>
                          {node?._healthStatus ?? 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-soft">CPU</span>
                        <span className="font-semibold text-text-main">{(node?.stats?.cpu_percent ?? 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-soft">Storage</span>
                        <span className="font-semibold text-text-main">{formatBytesAdaptive(node?.stats?.storage_committed ?? 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border-app/50">
                      <button
                        onClick={() => favorite.ip && router.push(`/pnode/${favorite.ip}`)}
                        disabled={!favorite.ip}
                        className={clsx(
                          "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                          isLight
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-blue-900/20 text-blue-400 border border-blue-700/30"
                        )}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => favorite.ip && onRemoveFavorite(favorite.ip)}
                        disabled={!favorite.ip}
                        className={clsx(
                          "flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                          isLight
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-red-900/20 text-red-400 border border-red-700/30"
                        )}
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const FavoritesModal = memo(FavoritesModalComponent);
FavoritesModal.displayName = "FavoritesModal";
