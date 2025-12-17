"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Radio,
  Search,
  Eye,
  List,
  LayoutGrid,
  MapPin,
  Download,
  RefreshCw,
  Settings,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Network,
  Cpu,
  MemoryStick,
  Package,
  AlertCircle,
  HardDrive, // Added for Resource Metrics
  HeartPulse, // Added for Health Distribution
  Check,
  Zap,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import PNodeTable from "@/components/PNodeTable";
import EnhancedHero from "@/components/EnhancedHero";
import SkeletonLoader from "@/components/SkeletonLoader";
import TopPerformersChart from "@/components/TopPerformersChart";
import { Toolbar } from "@/components/Dashboard/Toolbar";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import { KpiCards } from "@/components/Dashboard/KpiCards";





const NodesMap = dynamic(() => import("@/components/NodesMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[650px] w-full rounded-xl border border-border-app bg-bg-card flex flex-col items-center justify-center gap-4 text-text-soft theme-transition">
      <div className="w-12 h-12 border-4 border-accent-aqua border-t-transparent rounded-full animate-spin" />
      <p className="text-xs uppercase tracking-[0.35em]">Loading map</p>
    </div>
  ),
});
import { calculateNodeScore, getScoreColor } from "@/lib/scoring";
import { useTheme } from "@/hooks/useTheme";
import { computeVersionOverview } from "@/lib/kpi";
import { getHealthStatus, type HealthStatus } from "@/lib/health";
import type { PNode } from "@/lib/types";
import { useToast } from "@/components/common/Toast";
import {
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
} from "recharts";

// Wrapper to prevent Recharts width/height -1 warnings during initial render
const SafeResponsiveContainer = ({
  children,
  ...props
}: React.ComponentProps<typeof ResponsiveContainer>) => {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for next frame to ensure container has dimensions
    const raf = requestAnimationFrame(() => {
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!ready) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: 100 }}
      />
    );
  }

  return (
    <ResponsiveContainer {...props} debounce={100}>
      {children}
    </ResponsiveContainer>
  );
};

type ViewMode = "table" | "grid" | "map";
type SortKey = "ip" | "cpu" | "ram" | "storage" | "uptime" | "health" | "packets";
type SortDirection = "asc" | "desc";
type NodeFilter = "all" | "public" | "private";
type HealthFilter = "all" | "public" | "private";
type AlertSeverity = "critical" | "warning";

type AutoRefreshOption = "off" | "30s" | "1m" | "5m";

const GB_IN_BYTES = 1024 ** 3;
const TB_IN_BYTES = 1024 ** 4;

// Helper to get CSS variable value at runtime
const getCssVar = (varName: string, fallback: string = "#000000"): string => {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

// KPI colors using CSS variables
const getKpiColors = () => ({
  public: getCssVar("--accent-aqua", "#06B6D4"),
  private: getCssVar("--kpi-private", "#94A3B8"),
  total: getCssVar("--accent", "#6366F1"),
  cpu: getCssVar("--kpi-excellent", "#10B981"),
  ram: getCssVar("--accent-ram", "#3B82F6"),
  alerts: "#FB7185", // Keep as is, not in CSS vars
  alertOk: getCssVar("--kpi-excellent", "#22C55E"),
});

// Status colors using CSS variables
const getStatusColors = () => ({
  excellent: getCssVar("--kpi-excellent", "#10B981"),
  good: getCssVar("--kpi-good", "#3B82F6"),
  warning: getCssVar("--kpi-warning", "#F59E0B"),
  critical: getCssVar("--kpi-critical", "#EF4444"),
  private: getCssVar("--kpi-private", "#94A3B8"),
});

type HealthTrendKey = "excellent" | "good" | "warning" | "critical";
const createEmptyDistribution = (): Record<HealthTrendKey, number> => ({
  excellent: 0,
  good: 0,
  warning: 0,
  critical: 0,
});

// CPU buckets with dynamic colors
const getCpuBuckets = () => [
  { label: "Idle", min: 0, max: 25, color: getCssVar("--kpi-excellent", "#10B981") },
  { label: "Normal", min: 25, max: 75, color: getCssVar("--kpi-good", "#0EA5E9") },
  { label: "Load", min: 75, max: 101, color: getCssVar("--kpi-warning", "#F97316") },
];

const STORAGE_BUCKETS = [
  { label: "< 250 GB", min: 0, max: 250 * GB_IN_BYTES },
  { label: "250-500 GB", min: 250 * GB_IN_BYTES, max: 500 * GB_IN_BYTES },
  { label: "500 GB - 1 TB", min: 500 * GB_IN_BYTES, max: 1 * TB_IN_BYTES },
  { label: "1 - 1.5 TB", min: 1 * TB_IN_BYTES, max: 1.5 * TB_IN_BYTES },
  { label: "≥ 1.5 TB", min: 1.5 * TB_IN_BYTES, max: Number.POSITIVE_INFINITY },
] as const;

const TOOLTIP_STYLES = `
  .custom-tooltip {
    background: var(--bg-card);
    border: 1px solid var(--border-app);
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 20px 40px rgba(5,9,20,0.35);
    color: var(--text-main);
  }
  .custom-tooltip p {
    margin: 0;
  }
  .recharts-tooltip-wrapper {
    outline: none;
  }
`;

const ToolbarTooltip = ({ label }: { label: string }) => (
  <span
    className="pointer-events-none absolute left-1/2 top-full mt-2 w-max max-w-[260px] -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-app bg-bg-card px-3 py-2 text-[11px] text-text-main opacity-0 shadow-2xl translate-y-1 scale-[0.98] transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100"
    role="tooltip"
  >
    {label}
  </span>
);

const TOOLBAR_BUTTON_BASE =
  "relative group p-2 rounded-lg hover:bg-white/5 transition-colors";

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const expanded =
    sanitized.length === 3
      ? sanitized
        .split("")
        .map((char) => char + char)
        .join("")
      : sanitized;
  const bigint = Number.parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 10 || unitIndex < 2 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const formatBytesToTB = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 TB";
  const tbValue = bytes / TB_IN_BYTES;
  return tbValue >= 10 ? `${tbValue.toFixed(0)} TB` : `${tbValue.toFixed(1)} TB`;
};

// Adaptive formatter: chooses best unit automatically (MB, GB, or TB)
const formatBytesAdaptive = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const GB_IN_BYTES = 1024 ** 3;
  const MB_IN_BYTES = 1024 ** 2;

  if (bytes >= TB_IN_BYTES) {
    const tbValue = bytes / TB_IN_BYTES;
    return tbValue >= 10 ? `${tbValue.toFixed(0)} TB` : `${tbValue.toFixed(1)} TB`;
  }

  if (bytes >= GB_IN_BYTES) {
    const gbValue = bytes / GB_IN_BYTES;
    return gbValue >= 10 ? `${gbValue.toFixed(0)} GB` : `${gbValue.toFixed(1)} GB`;
  }

  if (bytes >= MB_IN_BYTES) {
    const mbValue = bytes / MB_IN_BYTES;
    return mbValue >= 10 ? `${mbValue.toFixed(0)} MB` : `${mbValue.toFixed(1)} MB`;
  }

  // Less than 1 MB - show in KB
  const kbValue = bytes / 1024;
  return kbValue >= 10 ? `${kbValue.toFixed(0)} KB` : `${kbValue.toFixed(1)} KB`;
};

