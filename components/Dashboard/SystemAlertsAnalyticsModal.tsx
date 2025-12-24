"use client";

import { X, AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, Clock, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import type { Alert } from "@/hooks/usePnodeDashboard";

type SystemAlertsAnalyticsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  totalNodes: number;
  isLight: boolean;
};

export const SystemAlertsAnalyticsModal = ({
  isOpen,
  onClose,
  alerts,
  totalNodes,
  isLight,
}: SystemAlertsAnalyticsModalProps) => {
  if (!isOpen) return null;

  // Custom tooltip renderer for better control
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div
          style={{
            backgroundColor: isLight ? "rgba(255,255,255,0.98)" : "rgba(26,31,58,0.98)",
            border: `1px solid ${isLight ? "#e5e7eb" : "rgba(100,116,139,0.3)"}`,
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ 
            margin: 0, 
            fontWeight: "600", 
            fontSize: "13px",
            color: isLight ? "#0f172a" : "#f8fafc",
            marginBottom: "4px"
          }}>
            {entry.name}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: "600",
              color: entry.color || (isLight ? "#0f172a" : "#f8fafc"),
            }}
          >
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
    name: name.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to camelCase
    value: data.count,
    critical: data.critical,
    warning: data.warning,
  }));

  // Severity breakdown
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;

  const severityData = [
    { name: "Critical", value: criticalCount, color: "#ef4444" },
    { name: "Warning", value: warningCount, color: "#f59e0b" },
  ];

  // Calculate health status
  const alertRate = (alerts.length / totalNodes) * 100;
  const healthStatus = alertRate === 0 ? "Excellent" : alertRate < 5 ? "Good" : alertRate < 15 ? "Fair" : "Critical";
  const healthColor = alertRate === 0 ? "#10b981" : alertRate < 5 ? "#3b82f6" : alertRate < 15 ? "#f59e0b" : "#ef4444";

  // Get unique affected countries
  const affectedCountries = new Set(alerts.map(a => {
    // Extract country from node if available (this is a placeholder, adjust based on your data)
    return "Various"; // You can enhance this with actual geolocation data
  }));

  // Chart colors for categories
  const CATEGORY_COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981", "#ec4899"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col theme-transition"
        style={{
          backgroundColor: isLight ? "rgba(255,255,255,0.98)" : "rgba(10,14,39,0.98)",
          borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{
          borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
          background: isLight ? "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))" : "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
        }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: isLight ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.15)",
            }}>
              <Activity className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main">
                System Alerts Analytics
              </h2>
              <p className="text-sm text-text-soft mt-1">
                Comprehensive health monitoring and insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-text-faint hover:text-text-main theme-transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Alerts */}
            <div className="p-4 rounded-xl border" style={{
              backgroundColor: isLight ? "rgba(59,130,246,0.05)" : "rgba(59,130,246,0.1)",
              borderColor: isLight ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.3)",
            }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <p className="text-xs uppercase tracking-wider text-text-soft">Total Alerts</p>
              </div>
              <p className="text-3xl font-bold text-blue-500">{alerts.length}</p>
              <p className="text-xs text-text-faint mt-1">Active issues</p>
            </div>

            {/* Critical */}
            <div className="p-4 rounded-xl border" style={{
              backgroundColor: isLight ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.1)",
              borderColor: isLight ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.3)",
            }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-xs uppercase tracking-wider text-text-soft">Critical</p>
              </div>
              <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
              <p className="text-xs text-text-faint mt-1">Immediate attention</p>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-xl border" style={{
              backgroundColor: isLight ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.1)",
              borderColor: isLight ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.3)",
            }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <p className="text-xs uppercase tracking-wider text-text-soft">Warnings</p>
              </div>
              <p className="text-3xl font-bold text-orange-500">{warningCount}</p>
              <p className="text-xs text-text-faint mt-1">Monitor closely</p>
            </div>

            {/* Network Health */}
            <div className="p-4 rounded-xl border" style={{
              backgroundColor: isLight ? `${healthColor}10` : `${healthColor}15`,
              borderColor: isLight ? `${healthColor}30` : `${healthColor}40`,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4" style={{ color: healthColor }} />
                <p className="text-xs uppercase tracking-wider text-text-soft">Network Health</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: healthColor }}>{healthStatus}</p>
              <p className="text-xs text-text-faint mt-1">{alertRate.toFixed(1)}% affected</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Alert Types Distribution */}
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(26,31,58,0.5)",
              borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
            }}>
              <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent-aqua" />
                Alert Types Distribution
              </h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-text-faint">
                  No alerts to display
                </div>
              )}
            </div>

            {/* Severity Breakdown */}
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(26,31,58,0.5)",
              borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
            }}>
              <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent-aqua" />
                Severity Breakdown
              </h3>
              {alerts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={severityData}>
                    <XAxis 
                      dataKey="name" 
                      stroke={isLight ? "#6b7280" : "#cbd5e1"}
                      style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        fill: isLight ? "#0f172a" : "#f8fafc"
                      }}
                    />
                    <YAxis 
                      stroke={isLight ? "#6b7280" : "#cbd5e1"}
                      style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        fill: isLight ? "#0f172a" : "#f8fafc"
                      }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-text-faint">
                  No alerts to display
                </div>
              )}
            </div>
          </div>

          {/* Impact Summary */}
          <div className="p-6 rounded-xl border" style={{
            backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(26,31,58,0.5)",
            borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
          }}>
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-aqua" />
              Impact Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nodes Affected */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: isLight ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)",
                }}>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-text-soft">Nodes Affected</p>
                  <p className="text-2xl font-bold text-text-main">{alerts.length}</p>
                  <p className="text-xs text-text-faint">out of {totalNodes} total</p>
                </div>
              </div>

              {/* Alert Categories */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: isLight ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.15)",
                }}>
                  <AlertCircle className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-text-soft">Alert Categories</p>
                  <p className="text-2xl font-bold text-text-main">{Object.keys(alertCategories).length}</p>
                  <p className="text-xs text-text-faint">unique issue types</p>
                </div>
              </div>

              {/* Time Window */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: isLight ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)",
                }}>
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-text-soft">Monitoring</p>
                  <p className="text-2xl font-bold text-text-main">Real-time</p>
                  <p className="text-xs text-text-faint">live updates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="mt-6 p-6 rounded-xl border" style={{
              backgroundColor: isLight ? "rgba(255,255,255,0.5)" : "rgba(26,31,58,0.5)",
              borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
            }}>
              <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-aqua" />
                Top Recent Alerts
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {alerts.slice(0, 10).map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border flex items-center justify-between"
                    style={{
                      backgroundColor: alert.severity === "critical" 
                        ? (isLight ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.1)")
                        : (isLight ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.1)"),
                      borderColor: alert.severity === "critical"
                        ? (isLight ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.3)")
                        : (isLight ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.3)"),
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {alert.severity === "critical" ? (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-text-main">{alert.type}</p>
                        <p className="text-xs text-text-faint">Node: {alert.ip}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded" style={{
                      backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                      color: alert.severity === "critical" ? "#ef4444" : "#f59e0b",
                    }}>
                      {alert.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between" style={{
          borderColor: isLight ? "rgba(229,231,235,0.5)" : "rgba(100,116,139,0.2)",
          backgroundColor: isLight ? "rgba(249,250,251,0.5)" : "rgba(0,0,0,0.2)",
        }}>
          <p className="text-xs text-text-faint">
            Alerts are monitored in real-time and updated every cycle
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold text-sm theme-transition"
            style={{
              backgroundColor: "#14f195",
              color: "#0a0e27",
            }}
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
