
import { type LucideIcon, ShieldCheck, Radio, AlertCircle, Zap } from "lucide-react";
import { getHealthStatus } from "./health";

export const GB_IN_BYTES = 1024 ** 3;
export const TB_IN_BYTES = 1024 ** 4;

// Decimal units (used by some dashboards/APIs when they display "GB" as 1e9 bytes)
export const GB_IN_BYTES_DECIMAL = 1e9;
export const TB_IN_BYTES_DECIMAL = 1e12;

export const KPI_COLORS = {
    public: "#06B6D4",
    private: "#F97316",
    total: "#6366F1",
    cpu: "#10B981",
    ram: "#F472B6",
    alerts: "#FB7185",
    alertOk: "#22C55E",
} as const;

export const STATUS_COLORS = {
    excellent: "#10B981",
    good: "#3B82F6",
    warning: "#F59E0B",
    critical: "#EF4444",
    private: "#94A3B8",
} as const;

export const CPU_BUCKETS = [
    { label: "Idle", min: 0, max: 25, color: "#10B981" },
    { label: "Normal", min: 25, max: 75, color: "#0EA5E9" },
    { label: "Load", min: 75, max: 101, color: "#F97316" },
] as const;

export const STORAGE_BUCKETS = [
    { label: "< 250 GB", min: 0, max: 250 * GB_IN_BYTES },
    { label: "250-500 GB", min: 250 * GB_IN_BYTES, max: 500 * GB_IN_BYTES },
    { label: "500 GB - 1 TB", min: 500 * GB_IN_BYTES, max: 1 * TB_IN_BYTES },
    { label: "1 - 1.5 TB", min: 1 * TB_IN_BYTES, max: 1.5 * TB_IN_BYTES },
    { label: "≥ 1.5 TB", min: 1.5 * TB_IN_BYTES, max: Number.POSITIVE_INFINITY },
] as const;