const formatUptime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getStorageBarColors = (percent: number) => {
  const warning = getCssVar("--kpi-warning", "#F97316");
  const critical = getCssVar("--kpi-critical", "#EF4444");
  const good = getCssVar("--kpi-good", "#3B82F6");
  const excellent = getCssVar("--kpi-excellent", "#10B981");

  if (percent >= 90) {
    return { fill: `linear-gradient(90deg, ${warning}, ${critical})`, accent: critical };
  }
  if (percent >= 70) {
    return { fill: `linear-gradient(90deg, #FACC15, ${warning})`, accent: warning };
  }
  if (percent >= 40) {
    return { fill: `linear-gradient(90deg, #22D3EE, ${good})`, accent: good };
  }
  return { fill: `linear-gradient(90deg, #34D399, ${excellent})`, accent: excellent };
};

const getNetworkHealthColor = (score: number) => {
  if (score >= 85) return getCssVar("--kpi-excellent", "#10B981");
  if (score >= 70) return getCssVar("--kpi-good", "#22D3EE");
  if (score >= 50) return getCssVar("--kpi-warning", "#F59E0B");
  return getCssVar("--kpi-critical", "#EF4444");
};

const getNetworkUptimeVisuals = (
  percent: number
): { badge: string; color: string; Icon: LucideIcon } => {
  const kpiColors = getKpiColors();
  const statusColors = getStatusColors();

  if (percent >= 97) {
    return { badge: "Mission ready", color: kpiColors.public, Icon: ShieldCheck };
  }
  if (percent >= 90) {
    return { badge: "Stable mesh", color: statusColors.good, Icon: Radio };
  }
  if (percent >= 80) {
    return { badge: "Monitor closely", color: statusColors.warning, Icon: AlertCircle };
  }
  return { badge: "Critical uptime", color: statusColors.critical, Icon: Zap };
};

const statusBadge = (status: HealthStatus) => {
  switch (status) {
    case "Excellent":
      return "bg-kpi-excellent/10 text-kpi-excellent border border-kpi-excellent/30";
    case "Good":
      return "bg-accent-aqua/10 text-accent-aqua border border-accent-aqua/30";
    case "Warning":
      return "bg-kpi-warning/10 text-kpi-warning border border-kpi-warning/30";
    case "Critical":
      return "bg-kpi-critical/10 text-kpi-critical border border-kpi-critical/40";
    default:
      return "bg-bg-bg2 text-text-soft border border-border-app";
  }
};

const getHealthBadgeStyles = (percentage: number) => {
  if (percentage >= 85) {
    return "bg-kpi-excellent/15 text-kpi-excellent border border-kpi-excellent/30";
  }
  if (percentage >= 60) {
    return "bg-accent-aqua/15 text-accent-aqua border border-accent-aqua/30";
  }
  if (percentage >= 40) {
    return "bg-kpi-warning/15 text-kpi-warning border border-kpi-warning/30";
  }
  return "bg-kpi-critical/15 text-kpi-critical border border-kpi-critical/40";
};

const getHealthLabel = (percentage: number) => {
  if (percentage >= 85) return "Healthy";
  if (percentage >= 60) return "Stable";
  if (percentage >= 40) return "Warning";
  return "Critical";
};

const getSortValue = (pnode: PNode, key: SortKey) => {
  switch (key) {
    case "ip":
      return pnode.ip;
    case "cpu":
      return pnode.stats?.cpu_percent ?? 0;
    case "ram":
      return pnode.stats?.ram_used ?? 0;
    case "storage":
      return pnode.stats?.file_size ?? 0;
    case "uptime":
      return pnode.stats?.uptime ?? 0;
    case "packets":
      return (pnode.stats?.packets_sent ?? 0) + (pnode.stats?.packets_received ?? 0);
    case "health": {
      const status = getHealthStatus(pnode);
      const ordering: Record<HealthStatus, number> = {
        Critical: 0,
        Warning: 1,
        Private: 2,
        Good: 3,
        Excellent: 4,
      };
      return ordering[status];
    }
    default:
      return 0;
  }
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: unknown; color?: string; fill?: string }>;
  label?: unknown;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return (
    <div className="custom-tooltip text-sm">
      <p className="text-[10px] uppercase tracking-[0.35em] text-text-faint mb-2">
        {String(label ?? payload[0]?.name ?? "")}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-text-main">
          <span
            className="w-2.5 h-2.5 rounded-full inline-flex"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="font-mono font-semibold">{String(entry.value ?? "")}</span>
        </div>
      ))}
    </div>
  );
};

