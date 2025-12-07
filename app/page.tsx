"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Custom Tooltip Dark Style
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1F3A] border border-[#00D4AA] rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type SortKey = "ip" | "cpu" | "ram" | "storage" | "uptime";
type SortDirection = "asc" | "desc";

export default function Home() {
  const [pnodes, setPnodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ip");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showAlerts, setShowAlerts] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const response = await fetch("/api/pnodes");
      const data = await response.json();
      setPnodes(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = () => {
    if (!lastUpdate) return "";
    const seconds = Math.floor((currentTime - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1_000_000_000).toFixed(0) + " GB";
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return hours + " h";
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSortValue = (pnode: any, key: SortKey) => {
    switch (key) {
      case "ip":
        return pnode.ip;
      case "cpu":
        return pnode.stats.cpu_percent;
      case "ram":
        return pnode.stats.ram_used;
      case "storage":
        return pnode.stats.file_size;
      case "uptime":
        return pnode.stats.uptime;
      default:
        return pnode.ip;
    }
  };

  const filteredAndSortedPNodes = pnodes
    .filter((pnode) =>
      pnode.ip.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  // Distribution CPU (histogramme)
  const cpuDistribution = [
    { range: "0-1%", count: filteredAndSortedPNodes.filter(p => p.stats.cpu_percent < 1).length, color: "#10B981" },
    { range: "1-2%", count: filteredAndSortedPNodes.filter(p => p.stats.cpu_percent >= 1 && p.stats.cpu_percent < 2).length, color: "#00D4AA" },
    { range: "2-5%", count: filteredAndSortedPNodes.filter(p => p.stats.cpu_percent >= 2 && p.stats.cpu_percent < 5).length, color: "#F59E0B" },
    { range: ">5%", count: filteredAndSortedPNodes.filter(p => p.stats.cpu_percent >= 5).length, color: "#EF4444" },
  ];

  // Distribution Storage (histogramme)
  const storageDistribution = [
    { range: "0-50 GB", count: filteredAndSortedPNodes.filter(p => p.stats.file_size < 50_000_000_000).length },
    { range: "50-100 GB", count: filteredAndSortedPNodes.filter(p => p.stats.file_size >= 50_000_000_000 && p.stats.file_size < 100_000_000_000).length },
    { range: "100-200 GB", count: filteredAndSortedPNodes.filter(p => p.stats.file_size >= 100_000_000_000 && p.stats.file_size < 200_000_000_000).length },
    { range: "200-500 GB", count: filteredAndSortedPNodes.filter(p => p.stats.file_size >= 200_000_000_000 && p.stats.file_size < 500_000_000_000).length },
    { range: ">500 GB", count: filteredAndSortedPNodes.filter(p => p.stats.file_size >= 500_000_000_000).length },
  ];

  // Health Score
  const getHealthStatus = (pnode: any) => {
    const cpu = pnode.stats.cpu_percent;
    const uptime = pnode.stats.uptime;
    const hours = uptime / 3600;

    if (cpu < 1 && hours >= 24) return "Excellent";
    if (cpu < 2 && hours >= 12) return "Good";
    if (cpu < 5 && hours >= 1) return "Warning";
    return "Critical";
  };

  // Alert system  
  const getAlerts = () => {
    const alerts: { type: string; message: string; ip: string; severity: 'critical' | 'warning' }[] = [];

    filteredAndSortedPNodes.forEach((pnode) => {
      const cpu = pnode.stats.cpu_percent;
      const uptime = pnode.stats.uptime;
      const hours = uptime / 3600;

      // Critical alerts
      if (cpu >= 5) {
        alerts.push({
          type: 'High CPU',
          message: `CPU at ${cpu.toFixed(1)}% (Critical)`,
          ip: pnode.ip,
          severity: 'critical'
        });
      }

      if (hours < 1) {
        alerts.push({
          type: 'Recently Restarted',
          message: `Uptime only ${Math.floor(hours * 60)}m`,
          ip: pnode.ip,
          severity: 'critical'
        });
      }

      // Warning alerts
      if (cpu >= 2 && cpu < 5) {
        alerts.push({
          type: 'Elevated CPU',
          message: `CPU at ${cpu.toFixed(1)}%`,
          ip: pnode.ip,
          severity: 'warning'
        });
      }

      if (hours >= 1 && hours < 12) {
        alerts.push({
          type: 'Low Uptime',
          message: `Uptime ${Math.floor(hours)}h`,
          ip: pnode.ip,
          severity: 'warning'
        });
      }
    });

    return alerts;
  };
  const alerts = getAlerts();
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const healthDistribution = [
    { name: "Excellent", value: filteredAndSortedPNodes.filter(p => getHealthStatus(p) === "Excellent").length, color: "#10B981" },
    { name: "Good", value: filteredAndSortedPNodes.filter(p => getHealthStatus(p) === "Good").length, color: "#00D4AA" },
    { name: "Warning", value: filteredAndSortedPNodes.filter(p => getHealthStatus(p) === "Warning").length, color: "#F59E0B" },
    { name: "Critical", value: filteredAndSortedPNodes.filter(p => getHealthStatus(p) === "Critical").length, color: "#EF4444" },
  ].filter(item => item.value > 0);

  return (
    <main className="min-h-screen bg-[#0A0E27] text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7B3FF2] to-[#00D4AA] py-6">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-1 flex items-center gap-3">
                <span className="text-white">Xandeum</span>
                <span className="text-[#00D4AA]">pNode</span>
                <span className="text-white">Analytics</span>
              </h1>
              <p className="text-white/80 text-sm">
                Real-time monitoring for Xandeum Provider Nodes
              </p>
            </div>

            <div className="text-right flex items-center gap-4 justify-end">
              {/* Alert Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg transition-all border border-white/30 relative"
                >
                  <span className="text-2xl">🔔</span>
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                  {criticalCount > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      !
                    </span>
                  )}
                </button>

                {/* Alerts Panel */}
                {showAlerts && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-[#1A1F3A] border border-[#2D3454] rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-[#2D3454]">
                      <h3 className="text-lg font-bold text-white">System Alerts</h3>
                      <p className="text-sm text-gray-400">
                        {alerts.length} alert{alerts.length !== 1 ? 's' : ''} detected
                        {criticalCount > 0 && (
                          <span className="ml-2 text-red-400 font-semibold">
                            ({criticalCount} critical)
                          </span>
                        )}
                      </p>
                    </div>

                    {alerts.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-green-400 text-lg font-semibold">✓ All Systems Healthy</p>
                        <p className="text-gray-500 text-sm mt-2">No alerts to display</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#2D3454]">
                        {alerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-4 hover:bg-[#0F1419] transition-colors cursor-pointer ${alert.severity === 'critical' ? 'border-l-4 border-red-500' : 'border-l-4 border-yellow-500'
                              }`}
                            onClick={() => window.location.href = `/pnode/${alert.ip}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {alert.type}
                              </span>
                              <span className="text-xs text-gray-500">{alert.ip}</span>
                            </div>
                            <p className="text-sm text-white">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 backdrop-blur-sm px-6 py-2 rounded-lg transition-all font-semibold border border-white/30"
              >
                {refreshing ? "Refreshing..." : "Refresh Now"}
              </button>
              {lastUpdate && (
                <p className="text-sm text-white/70 mt-2">
                  Last updated: {getTimeAgo()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search by IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A1F3A] text-white px-6 py-4 rounded-xl border border-[#2D3454] focus:border-[#00D4AA] focus:outline-none transition-colors placeholder:text-gray-500"
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454] hover:border-[#00D4AA] transition-all">
            <p className="text-gray-400 text-sm mb-1">Total pNodes</p>
            <p className="text-4xl font-bold text-[#00D4AA]">{filteredAndSortedPNodes.length}</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454] hover:border-[#7B3FF2] transition-all">
            <p className="text-gray-400 text-sm mb-1">Total Storage</p>
            <p className="text-4xl font-bold text-[#7B3FF2]">
              {filteredAndSortedPNodes.reduce((acc, p) => acc + (p.stats?.file_size || 0), 0) / 1_000_000_000 | 0} GB
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454] hover:border-[#10B981] transition-all">
            <p className="text-gray-400 text-sm mb-1">Avg CPU</p>
            <p className="text-4xl font-bold text-[#10B981]">
              {filteredAndSortedPNodes.length > 0
                ? (filteredAndSortedPNodes.reduce((acc, p) => acc + (p.stats?.cpu_percent || 0), 0) / filteredAndSortedPNodes.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454] hover:border-[#F59E0B] transition-all">
            <p className="text-gray-400 text-sm mb-1">Avg Uptime</p>
            <p className="text-4xl font-bold text-[#F59E0B]">
              {filteredAndSortedPNodes.length > 0
                ? Math.floor(filteredAndSortedPNodes.reduce((acc, p) => acc + (p.stats?.uptime || 0), 0) / filteredAndSortedPNodes.length / 3600)
                : 0} h
            </p>
          </div>
        </div>

        {/* Network Analytics Charts */}
        {!loading && filteredAndSortedPNodes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* CPU Distribution */}
            <div className="bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
              <h3 className="text-xl font-bold mb-4 text-[#00D4AA]">CPU Load Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cpuDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
                  <XAxis dataKey="range" stroke="#94A3B8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 212, 170, 0.1)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {cpuDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Storage Distribution */}
            <div className="bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
              <h3 className="text-xl font-bold mb-4 text-[#7B3FF2]">Storage Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={storageDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
                  <XAxis dataKey="range" stroke="#94A3B8" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={60} />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(123, 63, 242, 0.1)' }} />
                  <Bar dataKey="count" fill="#7B3FF2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Network Health */}
            <div className="bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
              <h3 className="text-xl font-bold mb-4 text-[#10B981]">Network Health</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {healthDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sort Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {[
            { key: "ip" as SortKey, label: "IP Address" },
            { key: "cpu" as SortKey, label: "CPU Usage" },
            { key: "ram" as SortKey, label: "RAM Used" },
            { key: "storage" as SortKey, label: "Storage" },
            { key: "uptime" as SortKey, label: "Uptime" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${sortKey === key
                ? "bg-gradient-to-r from-[#7B3FF2] to-[#00D4AA] text-white"
                : "bg-[#1A1F3A] text-gray-300 hover:bg-[#2D3454] border border-[#2D3454]"
                }`}
            >
              {label}<SortIcon columnKey={key} />
            </button>
          ))}
        </div>

        {/* pNodes List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00D4AA]"></div>
            <p className="text-gray-400 mt-6 text-lg">Discovering pNodes...</p>
          </div>
        ) : filteredAndSortedPNodes.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1F3A] rounded-xl border border-[#2D3454]">
            <p className="text-gray-400 text-lg">No pNodes found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedPNodes.map((pnode) => (
              <div
                key={pnode.ip}
                onClick={() => window.location.href = `/pnode/${pnode.ip}`}
                className={`bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454] hover:border-[#00D4AA] transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-xl hover:shadow-[#00D4AA]/20 ${refreshing ? "opacity-50" : "opacity-100"
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-[#00D4AA] group-hover:text-[#00D4AA] transition-colors flex items-center gap-2">
                    {pnode.ip}
                    <span className="text-sm text-gray-500 group-hover:text-[#00D4AA] transition-colors">
                      Click for details
                    </span>
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getHealthStatus(pnode) === "Excellent" ? "bg-green-500/20 text-green-400" :
                      getHealthStatus(pnode) === "Good" ? "bg-cyan-500/20 text-cyan-400" :
                        getHealthStatus(pnode) === "Warning" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                      }`}>
                      {getHealthStatus(pnode)}
                    </span>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#00D4AA]/10 group-hover:bg-[#00D4AA]/20 transition-colors">
                      <span className="text-[#00D4AA] text-xl">→</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">CPU Usage</p>
                    <p className="text-xl font-semibold text-white">
                      {pnode.stats.cpu_percent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">RAM Used</p>
                    <p className="text-xl font-semibold text-white">
                      {formatBytes(pnode.stats.ram_used)} / {formatBytes(pnode.stats.ram_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Storage</p>
                    <p className="text-xl font-semibold text-white">
                      {formatBytes(pnode.stats.file_size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Uptime</p>
                    <p className="text-xl font-semibold text-white">
                      {formatUptime(pnode.stats.uptime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Packets Sent</p>
                    <p className="text-xl font-semibold text-white">
                      {pnode.stats.packets_sent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Packets Received</p>
                    <p className="text-xl font-semibold text-white">
                      {pnode.stats.packets_received.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#2D3454]">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-gray-400 text-sm mb-2">
                Built for <span className="text-[#7B3FF2] font-semibold">Xandeum</span> • Superteam Earn Bounty
              </p>
              <p className="text-gray-500 text-xs">
                Powered by Xandeum pRPC & Gossip Protocol • Auto-discovery enabled
              </p>
            </div>

            {/* Ninja Badge */}
            <div className="flex items-center gap-3 bg-[#1A1F3A]/50 px-4 py-2 rounded-full border border-[#2D3454]/50 backdrop-blur-sm">
              <img
                src="/avatar-ninja.png"
                alt="Ninja0x"
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%237B3FF2'/%3E%3Ctext x='16' y='22' text-anchor='middle' fill='white' font-size='16'%3EN%3C/text%3E%3C/svg%3E";
                }}
              />
              <p className="text-gray-400 text-xs">
                Coded with <span className="text-red-400">❤️</span> by <span className="text-[#00D4AA] font-semibold">Ninja0x</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}