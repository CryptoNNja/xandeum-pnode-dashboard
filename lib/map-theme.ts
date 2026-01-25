/**
 * Unified Map Theme System
 * Ensures 2D Map and 3D Globe have identical design
 */

export type MapThemeColors = {
  // Background
  background: string;

  // Globe/Map specific
  globe: {
    texture: string;
    atmosphere: string;
    atmosphereAltitude: number;
  };

  // Geographic features (countries/borders)
  countries: {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
  };

  // Node colors by health status
  nodes: {
    excellent: string; // >= 85
    good: string; // >= 60
    warning: string; // >= 40
    critical: string; // < 40
    private: string; // Private nodes
  };

  // Connection arcs
  arcs: string;

  // Labels
  labels: string;

  // UI Elements (tooltips, cards, etc.)
  ui: {
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
  };
};

/**
 * Light Mode Theme - Matches NodesMap 2D exactly
 */
const LIGHT_THEME: MapThemeColors = {
  background: "#f5f5f7",

  globe: {
    texture: "",
    atmosphere: "#EA580C",
    atmosphereAltitude: 0.15,
  },

  countries: {
    fill: "#ffffff",
    fillOpacity: 0.9,
    stroke: "#EA580C",
    strokeWidth: 1.5,
    strokeOpacity: 0.8,
  },

  nodes: {
    excellent: "#059669", // --kpi-excellent
    good: "#3b82f6", // --kpi-good
    warning: "#d97706", // --kpi-warning
    critical: "#dc2626", // --kpi-critical
    private: "#f97316", // --kpi-private (orange)
  },

  arcs: "rgba(234, 88, 12, 0.3)", // Orange transparent

  labels: "#0f172a",

  ui: {
    card: "rgba(255, 255, 255, 0.95)",
    cardBorder: "rgba(234, 88, 12, 0.3)",
    text: "#1F2937",
    textSecondary: "#6b7280",
    accent: "#EA580C",
    accentSoft: "rgba(234, 88, 12, 0.1)",
  },
};

/**
 * Dark Mode Theme - Matches NodesMap 2D exactly
 */
const DARK_THEME: MapThemeColors = {
  background: "#000000",

  globe: {
    texture: "",
    atmosphere: "#00D4AA",
    atmosphereAltitude: 0.15,
  },

  countries: {
    fill: "#0A0E1A",
    fillOpacity: 0.9,
    stroke: "#00D4AA",
    strokeWidth: 1.0,
    strokeOpacity: 0.6,
  },

  nodes: {
    excellent: "#10b981", // --kpi-excellent dark
    good: "#60a5fa", // --kpi-good dark
    warning: "#f59e0b", // --kpi-warning dark
    critical: "#ef4444", // --kpi-critical dark
    private: "#fb923c", // --kpi-private dark
  },

  arcs: "rgba(0, 212, 170, 0.3)", // Aqua transparent

  labels: "#f8fafc",

  ui: {
    card: "rgba(10, 14, 39, 0.95)",
    cardBorder: "rgba(20, 241, 149, 0.3)",
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    accent: "#14f195",
    accentSoft: "rgba(20, 241, 149, 0.1)",
  },
};

/**
 * Get theme based on mode
 */
export function getMapTheme(theme: "light" | "dark"): MapThemeColors {
  return theme === "light" ? LIGHT_THEME : DARK_THEME;
}

/**
 * Get node color based on health score
 */
export function getNodeColorByHealth(
  health: number,
  theme: MapThemeColors,
): string {
  if (health >= 85) return theme.nodes.excellent;
  if (health >= 60) return theme.nodes.good;
  if (health >= 40) return theme.nodes.warning;
  return theme.nodes.critical;
}

/**
 * Get status colors for legend
 */
export function getStatusColors(theme: "light" | "dark") {
  const colors = theme === "light" ? LIGHT_THEME : DARK_THEME;
  return {
    excellent: colors.nodes.excellent,
    good: colors.nodes.good,
    warning: colors.nodes.warning,
    critical: colors.nodes.critical,
    private: colors.nodes.private,
  };
}

/**
 * Format node tooltip with theme colors
 */
export function formatNodeTooltip(
  node: {
    ip: string;
    health: number;
    city?: string;
    country?: string;
    storage?: number;
    uptime?: number;
    cpu?: number;
    ram?: number;
    version?: string;
  },
  theme: MapThemeColors,
): string {
  const isLight = theme.background === "#f5f5f7";

  return `
    <div style="
      background: ${theme.ui.card};
      color: ${theme.ui.text};
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      border: 2px solid ${theme.ui.cardBorder};
      min-width: 160px;
      backdrop-filter: blur(8px);
    ">
      <div style="font-weight: bold; margin-bottom: 6px; font-size: 11px; color: ${theme.ui.accent};">
        ${node.ip}
      </div>
      <div style="font-size: 10px; color: ${theme.ui.textSecondary}; margin-bottom: 8px;">
        ${node.city ? `📍 ${node.city}, ` : ""}${node.country || "Unknown"}
      </div>
      <div style="font-size: 10px; color: ${theme.ui.text};">
        <div style="margin: 2px 0;">Health: <strong>${node.health.toFixed(0)}%</strong></div>
        ${node.storage ? `<div style="margin: 2px 0;">Storage: ${node.storage.toFixed(2)} GB</div>` : ""}
        ${node.uptime ? `<div style="margin: 2px 0;">Uptime: ${node.uptime.toFixed(1)}h</div>` : ""}
      </div>
      <div style="
        margin-top: 8px;
        display: inline-block;
        font-size: 9px;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 4px;
        background: ${theme.ui.accent};
        color: ${isLight ? "#ffffff" : "#000000"};
      ">
        VIEW DETAILS
      </div>
    </div>
  `;
}