export default function Page() {
  const { theme } = useTheme();
  const toast = useToast();
  const isLight = theme === "light";

  const [pnodes, setPnodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const contentSectionRef = useRef<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoRefreshOption, setAutoRefreshOption] = useState<AutoRefreshOption>("1m");
  const [defaultView, setDefaultView] = useState<ViewMode>("table");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [isHealthMenuOpen, setIsHealthMenuOpen] = useState(false);
  const healthMenuRef = useRef<HTMLDivElement | null>(null);
  const lastHealthSnapshot = useRef<{ filter: HealthFilter; percent: Record<HealthTrendKey, number> } | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [networkHealthHistory, setNetworkHealthHistory] = useState<number[]>([]);
  const [healthDelta, setHealthDelta] = useState<Record<HealthTrendKey, number>>(createEmptyDistribution());
  const [yesterdayScore, setYesterdayScore] = useState<number | null>(null);
  const [lastWeekScore, setLastWeekScore] = useState<number | null>(null);


  const loadData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const response = await fetch("/api/pnodes?limit=200", { cache: "no-store" });
        if (!response.ok) {
          const errorText = response.status === 500
            ? "Server error. Please try again later."
            : `Failed to fetch nodes (${response.status})`;
          throw new Error(errorText);
        }
        const payload = await response.json();
        if (payload.data && Array.isArray(payload.data)) {
          setPnodes(payload.data);
          setLastUpdate(new Date());
          if (isManual) {
            toast.success(`Loaded ${payload.data.length} nodes`);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load nodes";
        console.error("Error loading pnodes:", error);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
        if (isManual) {
          setRefreshing(false);
        }
      }
    },
    // toast est stable, pas besoin de le mettre dans les dépendances
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadYesterdayScore = useCallback(async () => {
    try {
      const response = await fetch("/api/network-health/yesterday", { cache: "no-store" });
      if (!response.ok) {
        // Silent failure for historical data - not critical
        console.warn("Failed to fetch yesterday's network health score");
        return;
      }
      const payload = await response.json();
      if (payload.networkHealthScore !== null && payload.networkHealthScore !== undefined) {
        console.log("[Network Health] Yesterday score loaded:", payload.networkHealthScore);
        setYesterdayScore(payload.networkHealthScore);
      } else {
        console.log("[Network Health] No yesterday score available (null)");
      }
    } catch (error) {
      // Silent failure for historical data - not critical
      console.error("Error loading yesterday's network health score:", error);
    }
  }, []);

  const loadLastWeekScore = useCallback(async () => {
    try {
      const response = await fetch("/api/network-health/last-week", { cache: "no-store" });
      if (!response.ok) {
        // Silent failure for historical data - not critical
        console.warn("Failed to fetch last week's network health score");
        return;
      }
      const payload = await response.json();
      if (payload.networkHealthScore !== null && payload.networkHealthScore !== undefined) {
        console.log("[Network Health] Last week score loaded:", payload.networkHealthScore);
        setLastWeekScore(payload.networkHealthScore);
      } else {
        console.log("[Network Health] No last week score available (null)");
      }
    } catch (error) {
      // Silent failure for historical data - not critical
      console.error("Error loading last week's network health score:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadYesterdayScore();
    loadLastWeekScore();
  }, [loadData, loadYesterdayScore, loadLastWeekScore]);

  useEffect(() => {
    const ms =
      autoRefreshOption === "off"
        ? 0
        : autoRefreshOption === "30s"
          ? 30_000
          : autoRefreshOption === "1m"
            ? 60_000
            : 300_000;
    if (ms <= 0) return;
    const interval = setInterval(() => loadData(), ms);
    return () => clearInterval(interval);
  }, [autoRefreshOption, loadData]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timeout = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(timeout);
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isHealthMenuOpen &&
        healthMenuRef.current &&
        !healthMenuRef.current.contains(event.target as Node)
      ) {
        setIsHealthMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHealthMenuOpen]);


  const getTimeAgo = useCallback(() => {
    if (!lastUpdate) return "";
    const seconds = Math.floor((currentTime - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [currentTime, lastUpdate]);

  const activeNodes = useMemo(
    () => pnodes.filter((pnode) => pnode.status === "active"),
    [pnodes]
  );
  const publicCount = activeNodes.length;
  const privateCount = useMemo(
    () => pnodes.filter((pnode) => pnode.status === "gossip_only").length,
    [pnodes]
  );

  // Data integrity validation
  const dataIntegrity = useMemo(() => {
    const totalNodes = pnodes.length;
    const sumCounts = publicCount + privateCount;
    const isValid = sumCounts === totalNodes;

    // Find nodes with unexpected status
    const unexpectedNodes = pnodes.filter(
      (node) => node.status !== "active" && node.status !== "gossip_only"
    );

    return {
      isValid,
      totalNodes,
      publicCount,
      privateCount,
      sumCounts,
      discrepancy: totalNodes - sumCounts,
      unexpectedNodes,
    };
  }, [pnodes, publicCount, privateCount]);

  const filteredAndSortedPNodes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = pnodes.filter((pnode) => {
      if (query.length === 0) {
        const matchesFilter =
          nodeFilter === "all"
            ? true
            : nodeFilter === "public"
              ? pnode.status === "active"
              : pnode.status === "gossip_only";
        return matchesFilter;
      }

      const healthLabel = getHealthStatus(pnode).toLowerCase();
      const versionLabel = (pnode.version ?? "").toLowerCase();
      const rawStatusLabel = (pnode.status ?? "").toLowerCase();
      const matchesSearch =
        pnode.ip.toLowerCase().includes(query) ||
        versionLabel.includes(query) ||
        healthLabel.includes(query) ||
        rawStatusLabel.includes(query);
      const matchesFilter =
        nodeFilter === "all"
          ? true
          : nodeFilter === "public"
            ? pnode.status === "active"
            : pnode.status === "gossip_only";
      return matchesSearch && matchesFilter;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }
      const diff = Number(aValue) - Number(bValue);
      return sortDirection === "asc" ? diff : -diff;
    });

    return sorted;
  }, [pnodes, searchTerm, nodeFilter, sortKey, sortDirection]);

  const handleSort = useCallback(
    (key: SortKey | string) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key as SortKey);
        setSortDirection("asc");
      }
    },
    [sortKey]
  );

  const alerts = useMemo(() => {
    const generated: { type: string; message: string; ip: string; severity: AlertSeverity }[] = [];
    const pushAlert = (
      ip: string,
      severity: AlertSeverity,
      type: string,
      message: string
    ) => {
      generated.push({ type, message, ip, severity });
    };

    pnodes.forEach((pnode) => {
      // Les nœuds "gossip_only" ont des stats de fallback non fiables (et peuvent créer des faux "critical").
      // Les alertes doivent refléter uniquement les nœuds actifs.
      if (pnode.status !== "active") return;

      const stats = pnode.stats;
      if (!stats) return;

      const cpuPercent = Number.isFinite(stats.cpu_percent) ? stats.cpu_percent : 0;
      if (cpuPercent >= 90) {
        pushAlert(pnode.ip, "critical", "CPU Overload", `Load at ${cpuPercent.toFixed(1)}%`);
      } else if (cpuPercent >= 75) {
        pushAlert(pnode.ip, "warning", "CPU Pressure", `Load at ${cpuPercent.toFixed(1)}%`);
      }

      const ramTotal = Number.isFinite(stats.ram_total) ? stats.ram_total : 0;
      const ramUsed = Number.isFinite(stats.ram_used) ? stats.ram_used : 0;
      if (ramTotal > 0) {
        const ramPercent = (ramUsed / ramTotal) * 100;
        if (ramPercent >= 90) {
          pushAlert(pnode.ip, "critical", "RAM Saturation", `${ramPercent.toFixed(1)}% utilized`);
        } else if (ramPercent >= 75) {
          pushAlert(pnode.ip, "warning", "RAM Pressure", `${ramPercent.toFixed(1)}% utilized`);
        }
      }

      // API v0.7 mapping:
      // - storage_committed => stats.file_size
      // - storage_used => stats.total_bytes
      const committedBytes = Number.isFinite(stats.file_size) ? (stats.file_size ?? 0) : 0;
      const usedBytes = Number.isFinite(stats.total_bytes) ? (stats.total_bytes ?? 0) : 0;
      if (committedBytes > 0) {
        const storagePercent = (usedBytes / committedBytes) * 100;
        if (storagePercent >= 95) {
          pushAlert(pnode.ip, "critical", "Storage Full", `${storagePercent.toFixed(1)}% utilized`);
        } else if (storagePercent >= 80) {
          pushAlert(pnode.ip, "warning", "Storage High", `${storagePercent.toFixed(1)}% utilized`);
        }
      }

      const performanceScore = calculateNodeScore(pnode);
      if (performanceScore > 0) {
        if (performanceScore < 50) {
          pushAlert(pnode.ip, "critical", "Low Performance Score", `Score ${performanceScore}/100`);
        } else if (performanceScore < 70) {
          pushAlert(pnode.ip, "warning", "Degraded Performance", `Score ${performanceScore}/100`);
        }
      }
    });

    return generated;
  }, [pnodes]);

  const criticalCount = useMemo(
    () => new Set(alerts.filter((alert) => alert.severity === "critical").map((alert) => alert.ip)).size,
    [alerts]
  );
  const warningCount = useMemo(
    () => new Set(alerts.filter((alert) => alert.severity === "warning").map((alert) => alert.ip)).size,
    [alerts]
  );

  const networkHealthScore = useMemo(() => {
    if (activeNodes.length === 0) return 0;
    const totalScore = activeNodes.reduce((sum, p) => sum + calculateNodeScore(p), 0);
    return Math.round(totalScore / activeNodes.length);
  }, [activeNodes]);
  const lastUpdateEpoch = lastUpdate?.getTime() ?? 0;

  useEffect(() => {
    if (activeNodes.length === 0) {
      setNetworkHealthHistory([]);
      return;
    }
    if (lastUpdateEpoch === 0) return;
    setNetworkHealthHistory((prev) => {
      // Pre-fill history on first data point for immediate graph visibility
      if (prev.length === 0) {
        return Array(8).fill(networkHealthScore);
      }
      const next = [...prev, networkHealthScore];
      return next.slice(-24);
    });
  }, [activeNodes.length, lastUpdateEpoch, networkHealthScore]);

  const networkHealthInsights = useMemo(() => {
    const score = networkHealthScore;
    const sparklineValues = networkHealthHistory.length > 0 ? networkHealthHistory : [score];

    // Calculate delta vs yesterday: use yesterdayScore if available, otherwise fall back to last refresh comparison
    const deltaYesterday = yesterdayScore !== null
      ? score - yesterdayScore
      : (sparklineValues.length >= 2
        ? sparklineValues[sparklineValues.length - 1] - sparklineValues[sparklineValues.length - 2]
        : 0);

    // Calculate delta vs last week
    const deltaLastWeek = lastWeekScore !== null
      ? score - lastWeekScore
      : null;

    // Debug log to understand what's happening
    if (yesterdayScore !== null) {
      console.log(`[Network Health] Current: ${score}, Yesterday: ${yesterdayScore}, Delta: ${deltaYesterday}`);
    }
    if (lastWeekScore !== null) {
      console.log(`[Network Health] Current: ${score}, Last Week: ${lastWeekScore}, Delta: ${deltaLastWeek}`);
    }

    const color = getNetworkHealthColor(score);
    const trendIcon = deltaYesterday > 0 ? "▲" : deltaYesterday < 0 ? "▼" : "→";
    const trendColor = deltaYesterday > 0 ? "text-green-400" : deltaYesterday < 0 ? "text-red-400" : "text-text-soft";
    const svgWidth = 120;
    const svgHeight = 36;
    const sampleCount = Math.max(1, sparklineValues.length);
    const points = sparklineValues
      .map((value, index) => {
        const x = sampleCount === 1 ? svgWidth / 2 : (index / (sampleCount - 1)) * svgWidth;
        const y = svgHeight - (value / 100) * svgHeight;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    const areaPoints = `${points} ${svgWidth},${svgHeight} 0,${svgHeight}`;

    return {
      score,
      delta: deltaYesterday, // Keep 'delta' for backward compatibility (vs yesterday)
      deltaYesterday,
      deltaLastWeek,
      color,
      trendIcon: deltaYesterday > 0 ? "▲" : deltaYesterday < 0 ? "▼" : "→",
      trendColor: deltaYesterday > 0 ? "text-green-400" : deltaYesterday < 0 ? "text-red-400" : "text-text-soft",
      svgWidth,
      svgHeight,
      sparklinePoints: points,
      sparklineAreaPoints: areaPoints,
      sparklineFill: hexToRgba(color, 0.15),
    };
  }, [networkHealthScore, networkHealthHistory, yesterdayScore, lastWeekScore, theme]); // Add theme dependency

  const storageCapacityStats = useMemo(() => {
    let totalCommitted = 0;
    let totalUsed = 0;

    pnodes.forEach((pnode) => {
      if (pnode.status !== "active") return;
      const committed = pnode.stats?.file_size ?? 0;
      const used = pnode.stats?.total_bytes ?? 0;
      totalCommitted += Number.isFinite(committed) ? committed : 0;
      totalUsed += Number.isFinite(used) ? used : 0;
    });

    totalCommitted = Math.max(totalCommitted, 0);
    totalUsed = Math.max(Math.min(totalUsed, totalCommitted || totalUsed), 0);
    const available = Math.max(totalCommitted - totalUsed, 0);
    const percent = totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0;
    const percentClamped = Math.min(100, percent);

    return {
      totalCommitted,
      totalUsed,
      available,
      percent: percentClamped,
      formattedUsed: formatBytesAdaptive(totalUsed),
      formattedTotal: formatBytesToTB(totalCommitted),
      formattedAvailable: formatBytesAdaptive(available),
      availabilityLabel: percentClamped > 80 ? "remaining" : "available",
    };
  }, [pnodes]);

  const storageBarColors = useMemo(
    () => getStorageBarColors(storageCapacityStats.percent),
    [storageCapacityStats.percent, theme] // Add theme dependency
  );

  const avgCpuUsage = useMemo(() => {
    const activeCpuNodes = pnodes.filter((pnode) => pnode.status === "active");
    if (activeCpuNodes.length === 0) {
      return { percent: 0, nodeCount: 0 };
    }

    const totalPercent = activeCpuNodes.reduce((sum, pnode) => {
      const cpuPercent = pnode.stats?.cpu_percent ?? 0;
      const safeValue = Number.isFinite(cpuPercent) ? cpuPercent : 0;
      return sum + Math.max(0, safeValue);
    }, 0);

    const percent = Math.min(100, totalPercent / activeCpuNodes.length);
    return {
      percent,
      nodeCount: activeCpuNodes.length,
    };
  }, [pnodes]);

  const avgRamUsage = useMemo(() => {
    const activeRamNodes = pnodes.filter((pnode) => {
      const totalRam = pnode.stats?.ram_total ?? 0;
      return pnode.status === "active" && Number.isFinite(totalRam) && totalRam > 0;
    });

    if (activeRamNodes.length === 0) {
      return {
        usedAvg: 0,
        totalAvg: 0,
        ratio: 0,
        nodeCount: 0,
        formattedUsed: "-",
        formattedTotal: "-",
      };
    }

    const usedAvg =
      activeRamNodes.reduce(
        (sum, pnode) => sum + Math.max(0, pnode.stats?.ram_used ?? 0),
        0
      ) /
      activeRamNodes.length;
    const totalAvg =
      activeRamNodes.reduce(
        (sum, pnode) => sum + Math.max(0, pnode.stats?.ram_total ?? 0),
        0
      ) /
      activeRamNodes.length;
    const ratio = totalAvg > 0 ? Math.min(100, (usedAvg / totalAvg) * 100) : 0;

    return {
      usedAvg,
      totalAvg,
      ratio,
      nodeCount: activeRamNodes.length,
      formattedUsed: formatBytes(usedAvg),
      formattedTotal: formatBytes(totalAvg),
    };
  }, [pnodes]);

  const networkUptimeStats = useMemo(() => {
    const publicOnline = pnodes.filter(
      (pnode) => getHealthStatus(pnode) !== "Private" && pnode.status === "active"
    ).length;
    const publicTotal = publicCount || 0;
    const percentRaw = publicTotal > 0 ? (publicOnline / publicTotal) * 100 : 0;
    const percent = Number(percentRaw.toFixed(1));
    const visuals = getNetworkUptimeVisuals(percent);
    return {
      percent,
      publicOnline,
      publicTotal,
      ...visuals,
    };
  }, [pnodes, publicCount, theme]); // Add theme dependency

  const UptimeIcon = networkUptimeStats.Icon;

  // Memoize colors to update when theme changes
  const kpiColorsMemo = useMemo(() => getKpiColors(), [theme]);
  const statusColorsMemo = useMemo(() => getStatusColors(), [theme]);

  const storageDistribution = useMemo(
    () =>
      STORAGE_BUCKETS.map((bucket) => {
        const count = activeNodes.filter((pnode) => {
          const committed = pnode.stats?.file_size ?? 0;
          return committed >= bucket.min && committed < bucket.max;
        }).length;
        return { range: bucket.label, count };
      }),
    [activeNodes]
  );

  const cpuDistribution = useMemo(
    () => {
      const buckets = getCpuBuckets();
      return buckets.map((bucket) => ({
        range: bucket.label,
        count: activeNodes.filter((pnode) => {
          const cpuPercent = pnode.stats?.cpu_percent ?? 0;
          const safeValue = Number.isFinite(cpuPercent) ? cpuPercent : 0;
          return safeValue >= bucket.min && safeValue < bucket.max;
        }).length,
        color: bucket.color,
      }));
    },
    [activeNodes, theme] // Add theme dependency to recalculate colors on theme change
  );

  const filteredHealthNodes = useMemo(() => {
    if (healthFilter === "all") return pnodes;
    if (healthFilter === "public") {
      return pnodes.filter((p) => p.status === "active");
    }
    return pnodes.filter((p) => p.status === "gossip_only");
  }, [pnodes, healthFilter]);

  const healthCounts = useMemo(() => {
    return filteredHealthNodes.reduce(
      (acc, pnode) => {
        const status = getHealthStatus(pnode);
        switch (status) {
          case "Excellent":
            acc.excellent += 1;
            acc.total += 1;
            break;
          case "Good":
            acc.good += 1;
            acc.total += 1;
            break;
          case "Warning":
            acc.warning += 1;
            acc.total += 1;
            break;
          case "Critical":
            acc.critical += 1;
            acc.total += 1;
            break;
          default:
            break;
        }
        return acc;
      },
      { excellent: 0, good: 0, warning: 0, critical: 0, total: 0 }
    );
  }, [filteredHealthNodes]);

  const healthPercent = useMemo(() => {
    const totalActive =
      healthCounts.excellent +
      healthCounts.good +
      healthCounts.warning +
      healthCounts.critical;

    const toPercent = (value: number) =>
      totalActive > 0 ? Math.round((value / totalActive) * 100) : 0;

    return {
      excellent: toPercent(healthCounts.excellent),
      good: toPercent(healthCounts.good),
      warning: toPercent(healthCounts.warning),
      critical: toPercent(healthCounts.critical),
    };
  }, [healthCounts]);

  useEffect(() => {
    const currentPercent: Record<HealthTrendKey, number> = {
      excellent: healthPercent.excellent ?? 0,
      good: healthPercent.good ?? 0,
      warning: healthPercent.warning ?? 0,
      critical: healthPercent.critical ?? 0,
    };

    const previous = lastHealthSnapshot.current;
    if (!previous || previous.filter !== healthFilter) {
      setHealthDelta(createEmptyDistribution());
    } else {
      setHealthDelta({
        excellent: currentPercent.excellent - previous.percent.excellent,
        good: currentPercent.good - previous.percent.good,
        warning: currentPercent.warning - previous.percent.warning,
        critical: currentPercent.critical - previous.percent.critical,
      });
    }

    lastHealthSnapshot.current = {
      filter: healthFilter,
      percent: currentPercent,
    };
  }, [healthFilter, healthPercent]);

  const healthTrendData = useMemo(
    () => {
      const statusColors = getStatusColors();
      return [
        { key: "excellent", label: "EXCELLENT", color: statusColors.excellent },
        { key: "good", label: "GOOD", color: statusColors.good },
        { key: "warning", label: "WARNING", color: statusColors.warning },
        { key: "critical", label: "CRITICAL", color: statusColors.critical },
      ].map((item) => ({
        ...item,
        percentage: healthPercent[item.key as keyof typeof healthPercent] ?? 0,
        count: healthCounts[item.key as keyof typeof healthCounts] ?? 0,
        delta: healthDelta[item.key as HealthTrendKey] ?? 0,
      }));
    },
    [healthCounts, healthPercent, healthDelta, theme] // Add theme dependency
  );

  const healthInsight = useMemo(() => {
    const denominator = Math.max(healthCounts.total, 1);
    const excellentRatio = Math.round((healthCounts.excellent / denominator) * 100);
    if (healthFilter === "public") {
      return { label: "public p-nodes", percent: excellentRatio };
    }
    if (healthFilter === "private") {
      return { label: "private p-nodes", percent: excellentRatio };
    }
    return { label: "all p-nodes", percent: excellentRatio };
  }, [healthCounts, healthFilter]);

  const versionOverview = useMemo(() => computeVersionOverview(pnodes), [pnodes]);
  const latestVersionPercentage = versionOverview.latestPercentage;

  const versionChart = useMemo(
    () => ({
      entries: versionOverview.buckets.map((bucket) => ({
        id: bucket.id,
        label: bucket.shortLabel ?? bucket.label,
        count: bucket.count,
        percentage: bucket.percentage,
        color: bucket.color,
      })),
      latestPercentLabel: versionOverview.latestPercentage.toFixed(0),
      message: versionOverview.health.description,
    }),
    [versionOverview]
  );

  const refreshData = useCallback(() => loadData(true), [loadData]);

  const scrollToContent = useCallback(() => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      contentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    if (typeof window === "undefined") return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const exportRows = useMemo(() => {
    return pnodes.map((pnode) => {
      const stats = pnode.stats ?? ({} as PNode["stats"]);
      return {
        ip: pnode.ip,
        visibility: pnode.status,
        health: getHealthStatus(pnode),
        version: pnode.version ?? "",
        cpu_percent: stats.cpu_percent ?? null,
        ram_used: stats.ram_used ?? null,
        ram_total: stats.ram_total ?? null,
        file_size: stats.file_size ?? null,
        total_bytes: stats.total_bytes ?? null,
        uptime: stats.uptime ?? null,
        packets_sent: stats.packets_sent ?? null,
        packets_received: stats.packets_received ?? null,
      };
    });
  }, [pnodes]);

  const exportData = useCallback(() => {
    if (typeof window === "undefined" || pnodes.length === 0) return;
    const payload = JSON.stringify(pnodes, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    downloadBlob(blob, `xandeum-pnodes-${new Date().toISOString()}.json`);
  }, [downloadBlob, pnodes]);

  const exportCsv = useCallback(() => {
    if (typeof window === "undefined" || exportRows.length === 0) return;
    const headers = Object.keys(exportRows[0] ?? {});
    const escape = (value: unknown) => {
      const raw = value == null ? "" : String(value);
      const needsQuotes = /[\n\r,"]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const lines = [headers.join(",")].concat(
      exportRows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `xandeum-pnodes-${new Date().toISOString()}.csv`);
  }, [downloadBlob, exportRows]);

  const exportExcel = useCallback(() => {
    if (typeof window === "undefined" || exportRows.length === 0) return;
    const headers = Object.keys(exportRows[0] ?? {});
    const escapeHtml = (value: unknown) => {
      const raw = value == null ? "" : String(value);
      return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
    };
    const thead = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
    const tbody = exportRows
      .map((row) => {
        const cells = headers
          .map((h) => `<td>${escapeHtml((row as Record<string, unknown>)[h])}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    downloadBlob(blob, `xandeum-pnodes-${new Date().toISOString()}.xls`);
  }, [downloadBlob, exportRows]);
  /* -------------------------------------------------- */
  /*                     RENDER                         */
  /* -------------------------------------------------- */

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <main className="min-h-screen bg-bg-app text-text-main pb-20 theme-transition flex flex-col space-y-8">
        <style>{TOOLTIP_STYLES}</style>
        {/* HERO */}
        <EnhancedHero
          criticalCount={criticalCount}
          onAlertsClick={() => setIsAlertOpen(true)}
        />

        {/* KPI + HEALTH + CHARTS */}
        <section className="max-w-7xl mx-auto px-6 space-y-6">
          {/* KPI CARDS */}
          <KpiCards
            publicCount={publicCount}
            privateCount={privateCount}
            totalNodes={pnodes.length}
            networkHealthInsights={networkHealthInsights}
            UptimeIcon={ShieldCheck}
            networkUptimeStats={networkUptimeStats}
            storageCapacityStats={storageCapacityStats}
            storageBarColors={storageBarColors}
            avgCpuUsage={avgCpuUsage}
            avgRamUsage={avgRamUsage}
            alerts={alerts}
            criticalCount={criticalCount}
            warningCount={warningCount}
            KPI_COLORS={kpiColorsMemo}
            STATUS_COLORS={statusColorsMemo}
            hexToRgba={hexToRgba}
          />

          {/* DATA INTEGRITY WARNING */}
          {!dataIntegrity.isValid && (
            <div className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border-2 border-orange-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-orange-500 mb-1">
                    ⚠️ Data Integrity Warning
                  </h3>
                  <p className="text-xs text-text-main mb-2">
                    Node count mismatch detected: <span className="font-mono font-semibold text-orange-400">
                      Public ({dataIntegrity.publicCount}) + Private ({dataIntegrity.privateCount}) = {dataIntegrity.sumCounts}
                    </span> but total is <span className="font-mono font-semibold text-orange-400">{dataIntegrity.totalNodes}</span>
                    {dataIntegrity.discrepancy !== 0 && (
                      <span className="text-orange-400"> (discrepancy: {dataIntegrity.discrepancy > 0 ? '+' : ''}{dataIntegrity.discrepancy})</span>
                    )}
                  </p>
                  {dataIntegrity.unexpectedNodes.length > 0 && (
                    <details className="text-xs text-text-soft">
                      <summary className="cursor-pointer hover:text-text-main transition-colors">
                        Found {dataIntegrity.unexpectedNodes.length} node(s) with unexpected status
                      </summary>
                      <ul className="mt-2 space-y-1 ml-4 font-mono">
                        {dataIntegrity.unexpectedNodes.slice(0, 5).map((node) => (
                          <li key={node.ip}>
                            {node.ip} → status: &quot;{node.status}&quot;
                          </li>
                        ))}
                        {dataIntegrity.unexpectedNodes.length > 5 && (
                          <li className="text-text-faint">
                            ... and {dataIntegrity.unexpectedNodes.length - 5} more
                          </li>
                        )}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HEALTH DISTRIBUTION */}
          <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-text-main">
                Health Distribution
              </h2>
              <div className="relative" ref={healthMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsHealthMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-app text-sm text-text-main shadow-[0_10px_30px_rgba(5,9,20,0.35)] theme-transition"
                  style={{
                    backgroundColor: isLight ? "rgba(247,249,255,0.98)" : "rgba(5,9,24,0.97)",
                    borderColor: isLight ? "rgba(15,23,42,0.12)" : "rgba(226,232,240,0.08)",
                  }}
                >
                  <span>
                    {healthFilter === "all"
                      ? `All p-nodes (${pnodes.length})`
                      : healthFilter === "public"
                        ? `Public only (${publicCount})`
                        : `Private only (${privateCount})`}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-soft transition-transform ${isHealthMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isHealthMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-xl border border-border-app shadow-[0_30px_60px_rgba(2,6,23,0.65)] z-30 overflow-hidden"
                    style={{
                      backgroundColor: isLight ? "rgba(247,249,255,0.99)" : "rgba(4,8,22,0.99)",
                      borderColor: isLight ? "rgba(15,23,42,0.12)" : "rgba(226,232,240,0.08)",
                    }}
                  >
                    {(
                      [
                        { key: "all", label: "All p-nodes", count: pnodes.length },
                        { key: "public", label: "Public only", count: publicCount },
                        { key: "private", label: "Private only", count: privateCount },
                      ] as const
                    ).map((option) => {
                      const active = option.key === healthFilter;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setHealthFilter(option.key);
                            setIsHealthMenuOpen(false);
                          }}
                          className={clsx(
                            "w-full px-4 py-4 text-sm flex items-center justify-between",
                            active
                              ? "bg-accent-aqua/15 text-accent-aqua"
                              : "text-text-main hover:bg-bg-bg2"
                          )}
                        >
                          <span>{`${option.label} (${option.count})`}</span>
                          {active && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <style>{`
              .recharts-tooltip {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                outline: none !important;
              }
              .recharts-default-tooltip {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
              }
            `}</style>
            <div className="space-y-4">
              {healthTrendData.map((item) => {
                const isPositive = item.delta > 0;
                const isNegative = item.delta < 0;
                const trendIcon = isPositive ? "▲" : isNegative ? "▼" : "→";
                const trendLabel = item.delta !== 0 ? `${Math.abs(item.delta)}%` : "stable";

                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-soft uppercase tracking-wider">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-text-main font-mono">
                          {item.count} ({item.percentage}%)
                        </span>
                        <span
                          className={clsx(
                            "flex items-center gap-2 font-semibold",
                            isPositive
                              ? "text-green-400"
                              : isNegative
                                ? "text-red-400"
                                : "text-text-faint"
                          )}
                        >
                          <span>{trendIcon}</span>
                          <span>{trendLabel}</span>
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-bg-bg2 rounded-full overflow-hidden h-2 border border-border-app">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-faint">
              <Lightbulb className="w-4 h-4" />
              <span>
                {healthInsight.percent}% of {healthInsight.label} in excellent health
              </span>
            </div>
          </div>

          {/* CHARTS ROW 1x4 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* CPU LOAD */}
            <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4" style={{ color: 'var(--kpi-excellent)' }} strokeWidth={2.5} />
                <h3 className="text-xs font-semibold" style={{ color: 'var(--kpi-excellent)' }}>CPU Load</h3>
              </div>
              <div className="h-[260px] w-full min-w-0">
                <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={cpuDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                    <XAxis dataKey="range" stroke="var(--text-soft)" fontSize={11} />
                    <YAxis stroke="var(--text-soft)" fontSize={11} />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.08)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {cpuDistribution.map((item, idx) => (
                        <Cell key={idx} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* STORAGE DISTRIBUTION */}
            <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4" style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
                <h3 className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Storage</h3>
              </div>
              <div className="h-[260px] w-full min-w-0">
                <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    data={storageDistribution}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                    <XAxis
                      dataKey="range"
                      stroke="var(--text-soft)"
                      fontSize={11}
                      label={{ value: "Storage Capacity", position: "insideBottom", offset: -10 }}
                    />
                    <YAxis
                      stroke="var(--text-soft)"
                      fontSize={11}
                      label={{ value: "Nodes", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.08)" }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* NETWORK VERSIONS */}
            <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" style={{ color: 'var(--kpi-warning)' }} strokeWidth={2.5} />
                  <h3 className="text-xs font-semibold" style={{ color: 'var(--kpi-warning)' }}>Network Versions</h3>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getHealthBadgeStyles(latestVersionPercentage)}`}>
                  {getHealthLabel(latestVersionPercentage)}
                </div>
              </div>
              <div className="h-[180px] w-full min-w-0 relative mb-4">
                {versionChart.entries.length > 0 ? (
                  <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={versionChart.entries}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {versionChart.entries.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            stroke="var(--bg-bg)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </SafeResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-soft text-sm">
                    No version data available
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-text-main">{versionChart.latestPercentLabel}%</p>
                    <p className="text-[10px] text-text-faint uppercase tracking-wider">Latest</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {versionChart.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-text-soft">{entry.label}</span>
                    </div>
                    <span className="font-mono font-bold text-text-main">
                      {entry.count} | {entry.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-text-soft text-center mt-4 tracking-wide uppercase">
                {versionChart.message}
              </p>
            </div>

            {/* TOP PERFORMERS */}
            <TopPerformersChart nodes={pnodes} />
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="w-full bg-bg-card border border-border-app rounded-xl px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between theme-transition">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className={TOOLBAR_BUTTON_BASE}
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-text-soft" />
                <ToolbarTooltip label="Search nodes (IP, version, status)" />
              </button>

              {/* Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterMenuOpen((prev) => !prev)}
                  className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1")}
                  aria-label="Filter"
                >
                  <Eye className="w-5 h-5 text-text-soft" />
                  <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", filterMenuOpen ? "rotate-180" : "rotate-0")} />
                  <ToolbarTooltip label="Filter nodes by visibility" />
                </button>

                {filterMenuOpen && (
                  <div className="absolute left-0 mt-3 w-56 rounded-xl border border-border-app bg-bg-card shadow-2xl z-40 overflow-hidden">
                    {(
                      [
                        { key: "all" as const, label: `All (${pnodes.length})` },
                        { key: "public" as const, label: `Public (${publicCount})` },
                        { key: "private" as const, label: `Private (${privateCount})` },
                      ] satisfies Array<{ key: NodeFilter; label: string }>
                    ).map((option) => {
                      const isActive = option.key === nodeFilter;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setNodeFilter(option.key);
                            setFilterMenuOpen(false);
                          }}
                          className={clsx(
                            "w-full px-4 py-3 text-sm flex items-center justify-between transition-colors",
                            isActive
                              ? "bg-accent-aqua/15 text-accent-aqua"
                              : "text-text-main hover:bg-bg-bg2"
                          )}
                        >
                          <span>{option.label}</span>
                          {isActive && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View modes */}
              <button
                type="button"
                onClick={() => {
                  setFilterMenuOpen(false);
                  setExportMenuOpen(false);
                  setViewMode("table");
                  scrollToContent();
                }}
                className={clsx(
                  TOOLBAR_BUTTON_BASE,
                  viewMode === "table" ? "bg-cyan-500/20 text-cyan-400" : "text-text-soft"
                )}
                aria-label="Table View"
                aria-pressed={viewMode === "table"}
              >
                <List className="w-5 h-5" />
                <ToolbarTooltip label="Table View" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMenuOpen(false);
                  setExportMenuOpen(false);
                  setViewMode("grid");
                  scrollToContent();
                }}
                className={clsx(
                  TOOLBAR_BUTTON_BASE,
                  viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-text-soft"
                )}
                aria-label="Grid View"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="w-5 h-5" />
                <ToolbarTooltip label="Grid View" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMenuOpen(false);
                  setExportMenuOpen(false);
                  setViewMode("map");
                  scrollToContent();
                }}
                className={clsx(
                  TOOLBAR_BUTTON_BASE,
                  viewMode === "map" ? "bg-cyan-500/20 text-cyan-400" : "text-text-soft"
                )}
                aria-label="Map View"
                aria-pressed={viewMode === "map"}
              >
                <MapPin className="w-5 h-5" />
                <ToolbarTooltip label="Map View" />
              </button>

              <div className="h-6 w-px bg-border-app mx-1" />

              {/* Export */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1", pnodes.length === 0 && "opacity-50 pointer-events-none")}
                  aria-label="Export"
                >
                  <Download className="w-5 h-5 text-text-soft" />
                  <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", exportMenuOpen ? "rotate-180" : "rotate-0")} />
                  <ToolbarTooltip label="Export data" />
                </button>
                {exportMenuOpen && (
                  <div className="absolute left-0 mt-3 w-48 rounded-xl border border-border-app bg-bg-card shadow-2xl z-40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        exportData();
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportCsv();
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportExcel();
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                    >
                      Excel
                    </button>
                  </div>
                )}
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={refreshData}
                className={TOOLBAR_BUTTON_BASE}
                aria-label="Refresh"
              >
                <RefreshCw className={clsx("w-5 h-5 text-text-soft", refreshing ? "animate-spin" : "")} />
                <ToolbarTooltip label="Refresh data" />
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  setFilterMenuOpen(false);
                  setExportMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className={TOOLBAR_BUTTON_BASE}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-text-soft" />
                <ToolbarTooltip label="Dashboard settings" />
              </button>
            </div>

            {/* Live status */}
            <div className="flex items-center gap-2">
              {loading || refreshing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-text-soft" />
                  <span className="text-xs text-text-soft font-mono">Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-text-soft font-mono">{getTimeAgo() || "—"}</span>
                </>
              )}
            </div>
          </div>
        </section>

        {(filterMenuOpen || exportMenuOpen) && (
          <div
            className="fixed inset-0 z-30 bg-[#050914]"
            onClick={() => {
              setFilterMenuOpen(false);
              setExportMenuOpen(false);
            }}
          />
        )}

        {/* CONTENT (TABLE / GRID / MAP) */}
        <section ref={contentSectionRef} className="max-w-7xl mx-auto px-6 pb-24">
          {loading ? (
            <div className="text-center py-32">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00D4AA]" />
              <p className="text-gray-400 mt-6 text-lg animate-pulse">
                Scanning Xandeum Network...
              </p>
            </div>
          ) : filteredAndSortedPNodes.length === 0 ? (
            <div className="text-center py-20 bg-bg-card rounded-xl border border-border-app">
              <p className="text-text-main">No pNodes match your filters.</p>
            </div>
          ) : (
            <>
              {viewMode === "map" && (
                <ClientErrorBoundary
                  fallback={({ error, reset }) => (
                    <div className="h-[650px] w-full rounded-xl border border-border-app kpi-card flex flex-col items-center justify-center gap-3 text-text-soft theme-transition">
                      <p className="text-xs uppercase tracking-[0.35em]">Map failed to render</p>
                      <p className="text-[11px] font-mono text-text-faint max-w-[820px] px-6 text-center wrap-break-word">
                        {error.message}
                      </p>
                      <button
                        type="button"
                        onClick={reset}
                        className="mt-2 px-4 py-2 rounded-lg border border-border-app bg-bg-bg text-text-main hover:bg-bg-bg2 transition-colors theme-transition text-xs uppercase tracking-[0.25em]"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                >
                  <NodesMap nodes={filteredAndSortedPNodes} />
                </ClientErrorBoundary>
              )}

              {viewMode === "table" && (
                <PNodeTable
                  data={filteredAndSortedPNodes}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}

              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedPNodes.map((pnode) => {
                    const status = getHealthStatus(pnode);
                    const statusBorderClass =
                      status === "Excellent"
                        ? "border-excellent"
                        : status === "Good"
                          ? "border-good"
                          : status === "Warning"
                            ? "border-warning"
                            : status === "Critical"
                              ? "border-critical"
                              : "border-soft";
                    const cpuPercentValue = pnode.stats?.cpu_percent;
                    const cpuDisplay =
                      typeof cpuPercentValue === "number" && Number.isFinite(cpuPercentValue)
                        ? `${cpuPercentValue.toFixed(1)}%`
                        : "—";
                    const ramDisplay = formatBytes(pnode.stats?.ram_used ?? 0);
                    const diskDisplay = formatBytes(pnode.stats?.file_size ?? 0);
                    const uptimeDisplay = formatUptime(pnode.stats?.uptime ?? 0);

                    return (
                      <div
                        key={pnode.ip}
                        onClick={() =>
                          (window.location.href = `/pnode/${pnode.ip}`)
                        }
                        className={clsx(
                          "p-6 rounded-xl border border-l-4 cursor-pointer transition-all hover:-translate-y-1 theme-transition group kpi-card",
                          isLight
                            ? "border-black/10 hover:shadow-[0_20px_35px_-15px_rgba(15,23,42,0.25)]"
                            : "border-border-app hover:shadow-[0_25px_45px_-20px_rgba(20,28,58,0.55)]",
                          statusBorderClass
                        )}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h2
                            className={clsx(
                              "font-mono font-bold text-lg transition-colors",
                              isLight ? "text-text-main" : "text-white"
                            )}
                          >
                            {pnode.ip}
                          </h2>
                          <div className="flex gap-2 items-center">
                            <div
                              className={clsx(
                                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs border border-current/40",
                                getScoreColor(calculateNodeScore(pnode)),
                                isLight ? "bg-white/80" : "bg-black/40"
                              )}
                            >
                              {calculateNodeScore(pnode)}
                            </div>
                            <span
                              className={`px-2 py-2 rounded-full text-[10px] font-bold uppercase border ${statusBadge(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div
                            className={clsx(
                              "p-3 rounded-lg border theme-transition",
                              isLight
                                ? "bg-black/5 border-black/10"
                                : "bg-bg-bg2 border-border-app"
                            )}
                          >
                            <p className="text-text-soft text-[11px] uppercase tracking-wide">
                              CPU
                            </p>
                            <p className="font-bold text-text-main">
                              {cpuDisplay}
                            </p>
                          </div>

                          <div
                            className={clsx(
                              "p-3 rounded-lg border theme-transition",
                              isLight
                                ? "bg-black/5 border-black/10"
                                : "bg-bg-bg2 border-border-app"
                            )}
                          >
                            <p className="text-text-soft text-[11px] uppercase tracking-wide">
                              RAM
                            </p>
                            <p className="font-bold text-text-main">
                              {ramDisplay}
                            </p>
                          </div>

                          <div
                            className={clsx(
                              "p-3 rounded-lg border theme-transition",
                              isLight
                                ? "bg-black/5 border-black/10"
                                : "bg-bg-bg2 border-border-app"
                            )}
                          >
                            <p className="text-text-soft text-[11px] uppercase tracking-wide">
                              Disk
                            </p>
                            <p className="font-bold text-accent">
                              {diskDisplay}
                            </p>
                          </div>

                          <div
                            className={clsx(
                              "p-3 rounded-lg border theme-transition",
                              isLight
                                ? "bg-black/5 border-black/10"
                                : "bg-bg-bg2 border-border-app"
                            )}
                          >
                            <p className="text-text-soft text-[11px] uppercase tracking-wide">
                              Uptime
                            </p>
                            <p className="font-bold text-text-main">
                              {uptimeDisplay}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border-app bg-bg-bg p-8 mt-auto w-full theme-transition">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-text-faint text-sm mb-2">
                Built for{" "}
                <span className="text-accent-aqua font-semibold">Xandeum</span> •
                Superteam Earn Bounty
              </p>
              <p className="text-text-soft text-xs">Powered by pRPC</p>
            </div>

            <div
              className="flex items-center gap-4 px-4 py-2 rounded-full border theme-transition"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-app)",
              }}
            >
              <Image
                src="/avatar-ninja.png"
                alt="Ninja0x"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <p className="text-xs" style={{ color: "var(--text-soft)" }}>
                Coded with <span className="text-red-400">❤️</span> by{" "}
                <span className="font-semibold" style={{ color: "var(--accent-aqua)" }}>Ninja0x</span>
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* SEARCH MODAL (hors motion.main pour éviter fixed/transform) */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-[#050914] z-50 flex items-center justify-center p-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-bg-app border border-border-app rounded-xl max-w-xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border-app p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-text-main">Search</h3>
                <p className="text-sm text-text-faint mt-2">Search nodes (IP, version, status)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-text-faint hover:text-text-main transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 rounded-lg border border-border-app bg-bg-bg px-3 py-2">
                <Search className="w-5 h-5 text-text-soft" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by IP, version, status..."
                  className="w-full bg-transparent outline-none text-sm text-text-main"
                />
              </div>
            </div>
            <div className="border-t border-border-app p-4 bg-bg-bg">
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="w-full px-4 py-2 bg-bg-bg2 hover:bg-bg-card border border-border-app rounded-lg text-sm font-semibold text-text-main transition-colors theme-transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL (hors motion.main pour éviter fixed/transform) */}
      {isSettingsOpen && (
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
                    ] satisfies Array<{ key: AutoRefreshOption; label: string }>
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
                    ] satisfies Array<{ key: ViewMode; label: string }>
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
      )}

      {/* ALERT PANEL MODAL (hors motion.main pour éviter fixed/transform) */}
      {isAlertOpen && (
        <div
          className="fixed inset-0 bg-[#050914] z-50 flex items-center justify-center p-4"
          onClick={() => setIsAlertOpen(false)}
        >
          <div
            className="bg-bg-app border border-border-app rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-border-app p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">System Alerts</h3>
                <p className="text-sm text-text-faint mt-2">
                  {alerts.length} alert{alerts.length !== 1 ? "s" : ""} detected
                  {criticalCount > 0 && (
                    <span className="ml-2 text-kpi-critical font-semibold">
                      ({criticalCount} critical node{criticalCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsAlertOpen(false)}
                className="text-text-faint hover:text-text-main transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-kpi-excellent/10 mb-4">
                    <svg
                      className="w-8 h-8 text-kpi-excellent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-kpi-excellent text-lg font-semibold">
                    ✓ All Systems Healthy
                  </p>
                  <p className="text-text-faint text-sm mt-2">
                    No alerts to display
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-app">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 hover:bg-bg-bg2 transition-colors cursor-pointer theme-transition ${alert.severity === "critical"
                        ? "border-l-4 border-kpi-critical"
                        : alert.severity === "warning"
                          ? "border-l-4 border-kpi-warning"
                          : "border-l-4 border-kpi-good"
                        }`}
                      onClick={() => {
                        setIsAlertOpen(false);
                        window.location.href = `/pnode/${alert.ip}`;
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-2 rounded uppercase ${alert.severity === "critical"
                            ? "bg-kpi-critical/10 text-kpi-critical border border-kpi-critical/20"
                            : alert.severity === "warning"
                              ? "bg-kpi-warning/10 text-kpi-warning border border-kpi-warning/20"
                              : "bg-kpi-good/10 text-kpi-good border border-kpi-good/20"
                            }`}
                        >
                          {alert.type}
                        </span>
                        <span className="text-xs text-text-faint font-mono">
                          {alert.ip}
                        </span>
                      </div>
                      <p className="text-sm text-text-main">{alert.message}</p>
                      <p className="text-xs text-text-soft mt-2">
                        Click to view node details →
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border-app p-4 bg-bg-bg">
              <button
                onClick={() => setIsAlertOpen(false)}
                className="w-full px-4 py-2 bg-bg-bg2 hover:bg-bg-card border border-border-app rounded-lg text-sm font-semibold text-text-main transition-colors theme-transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