// Helper to get CSS variable value at runtime
export const getCssVar = (varName: string, fallback: string = "#000000"): string => {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

export const getKpiColors = () => ({
    public: getCssVar("--accent-aqua", "#06B6D4"),
    private: getCssVar("--kpi-private", "#F97316"),
    total: getCssVar("--accent", "#6366F1"),
    cpu: getCssVar("--kpi-excellent", "#10B981"),
    ram: getCssVar("--accent-ram", "#3B82F6"),
    alerts: "#FB7185",
    alertOk: getCssVar("--kpi-excellent", "#22C55E"),
});

export const getStatusColors = () => ({
    excellent: getCssVar("--kpi-excellent", "#10B981"),
    good: getCssVar("--kpi-good", "#3B82F6"),
    warning: getCssVar("--kpi-warning", "#F59E0B"),
    critical: getCssVar("--kpi-critical", "#EF4444"),
    private: getCssVar("--kpi-private", "#94A3B8"),
});

// CPU buckets with dynamic colors
export const getCpuBuckets = () => [
  { label: "Idle", min: 0, max: 25, color: getCssVar("--kpi-excellent", "#10B981") },
  { label: "Normal", min: 25, max: 75, color: getCssVar("--kpi-good", "#0EA5E9") },
  { label: "Load", min: 75, max: 101, color: getCssVar("--kpi-warning", "#F97316") },
];

export const hexToRgba = (hex: string, alpha: number) => {
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

export const formatBytes = (bytes: number) => {
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

export const formatBytesToTB = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 TB";
    const tbValue = bytes / TB_IN_BYTES;
    return tbValue >= 10 ? `${tbValue.toFixed(0)} TB` : `${tbValue.toFixed(1)} TB`;
};

// Adaptive formatter: chooses best unit automatically (KB/MB/GB/TB)
// Uses binary units (1024) to match pRPC stats + existing tests/UX expectations.
export const formatBytesAdaptive = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const KB = 1024;
  const MB = 1024 ** 2;
  const GB = 1024 ** 3;
  const TB = 1024 ** 4;

  if (bytes >= TB) {
    const v = bytes / TB;
    return v >= 10 ? `${v.toFixed(0)} TB` : `${v.toFixed(1)} TB`;
  }

  if (bytes >= GB) {
    const v = bytes / GB;
    return v >= 10 ? `${v.toFixed(0)} GB` : `${v.toFixed(1)} GB`;
  }

  if (bytes >= MB) {
    const v = bytes / MB;
    return v >= 10 ? `${v.toFixed(0)} MB` : `${v.toFixed(1)} MB`;
  }

  // For small values, prefer showing KB once we cross 0.5 KB for nicer UX (and to match tests)
  if (bytes >= 512) {
    const v = bytes / KB;
    return `${v.toFixed(1)} KB`;
  }

  return `${bytes.toFixed(0)} B`;
};

export const formatUptime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

export const getStorageBarColors = (percent: number) => {
    if (percent >= 90) return { fill: "linear-gradient(90deg, #F97316, #EF4444)", accent: "#EF4444" };
    if (percent >= 70) return { fill: "linear-gradient(90deg, #FACC15, #F97316)", accent: "#F59E0B" };
    if (percent >= 40) return { fill: "linear-gradient(90deg, #22D3EE, #3B82F6)", accent: "#0EA5E9" };
    return { fill: "linear-gradient(90deg, #34D399, #10B981)", accent: "#10B981" };
};

export const getNetworkHealthColor = (score: number) => {
    if (score >= 85) return "#10B981";
    if (score >= 70) return "#22D3EE";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
};

export const getNetworkUptimeVisuals = (percent: number): { badge: string; color: string; Icon: LucideIcon } => {
    if (percent >= 97) return { badge: "Mission ready", color: KPI_COLORS.public, Icon: ShieldCheck };
    if (percent >= 90) return { badge: "Stable mesh", color: "#3B82F6", Icon: Radio };
    if (percent >= 80) return { badge: "Monitor closely", color: "#F59E0B", Icon: AlertCircle };
    return { badge: "Critical uptime", color: "#EF4444", Icon: Zap };
};

export const statusBadge = (status: ReturnType<typeof getHealthStatus>) => {
    switch (status) {
      case "Excellent": return "bg-kpi-excellent/10 text-kpi-excellent border border-kpi-excellent/30";
      case "Good": return "bg-accent-aqua/10 text-accent-aqua border border-accent-aqua/30";
      case "Warning": return "bg-kpi-warning/10 text-kpi-warning border border-kpi-warning/30";
      case "Critical": return "bg-kpi-critical/10 text-kpi-critical border border-kpi-critical/40";
      default: return "bg-bg-bg2 text-text-soft border border-border-app";
    }
};

export const getHealthBadgeStyles = (percentage: number) => {
    if (percentage >= 85) return "bg-kpi-excellent/15 text-kpi-excellent border border-kpi-excellent/30";
    if (percentage >= 60) return "bg-accent-aqua/15 text-accent-aqua border border-accent-aqua/30";
    if (percentage >= 40) return "bg-kpi-warning/15 text-kpi-warning border border-kpi-warning/30";
    return "bg-kpi-critical/15 text-kpi-critical border border-kpi-critical/40";
};

export const getHealthLabel = (percentage: number) => {
    if (percentage >= 85) return "Healthy";
    if (percentage >= 60) return "Stable";
    if (percentage >= 40) return "Warning";
    return "Critical";
};

/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji
 * @param countryCode - Two-letter country code (e.g., "US", "FR", "DE")
 * @returns Flag emoji or globe emoji if invalid
 *
 * Examples:
 * - getCountryFlag("US") => "🇺🇸"
 * - getCountryFlag("FR") => "🇫🇷"
 * - getCountryFlag("DE") => "🇩🇪"
 */
// Common country code to emoji mapping for reliable display
const FLAG_MAP: Record<string, string> = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹',
    'ES': '🇪🇸', 'PT': '🇵🇹', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭',
    'AT': '🇦🇹', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'SE': '🇸🇪', 'NO': '🇳🇴',
    'DK': '🇩🇰', 'FI': '🇫🇮', 'IE': '🇮🇪', 'RU': '🇷🇺', 'UA': '🇺🇦',
    'IN': '🇮🇳', 'CN': '🇨🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬',
    'AU': '🇦🇺', 'NZ': '🇳🇿', 'CA': '🇨🇦', 'MX': '🇲🇽', 'BR': '🇧🇷',
    'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'ZA': '🇿🇦', 'NG': '🇳🇬',
    'EG': '🇪🇬', 'KE': '🇰🇪', 'AE': '🇦🇪', 'SA': '🇸🇦', 'IL': '🇮🇱',
    'TR': '🇹🇷', 'TH': '🇹🇭', 'VN': '🇻🇳', 'ID': '🇮🇩', 'MY': '🇲🇾',
    'PH': '🇵🇭', 'PK': '🇵🇰', 'BD': '🇧🇩', 'HK': '🇭🇰', 'TW': '🇹🇼',
};

export const getCountryFlag = (countryCode?: string | null): string => {
    if (!countryCode || countryCode.length !== 2) {
        return "🌍"; // Globe emoji as fallback
    }

    const code = countryCode.toUpperCase();
    
    // Try direct mapping first (more reliable on Windows)
    if (FLAG_MAP[code]) {
        return FLAG_MAP[code];
    }

    // Fallback: Generate from Unicode regional indicators
    const codePoints = code
        .split('')
        .map(char => {
            const charCode = char.charCodeAt(0);
            if (charCode >= 65 && charCode <= 90) {
                return 127397 + charCode;
            }
            return null;
        })
        .filter((cp): cp is number => cp !== null);

    if (codePoints.length !== 2) {
        return "🌍";
    }

    return String.fromCodePoint(...codePoints);
};


