
import { type LucideIcon, ShieldCheck, Radio, AlertCircle, Zap } from "lucide-react";
import { getHealthStatus } from "./health";

export const GB_IN_BYTES = 1024 ** 3;
export const TB_IN_BYTES = 1024 ** 4;

export const KPI_COLORS = {
    public: "#06B6D4",
    private: "#94A3B8",
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


