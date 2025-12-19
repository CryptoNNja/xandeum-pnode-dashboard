"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Trophy, ArrowRight, HardDrive, Zap, Star, ChevronDown, Info, Coins } from "lucide-react";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { useTheme } from "@/hooks/useTheme";
import { calculateNodeScore } from "@/lib/scoring";
import type { PNode } from "@/lib/types";

type LeaderboardTab = "performance" | "storage" | "uptime" | "credits";
type RowVariant = "card" | "modal";

interface TopPerformersChartProps {
    nodes: PNode[];
    onSelectNode?: (ip: string) => void;
}

interface PerformanceEntry {
    node: PNode;
    score: number;
}

interface StorageEntry {
    node: PNode;
    committed: number;
    used: number;
}

interface UptimeEntry {
    node: PNode;
    uptime: number;
    lastSeen?: number;
}

interface CreditsEntry {
    node: PNode;
    credits: number;
    podId?: string;
}

type AnyEntry = PerformanceEntry | StorageEntry | UptimeEntry | CreditsEntry;

const MAX_FULL_LEADERBOARD = 30;

type LeaderboardMeta = {
    label: string;
    icon: typeof Trophy;
    accentBg: string;
    accentText: string;
    tooltip: string;
};

// Helper to get CSS variable value
const getCssVar = (varName: string, fallback: string): string => {
    if (typeof window === "undefined") return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace("#", "");
    const isShort = sanitized.length === 3;
    const full = isShort
        ? sanitized
            .split("")
            .map((char) => char + char)
            .join("")
        : sanitized.padEnd(6, "0");
    const r = parseInt(full.substring(0, 2), 16) || 0;
    const g = parseInt(full.substring(2, 4), 16) || 0;
    const b = parseInt(full.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const TAB_META: Record<LeaderboardTab, LeaderboardMeta> = {
    performance: {
        label: "Performance",
        icon: Trophy,
        accentBg: "rgba(255,215,0,0.15)", // Keep gold for performance
        accentText: "#FFD700", // Keep gold for performance
        tooltip: "Composite score combining CPU, RAM, uptime and packet stability.",
    },
    storage: {
        label: "Storage",
        icon: HardDrive,
        accentBg: hexToRgba(getCssVar("--accent", "#7B3FF2"), 0.15),
        accentText: getCssVar("--accent", "#7B3FF2"),
        tooltip: "Nodes with the largest committed capacity and efficient utilization.",
    },
    uptime: {
        label: "Uptime",
        icon: Zap,
        accentBg: hexToRgba(getCssVar("--kpi-excellent", "#10B981"), 0.15),
        accentText: getCssVar("--kpi-excellent", "#10B981"),
        tooltip: "Longest-running nodes measured by reported uptime and last seen timestamp.",
    },
    credits: {
        label: "Credits",
        icon: Coins,
        accentBg: hexToRgba("#7B3FF2", 0.15),
        accentText: "#14F195",
        tooltip: "Total credits earned by each pNode this cycle. Rewards reset monthly.",
    },
};

const TAB_ORDER: LeaderboardTab[] = ["performance", "storage", "uptime", "credits"];

interface LeaderboardTabsProps {
    activeTab: LeaderboardTab;
    onChange: (tab: LeaderboardTab) => void;
    isLightMode?: boolean;
}

function LeaderboardDropdown({ activeTab, onChange, isLightMode = false }: LeaderboardTabsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const activeMeta = TAB_META[activeTab];
    const ActiveIcon = activeMeta.icon;
    const panelBg = isLightMode ? getCssVar("--bg-card", "#ffffff") : getCssVar("--bg-bg2", "#050816");
    const optionActiveBg = isLightMode ? getCssVar("--bg-bg2", "#f1f5f9") : getCssVar("--bg-card", "#101734");

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="mb-6" ref={dropdownRef}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-text-soft">Metric</p>
                    <p className="text-sm text-text-main/80">Choose which ranking to display</p>
                </div>
                <div className="relative min-w-[220px]">
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between rounded-xl border border-border-app bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-main shadow-lg hover:border-border-app-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-aqua"
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                    >
                        <span className="flex items-center gap-2">
                            <ActiveIcon className="w-4 h-4" style={{ color: activeMeta.accentText }} />
                            {activeMeta.label}
                        </span>
                        <ChevronDown
                            className={clsx(
                                "w-4 h-4 transition-transform",
                                isOpen ? "rotate-180" : "rotate-0"
                            )}
                        />
                    </button>
                    {isOpen && (
                        <div
                            className="absolute right-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-border-app shadow-[0_18px_40px_rgba(5,8,22,0.5)]"
                            style={{ backgroundColor: panelBg }}
                            role="listbox"
                        >
                            {TAB_ORDER.map((tabKey) => {
                                const meta = TAB_META[tabKey];
                                const isActiveTab = activeTab === tabKey;
                                const Icon = meta.icon;
                                return (
                                    <button
                                        key={tabKey}
                                        type="button"
                                        onClick={() => {
                                            onChange(tabKey);
                                            setIsOpen(false);
                                        }}
                                        className={clsx(
                                            "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                                            isActiveTab
                                                ? "text-text-main"
                                                : "text-text-soft hover:text-text-main"
                                        )}
                                        style={{
                                            backgroundColor: isActiveTab ? optionActiveBg : panelBg,
                                        }}
                                        role="option"
                                        aria-selected={isActiveTab}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: meta.accentText }} />
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{meta.label}</span>
                                            <span className="text-[11px] text-text-faint">{meta.tooltip}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const getStarRating = (score: number) => {
    const filled = Math.max(0, Math.min(5, Math.floor(score / 20)));
    return Array.from({ length: 5 }, (_, idx) => idx < filled);
};

const formatStorage = (bytes?: number) => {
    if (!Number.isFinite(bytes ?? NaN) || !bytes || bytes <= 0) return "N/A";
    const tb = bytes / 1e12;
    if (tb >= 1) return `${tb.toFixed(1)} TB`;
    const gb = bytes / 1e9;
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / 1e6;
    return `${mb.toFixed(0)} MB`;
};

const formatUptimeValue = (seconds?: number) => {
    if (!Number.isFinite(seconds ?? NaN) || !seconds || seconds <= 0) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const formatStartDate = (uptime?: number, lastSeen?: number) => {
    if (!Number.isFinite(uptime ?? NaN) || !uptime || uptime <= 0) return "Unknown";
    const referenceSeconds = lastSeen && lastSeen > 0 ? lastSeen : Date.now() / 1000;
    const startTime = (referenceSeconds - uptime) * 1000;
    if (!Number.isFinite(startTime) || startTime <= 0) return "Unknown";
    return new Date(startTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function TopPerformersChart({ nodes, onSelectNode }: TopPerformersChartProps) {
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const isLight = mounted ? theme === "light" : false;
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
    const [activeTab, setActiveTab] = useState<LeaderboardTab>("performance");
    const [creditsData, setCreditsData] = useState<{ pod_id: string; credits: number }[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = window.matchMedia("(max-width: 640px)");
        const handleChange = () => setIsSmallScreen(query.matches);
        handleChange();
        query.addEventListener("change", handleChange);
        return () => query.removeEventListener("change", handleChange);
    }, []);

    const portalContainer = typeof window !== "undefined" ? document.body : null;

    // Fetch credits data
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const response = await fetch('/api/pods-credits');
                if (response.ok) {
                    const data = await response.json();
                    setCreditsData(data.topEarners || []);
                }
            } catch (error) {
                console.error('Failed to fetch credits:', error);
            }
        };
        
        fetchCredits();
        const interval = setInterval(fetchCredits, 300_000); // Refresh every 5 min
        return () => clearInterval(interval);
    }, []);

    const performanceRanking = useMemo<PerformanceEntry[]>(() => {
        if (!nodes || nodes.length === 0) return [];
        return nodes
            .map((node) => ({
                node,
                score: calculateNodeScore(node),
            }))
            .sort((a, b) => {
                if (b.score === a.score) {
                    return a.node.ip.localeCompare(b.node.ip);
                }
                return b.score - a.score;
            })
            .slice(0, MAX_FULL_LEADERBOARD);
    }, [nodes]);

    const storageRanking = useMemo<StorageEntry[]>(() => {
        if (!nodes || nodes.length === 0) return [];
        return nodes
            .map((node) => {
                // API v0.7 mapping:
                // - storage_committed => stats.file_size
                // - storage_used => stats.total_bytes
                const committed = Math.max(node.stats.file_size ?? 0, 0);
                const used = Math.max(node.stats.total_bytes ?? 0, 0);
                return { node, committed, used };
            })
            .filter((entry) => entry.committed > 0)
            .sort((a, b) => {
                if (b.committed === a.committed) {
                    return a.node.ip.localeCompare(b.node.ip);
                }
                return b.committed - a.committed;
            })
            .slice(0, MAX_FULL_LEADERBOARD);
    }, [nodes]);

    const uptimeRanking = useMemo<UptimeEntry[]>(() => {
        if (!nodes || nodes.length === 0) return [];
        return nodes
            .map((node) => ({
                node,
                uptime: Math.max(node.stats.uptime, 0),
                lastSeen: node.stats.last_updated,
            }))
            .filter((entry) => entry.uptime > 0)
            .sort((a, b) => {
                if (b.uptime === a.uptime) {
                    return a.node.ip.localeCompare(b.node.ip);
                }
                return b.uptime - a.uptime;
            })
            .slice(0, MAX_FULL_LEADERBOARD);
    }, [nodes]);

    const creditsRanking = useMemo<CreditsEntry[]>(() => {
        if (!creditsData || creditsData.length === 0) return [];
        // Try to match credits data with nodes via potential future pubkey field
        // For now, show pod_id formatted nicely
        return creditsData
            .map((credit) => {
                // Try to find matching node by pubkey
                const matchedNode = nodes.find(n => n.pubkey === credit.pod_id);
                
                return {
                    node: matchedNode || {
                        ip: `${credit.pod_id.slice(0, 4)}...${credit.pod_id.slice(-4)}`, // Show first 4 + last 4
                        status: "active",
                        stats: {},
                    } as PNode,
                    credits: credit.credits,
                    podId: credit.pod_id,
                };
            })
            .slice(0, MAX_FULL_LEADERBOARD);
    }, [creditsData, nodes]);

    const getRankingForTab = (tab: LeaderboardTab): AnyEntry[] => {
        if (tab === "performance") return performanceRanking;
        if (tab === "storage") return storageRanking;
        if (tab === "uptime") return uptimeRanking;
        return creditsRanking;
    };

    const activeRanking = getRankingForTab(activeTab);
    const displayCount = isSmallScreen ? 3 : 5;
    const visibleEntries = activeRanking.slice(0, displayCount);
    const activeTabLabel = TAB_META[activeTab].label;

    const handleRowClick = (ip: string, closeModal = false) => {
        if (onSelectNode) {
            onSelectNode(ip);
        } else if (typeof window !== "undefined") {
            router.push(`/pnode/${ip}`);
        }
        if (closeModal) {
            setShowFullLeaderboard(false);
        }
    };

    const handleRowKeyDown = (ip: string, closeModal: boolean) =>
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleRowClick(ip, closeModal);
            }
        };

    const statusIndicator = (status: PNode["status"]) => (
        <span
            className="w-2 h-2 rounded-full inline-flex"
            style={{
                backgroundColor: status === "active" 
                    ? 'var(--kpi-excellent)' 
                    : 'var(--kpi-good)'
            }}
            aria-label={status === "active" ? "Public node" : "Private node"}
        />
    );

    const rowBaseClasses = (variant: RowVariant) =>
        clsx(
            "rounded-lg border border-transparent bg-transparent transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-aqua",
            variant === "card" ? "px-3 py-4" : "px-3 py-3"
        );

    const rowHoverClass = isLight ? "hover:bg-gray-50" : "hover:bg-white/5";

    const renderPerformanceRow = (
        entry: PerformanceEntry,
        rank: number,
        variant: RowVariant,
        closeModal: boolean
    ) => {
        const stars = getStarRating(entry.score);
        return (
            <div
                key={`perf-${entry.node.ip}-${variant}`}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(entry.node.ip, closeModal)}
                onKeyDown={handleRowKeyDown(entry.node.ip, closeModal)}
                className={clsx(
                    rowBaseClasses(variant),
                    rowHoverClass,
                    "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1"
                )}
            >
                <span className="text-sm font-semibold text-text-faint text-right">{rank}.</span>
                <div className="min-w-0">
                    <p className="font-mono text-sm text-text-main truncate">{entry.node.ip}</p>
                    <div className="mt-1 flex items-center gap-1 text-yellow-400">
                        {stars.map((filled, idx) => (
                            <Star
                                key={`${entry.node.ip}-star-${idx}`}
                                className={clsx(
                                    "w-3.5 h-3.5",
                                    filled ? "fill-yellow-400 text-yellow-400" : "text-text-faint"
                                )}
                                aria-hidden
                            />
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                    <span className="text-2xl font-bold text-text-main leading-none">{entry.score}</span>
                    <div className="flex items-center gap-2 text-xs text-text-soft">
                        <span>Overall score</span>
                        {statusIndicator(entry.node.status)}
                    </div>
                </div>
            </div>
        );
    };

    const renderStorageRow = (
        entry: StorageEntry,
        rank: number,
        variant: RowVariant,
        closeModal: boolean
    ) => {
        const utilization = entry.committed > 0 ? Math.round((entry.used / entry.committed) * 100) : null;
        return (
            <div
                key={`storage-${entry.node.ip}-${variant}`}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(entry.node.ip, closeModal)}
                onKeyDown={handleRowKeyDown(entry.node.ip, closeModal)}
                className={clsx(
                    rowBaseClasses(variant),
                    rowHoverClass,
                    "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-4 gap-y-1"
                )}
            >
                <span className="text-sm font-semibold text-text-faint text-right">{rank}.</span>
                <div className="min-w-0">
                    <p className="font-mono text-sm text-text-main truncate">{entry.node.ip}</p>
                    <p className="text-xs text-text-soft">{entry.node.status === "active" ? "Public" : "Private"} node</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                    <span className="text-lg font-bold leading-none" style={{ color: 'var(--accent-aqua)' }}>
                        {formatStorage(entry.committed)}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-text-soft">
                        <span>Committed</span>
                        {statusIndicator(entry.node.status)}
                    </div>
                </div>
                <div className="col-span-2 col-start-2 text-xs text-text-soft">
                    <span className="font-medium text-text-main">{formatStorage(entry.used)}</span> used
                    {utilization !== null && Number.isFinite(utilization) && (
                        <span className="ml-1">({Math.max(utilization, 0)}% utilization)</span>
                    )}
                </div>
            </div>
        );
    };

    const renderUptimeRow = (
        entry: UptimeEntry,
        rank: number,
        variant: RowVariant,
        closeModal: boolean
    ) => (
        <div
            key={`uptime-${entry.node.ip}-${variant}`}
            role="button"
            tabIndex={0}
            onClick={() => handleRowClick(entry.node.ip, closeModal)}
            onKeyDown={handleRowKeyDown(entry.node.ip, closeModal)}
            className={clsx(
                rowBaseClasses(variant),
                rowHoverClass,
                "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-4 gap-y-1"
            )}
        >
            <span className="text-sm font-semibold text-text-faint text-right">{rank}.</span>
            <div className="min-w-0">
                <p className="font-mono text-sm text-text-main truncate">{entry.node.ip}</p>
                <p className="text-xs text-text-soft">Online since {formatStartDate(entry.uptime, entry.lastSeen)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-lg font-bold leading-none" style={{ color: 'var(--kpi-excellent)' }}>
                    {formatUptimeValue(entry.uptime)}
                </span>
                <div className="flex items-center gap-2 text-xs text-text-soft">
                    <span>Uptime</span>
                    {statusIndicator(entry.node.status)}
                </div>
            </div>
            <div className="col-span-2 col-start-2 text-xs text-text-soft">
                Last seen: {entry.lastSeen ? new Date(entry.lastSeen * 1000).toLocaleString() : "N/A"}
            </div>
        </div>
    );

    const renderCreditsRow = (
        entry: CreditsEntry,
        rank: number,
        variant: RowVariant,
        closeModal: boolean
    ) => {
        const formattedCredits = entry.credits.toLocaleString();
        const hasMatchedNode = entry.node.ip.includes('.'); // Check if it's a real IP
        
        return (
            <div
                key={`credits-${entry.podId}-${variant}`}
                role={hasMatchedNode ? "button" : undefined}
                tabIndex={hasMatchedNode ? 0 : undefined}
                onClick={hasMatchedNode ? () => handleRowClick(entry.node.ip, closeModal) : undefined}
                onKeyDown={hasMatchedNode ? handleRowKeyDown(entry.node.ip, closeModal) : undefined}
                className={clsx(
                    rowBaseClasses(variant),
                    hasMatchedNode && rowHoverClass,
                    "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-4 gap-y-1",
                    !hasMatchedNode && "cursor-default"
                )}
            >
                <span className="text-sm font-semibold text-text-faint text-right">{rank}.</span>
                <div className="min-w-0">
                    {hasMatchedNode ? (
                        <>
                            <p className="font-mono text-sm text-text-main truncate">{entry.node.ip}</p>
                            <p className="text-xs text-text-soft">Matched node</p>
                        </>
                    ) : (
                        <>
                            <p className="font-mono text-xs text-text-main truncate" title={entry.podId}>
                                {entry.node.ip}
                            </p>
                            <p className="text-xs text-text-soft">Pod ID (no IP match)</p>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                    <span className="text-lg font-bold leading-none" style={{ color: '#14F195' }}>
                        {formattedCredits}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-text-soft">
                        <span>Credits</span>
                        <Coins className="w-3 h-3" style={{ color: '#14F195' }} />
                    </div>
                </div>
            </div>
        );
    };

    const renderRow = (
        tab: LeaderboardTab,
        entry: AnyEntry,
        rank: number,
        variant: RowVariant,
        closeModal: boolean
    ) => {
        if (tab === "performance") {
            return renderPerformanceRow(entry as PerformanceEntry, rank, variant, closeModal);
        }
        if (tab === "storage") {
            return renderStorageRow(entry as StorageEntry, rank, variant, closeModal);
        }
        if (tab === "uptime") {
            return renderUptimeRow(entry as UptimeEntry, rank, variant, closeModal);
        }
        return renderCreditsRow(entry as CreditsEntry, rank, variant, closeModal);
    };

    return (
        <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,215,0,0.15)' }}>
                        <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} strokeWidth={2.3} />
                    </div>
                    <h3 className="text-lg font-semibold tracking-[0.35em] text-text-main">Network Leaderboard</h3>
                </div>
                <InfoTooltip content="Ranking of pNodes based on performance, storage commitment, or uptime. Use the dropdown to switch metrics." />
            </div>

            <LeaderboardDropdown
                activeTab={activeTab}
                onChange={setActiveTab}
                isLightMode={isLight}
            />

            {visibleEntries.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-center text-text-faint text-sm">
                    <p>No {activeTabLabel.toLowerCase()} data available yet.</p>
                    <p className="text-[11px] mt-2">Connect nodes to populate the leaderboard.</p>
                </div>
            ) : (
                <div className="space-y-3" role="list">
                    {visibleEntries.map((entry, index) =>
                        renderRow(activeTab, entry, index + 1, "card", false)
                    )}
                </div>
            )}

            {activeRanking.length > 0 && (
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowFullLeaderboard(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-accent-aqua hover:underline"
                    >
                        View Full Leaderboard
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {showFullLeaderboard && portalContainer
                ? createPortal(
                    <div
                        className={clsx(
                            "fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4",
                            isLight ? "bg-white/95" : "bg-black/90"
                        )}
                        onClick={() => setShowFullLeaderboard(false)}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="bg-bg-app border border-border-app rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-border-app px-6 py-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest text-text-faint">Network Leaderboard</p>
                                    <h4 className="text-xl font-semibold text-text-main mt-1">
                                        Top {Math.min(MAX_FULL_LEADERBOARD, getRankingForTab(activeTab).length)} Nodes
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFullLeaderboard(false)}
                                    className="text-text-faint hover:text-text-main"
                                    aria-label="Close leaderboard"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="px-6 pt-4">
                                <LeaderboardDropdown
                                    activeTab={activeTab}
                                    onChange={setActiveTab}
                                    isLightMode={isLight}
                                />
                            </div>

                            <div className="px-6 pb-6 space-y-2 overflow-y-auto max-h-[calc(80vh-160px)]">
                                {getRankingForTab(activeTab).map((entry, index) =>
                                    renderRow(activeTab, entry, index + 1, "modal", true)
                                )}
                                {getRankingForTab(activeTab).length === 0 && (
                                    <p className="text-center text-sm text-text-faint py-6">No telemetry available.</p>
                                )}
                            </div>
                        </div>
                    </div>,
                    portalContainer
                )
                : null}
        </div>
    );
}
