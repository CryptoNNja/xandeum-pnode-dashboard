"use client";

import { AlertCircle, AlertTriangle, Activity, Shield, Clock, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import type { Alert } from "@/types/alerts";
import clsx from "clsx";

type AlertsAnalyticsTabProps = {
  alerts: Alert[];
  totalNodes: number;
  isLight: boolean;
  onSwitchToAlerts: () => void;
};

export const AlertsAnalyticsTab = ({
  alerts,
  totalNodes,
  isLight,
  onSwitchToAlerts,
}: AlertsAnalyticsTabProps) => {
  // Custom tooltip renderer
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div
          className={clsx(
            "p-3 rounded-lg border shadow-lg",
            isLight ? "bg-white/98 border-gray-200" : "bg-[#1a1f3a]/98 border-white/20"
          )}
        >
          <p className="text-sm font-semibold text-text-main mb-1">{entry.name}</p>
          <p className="text-sm font-semibold" style={{ color: entry.color || (isLight ? "#0f172a" : "#f8fafc") }}>
            Count: {entry.value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Categorize alerts by type
  const alertCategories = alerts.reduce((acc, alert) => {
    const type = alert.type;
    if (!acc[type]) {
      acc[type] = { count: 0, critical: 0, warning: 0 };
    }
    acc[type].count++;
    if (alert.severity === "critical") {
      acc[type].critical++;
    } else {
      acc[type].warning++;
    }
    return acc;
  }, {} as Record<string, { count: number; critical: number; warning: number }>);

  // Prepare data for charts
  const categoryData = Object.entries(alertCategories).map(([name, data]) => ({
    name: name.replace(/([A-Z])/g, ' $1').trim(),
    value: data.count,
    critical: data.critical,
    warning: data.warning,
  }));

  // Severity breakdown - Count unique NODES affected (not total alerts)
  const criticalNodesSet = new Set(alerts.filter(a => a.severity === "critical").map(a => a.ip).filter(Boolean));
  const warningNodesSet = new Set(alerts.filter(a => a.severity === "warning").map(a => a.ip).filter(Boolean));
  const criticalCount = criticalNodesSet.size;
  const warningCount = warningNodesSet.size;

  const severityData = [
    { name: "Critical", value: criticalCount, color: "#ef4444" },
    { name: "Warning", value: warningCount, color: "#f59e0b" },
  ];

  // Calculate health status based on critical nodes ratio
  const criticalRate = totalNodes > 0 ? (criticalCount / totalNodes) * 100 : 0;
  const totalAffectedRate = totalNodes > 0 ? ((criticalCount + warningCount) / totalNodes) * 100 : 0;
  
  const healthStatus = criticalRate === 0 && warningCount === 0 ? "Excellent" 
    : criticalRate === 0 ? "Good" 
    : criticalRate < 5 ? "Fair" 
    : "Critical";
  
  const healthColor = healthStatus === "Excellent" ? "#10b981" 
    : healthStatus === "Good" ? "#3b82f6" 
    : healthStatus === "Fair" ? "#f59e0b" 
    : "#ef4444";

  // Chart colors for categories
  const CATEGORY_COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981", "#ec4899"];

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
        
        {/* TOP-LEFT: KPI Cards Vertical Stack */}
        <div className="space-y-1.5">
          {/* Total Alerts - Display the number of unique affected NODES */}
          <div className={clsx(
            "p-2 rounded-lg border",
            isLight ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-500/10 border-blue-500/30"
          )}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-blue-500">{criticalCount + warningCount}</p>
                <p className="text-xs text-text-soft">Total</p>
              </div>
            </div>
          </div>

          {/* Critical */}
          <div className={clsx(
            "p-2 rounded-lg border",
            isLight ? "bg-red-500/5 border-red-500/20" : "bg-red-500/10 border-red-500/30"
          )}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <div>
                <p className="text-lg font-bold text-red-500">{criticalCount}</p>
                <p className="text-xs text-text-soft">Critical</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className={clsx(
            "p-2 rounded-lg border",
            isLight ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-500/10 border-orange-500/30"
          )}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-orange-500">{warningCount}</p>
                <p className="text-xs text-text-soft">Warning</p>
              </div>
            </div>
          </div>

          {/* Network Health */}
          <div
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: isLight ? `${healthColor}10` : `${healthColor}15`,
              borderColor: isLight ? `${healthColor}30` : `${healthColor}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" style={{ color: healthColor }} />
              <div>
                <p className="text-lg font-bold" style={{ color: healthColor }}>{healthStatus}</p>
                <p className="text-xs text-text-soft">Health</p>
              </div>
            </div>
          </div>
        </div>

        {/* TOP-RIGHT: Pie Chart */}
        <div className={clsx(
          "p-2 rounded-lg border",
          isLight ? "bg-white/50 border-gray-200/50" : "bg-[#1a1f3a]/50 border-white/20"
        )}>
          <h3 className="text-xs font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent-aqua" />
            Alert Types
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={50}
                  innerRadius={35}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => {
                    // Color based on ALERT TYPE - Consistent with severity
                    // Normalize name for matching (handle spaces)
                    const normalizedName = entry.name.toLowerCase().replace(/\s+/g, '');
                    const typeColors: Record<string, string> = {
                      // Critical Storage (Intense Red)
                      'lowstorage': '#ef4444',       // Red - Critical storage
                      'storagecritical': '#dc2626',  // Dark red - Very critical storage
                      'storagefilling': '#f97316',   // Orange-red - Storage filling up
                      
                      // Critical Nodes (Red/Pink)
                      'offlinenode': '#b91c1c',      // Dark red - Node offline
                      'nodecrash': '#dc2626',        // Dark red - Node crash
                      'nodecrashdetected': '#ef4444', // Red - Node crash detected
                      
                      // Warnings (Orange/Yellow)
                      'stalenode': '#f59e0b',        // Orange - Stale node
                      'staledata': '#fbbf24',        // Yellow - Stale data
                      
                      // Performance Issues (Purple/Pink)
                      'highcpu': '#8b5cf6',          // Purple - High CPU
                      'highram': '#ec4899',          // Pink - High RAM
                      
                      // Info/Restart (Blue)
                      'recentrestart': '#3b82f6',    // Blue - Recent restart
                    };
                    const color = typeColors[normalizedName] || '#6b7280'; // Gray fallback
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-text-faint text-xs">
              No alerts to display
            </div>
          )}
        </div>

        {/* BOTTOM-LEFT: Bar Chart */}
        <div className={clsx(
          "p-2 rounded-lg border",
          isLight ? "bg-white/50 border-gray-200/50" : "bg-[#1a1f3a]/50 border-white/20"
        )}>
          <h3 className="text-xs font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-accent-aqua" />
            Severity
          </h3>
          {alerts.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={severityData}>
                <XAxis
                  dataKey="name"
                  stroke={isLight ? "#6b7280" : "#cbd5e1"}
                  style={{
                    fontSize: "9px",
                    fontWeight: "600",
                    fill: isLight ? "#0f172a" : "#f8fafc"
                  }}
                />
                <YAxis
                  stroke={isLight ? "#6b7280" : "#cbd5e1"}
                  style={{
                    fontSize: "9px",
                    fontWeight: "600",
                    fill: isLight ? "#0f172a" : "#f8fafc"
                  }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-text-faint text-xs">
              No alerts to display
            </div>
          )}
        </div>

        {/* BOTTOM-RIGHT: Impact Summary + Recent Alerts */}
        <div className="space-y-1.5">
          {/* Impact Summary - Inline Ultra-Compact */}
          <div className={clsx(
            "p-1.5 rounded-lg border",
            isLight ? "bg-white/50 border-gray-200/50" : "bg-[#1a1f3a]/50 border-white/20"
          )}>
            <h3 className="text-xs font-semibold text-text-main mb-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-accent-aqua" />
              Impact
            </h3>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-base font-bold text-text-main">{new Set(alerts.map(a => a.ip).filter(Boolean)).size}</p>
                <p className="text-xs text-text-faint">Nodes</p>
              </div>
              <div className="w-px h-6 bg-border-app" />
              <div className="text-center">
                <p className="text-base font-bold text-text-main">{Object.keys(alertCategories).length}</p>
                <p className="text-xs text-text-faint">Types</p>
              </div>
              <div className="w-px h-6 bg-border-app" />
              <div className="text-center">
                <p className="text-base font-bold text-text-main">Live</p>
                <p className="text-xs text-text-faint">Status</p>
              </div>
            </div>
          </div>

          {/* Recent Alerts - 3 Items Ultra-Compact */}
          {alerts.length > 0 && (
            <div className={clsx(
              "p-1.5 rounded-lg border",
              isLight ? "bg-white/50 border-gray-200/50" : "bg-[#1a1f3a]/50 border-white/20"
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-semibold text-text-main flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent-aqua" />
                  Recent (3)
                </h3>
                <button
                  onClick={onSwitchToAlerts}
                  className={clsx(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium transition-all",
                    "text-accent hover:bg-accent/10"
                  )}
                >
                  All
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="space-y-1">
                {alerts.slice(0, 3).map((alert, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "p-1 rounded border flex items-center justify-between",
                      alert.severity === "critical"
                        ? (isLight ? "bg-red-500/5 border-red-500/20" : "bg-red-500/10 border-red-500/30")
                        : (isLight ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-500/10 border-orange-500/30")
                    )}
                  >
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      {alert.severity === "critical" ? (
                        <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-text-main truncate">{alert.type}</span>
                    </div>
                    <span
                      className={clsx(
                        "text-xs font-mono shrink-0 ml-1",
                        alert.severity === "critical" ? "text-red-500" : "text-orange-500"
                      )}
                    >
                      {alert.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
