"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PNodeStats {
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  file_size: number;
  uptime: number;
  packets_sent: number;
  packets_received: number;
}

interface PNodeData {
  ip: string;
  stats: PNodeStats;
}
export default function PNodeDetail() {
  const params = useParams();
  const router = useRouter();
  const ip = params.ip as string;

  const [pnodeData, setPnodeData] = useState<PNodeData | null>(null);
  const [allPNodes, setAllPNodes] = useState<PNodeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Générer des données historiques simulées (pour la démo)
  const generateHistoricalData = (currentCPU: number) => {
    const data = [];
    const now = Date.now();

    // Valeurs de base pour les packets (simulation réaliste)
    const basePacketsSent = pnodeData?.stats.packets_sent || 3000;
    const basePacketsReceived = pnodeData?.stats.packets_received || 3000;

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000);
      const hour = time.getHours();

      // Simulation: variation aléatoire autour de la valeur actuelle
      const variation = (Math.random() - 0.5) * 2;
      const cpu = Math.max(0, Math.min(100, currentCPU + variation));

      // Simulation packets avec variation horaire
      const hourVariation = Math.sin((hour / 24) * Math.PI * 2) * 500; // Variation journalière
      const randomVariation = (Math.random() - 0.5) * 200;

      data.push({
        time: `${hour}h`,
        cpu: parseFloat(cpu.toFixed(2)),
        ram: parseFloat((Math.random() * 20 + 60).toFixed(1)), // RAM entre 60-80%
        packetsSent: Math.floor(
          basePacketsSent / 24 + hourVariation + randomVariation
        ),
        packetsReceived: Math.floor(
          basePacketsReceived / 24 + hourVariation + (Math.random() - 0.5) * 200
        ),
      });
    }

    return data;
  };

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/pnodes");
        const data: PNodeData[] = await response.json();

        setAllPNodes(data);

        // Trouver le pNode spécifique
        const currentPNode = data.find((p) => p.ip === ip);
        setPnodeData(currentPNode || null);
      } catch (error) {
        console.error("Error loading pNode data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ip]);

  // Fonctions utilitaires
  const formatBytes = (bytes: number) => {
    return (bytes / 1_000_000_000).toFixed(2) + " GB";
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const getHealthStatus = (cpu: number, uptime: number) => {
    const hours = uptime / 3600;
    if (cpu < 1 && hours >= 24)
      return {
        status: "Excellent",
        color: "text-green-400",
        bg: "bg-green-500/20",
      };
    if (cpu < 2 && hours >= 12)
      return { status: "Good", color: "text-cyan-400", bg: "bg-cyan-500/20" };
    if (cpu < 5 && hours >= 1)
      return {
        status: "Warning",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
      };
    return { status: "Critical", color: "text-red-400", bg: "bg-red-500/20" };
  };

  // Calculer les moyennes du réseau
  const networkAvg = {
    cpu:
      allPNodes.length > 0
        ? allPNodes.reduce((acc, p) => acc + p.stats.cpu_percent, 0) /
          allPNodes.length
        : 0,
    ram:
      allPNodes.length > 0
        ? allPNodes.reduce(
            (acc, p) => acc + (p.stats.ram_used / p.stats.ram_total) * 100,
            0
          ) / allPNodes.length
        : 0,
    uptime:
      allPNodes.length > 0
        ? allPNodes.reduce((acc, p) => acc + p.stats.uptime, 0) /
          allPNodes.length
        : 0,
  };

  // États de chargement et erreur
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00D4AA]"></div>
          <p className="text-gray-400 mt-6 text-lg">Loading pNode data...</p>
        </div>
      </main>
    );
  }

  if (!pnodeData) {
    return (
      <main className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">
            pNode Not Found
          </h1>
          <p className="text-gray-400 mb-8">
            IP {ip} is not responding or doesn't exist
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#7B3FF2] to-[#00D4AA] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const health = getHealthStatus(
    pnodeData.stats.cpu_percent,
    pnodeData.stats.uptime
  );
  const historicalData = generateHistoricalData(pnodeData.stats.cpu_percent);
  const ramPercent = (
    (pnodeData.stats.ram_used / pnodeData.stats.ram_total) *
    100
  ).toFixed(1);

  return (
    <main className="min-h-screen bg-[#0A0E27] text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7B3FF2] to-[#00D4AA] py-6">
        <div className="max-w-7xl mx-auto px-8">
          <button
            onClick={() => router.push("/")}
            className="mb-4 text-white/80 hover:text-white transition flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-1 flex items-center gap-3">
                <span className="text-white">pNode</span>
                <span className="text-[#00D4AA]">{ip}</span>
              </h1>
              <p className="text-white/80 text-sm">
                Detailed analytics and performance metrics
              </p>
            </div>
            <div
              className={`px-6 py-3 rounded-full ${health.bg} ${health.color} font-bold text-lg`}
            >
              {health.status}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454]">
            <p className="text-gray-400 text-sm mb-1">CPU Usage</p>
            <p className="text-3xl font-bold text-[#00D4AA]">
              {pnodeData.stats.cpu_percent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Network avg: {networkAvg.cpu.toFixed(2)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454]">
            <p className="text-gray-400 text-sm mb-1">RAM Usage</p>
            <p className="text-3xl font-bold text-[#7B3FF2] mb-3">
              {ramPercent}%
            </p>
            {/* Barre de progression */}
            <div className="w-full bg-[#0F1419] rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-[#7B3FF2] to-[#9D5FFF] h-2 rounded-full transition-all duration-500"
                style={{ width: `${ramPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {formatBytes(pnodeData.stats.ram_used)} /{" "}
              {formatBytes(pnodeData.stats.ram_total)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454]">
            <p className="text-gray-400 text-sm mb-1">Storage</p>
            <p className="text-3xl font-bold text-[#10B981] mb-3">
              {formatBytes(pnodeData.stats.file_size)}
            </p>
            {/* Barre de progression (simulée sur 500GB max) */}
            <div className="w-full bg-[#0F1419] rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (pnodeData.stats.file_size / 500_000_000_000) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">Max: 500 GB</p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F3A] to-[#0F1419] p-6 rounded-xl border border-[#2D3454]">
            <p className="text-gray-400 text-sm mb-1">Uptime</p>
            <p className="text-3xl font-bold text-[#F59E0B]">
              {formatUptime(pnodeData.stats.uptime)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Network avg: {formatUptime(networkAvg.uptime)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* CPU History */}
          <div className="bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
            <h3 className="text-xl font-bold mb-4 text-[#00D4AA]">
              CPU Usage - Last 24h
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
                <XAxis
                  dataKey="time"
                  stroke="#94A3B8"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1F3A",
                    border: "1px solid #00D4AA",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  dot={false}
                  name="CPU %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* RAM History */}
          <div className="bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
            <h3 className="text-xl font-bold mb-4 text-[#7B3FF2]">
              RAM Usage - Last 24h
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
                <XAxis
                  dataKey="time"
                  stroke="#94A3B8"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1F3A",
                    border: "1px solid #7B3FF2",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ram"
                  stroke="#7B3FF2"
                  fill="#7B3FF2"
                  fillOpacity={0.3}
                  name="RAM %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Activity */}
        {/* Network Activity */}
        <div className="bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
          <h3 className="text-xl font-bold mb-4 text-[#10B981]">
            Network Activity - Last 24h
          </h3>

          {/* Stats actuelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0F1419] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Total Packets Sent</p>
              <p className="text-3xl font-bold text-[#00D4AA]">
                {pnodeData.stats.packets_sent.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#0F1419] p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">
                Total Packets Received
              </p>
              <p className="text-3xl font-bold text-[#7B3FF2]">
                {pnodeData.stats.packets_received.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Graphique */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
              <XAxis
                dataKey="time"
                stroke="#94A3B8"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1F3A",
                  border: "1px solid #10B981",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="packetsSent"
                stroke="#00D4AA"
                strokeWidth={2}
                dot={false}
                name="Packets Sent"
              />
              <Line
                type="monotone"
                dataKey="packetsReceived"
                stroke="#7B3FF2"
                strokeWidth={2}
                dot={false}
                name="Packets Received"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison with Network */}
        <div className="mt-8 bg-[#1A1F3A] p-6 rounded-xl border border-[#2D3454]">
          <h3 className="text-xl font-bold mb-4 text-white">
            Comparison with Network Average
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">CPU Performance</p>
              <p
                className={`text-2xl font-bold ${
                  pnodeData.stats.cpu_percent < networkAvg.cpu
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {pnodeData.stats.cpu_percent < networkAvg.cpu
                  ? "↓ Better"
                  : "↑ Higher"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.abs(pnodeData.stats.cpu_percent - networkAvg.cpu).toFixed(
                  2
                )}
                %{" "}
                {pnodeData.stats.cpu_percent < networkAvg.cpu
                  ? "below"
                  : "above"}{" "}
                average
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">RAM Usage</p>
              <p
                className={`text-2xl font-bold ${
                  parseFloat(ramPercent) < networkAvg.ram
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {parseFloat(ramPercent) < networkAvg.ram
                  ? "↓ Lower"
                  : "↑ Higher"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.abs(parseFloat(ramPercent) - networkAvg.ram).toFixed(1)}%{" "}
                {parseFloat(ramPercent) < networkAvg.ram ? "below" : "above"}{" "}
                average
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Uptime</p>
              <p
                className={`text-2xl font-bold ${
                  pnodeData.stats.uptime > networkAvg.uptime
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {pnodeData.stats.uptime > networkAvg.uptime
                  ? "↑ Better"
                  : "↓ Lower"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatUptime(
                  Math.abs(pnodeData.stats.uptime - networkAvg.uptime)
                )}{" "}
                {pnodeData.stats.uptime > networkAvg.uptime ? "above" : "below"}{" "}
                average
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
