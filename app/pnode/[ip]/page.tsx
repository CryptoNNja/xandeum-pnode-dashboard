"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/lib/theme";

interface PNodeData {
  ip: string;
  status: string;
  stats: any;
  version?: string;
}

interface GeoData {
  city: string;
  country: string;
  country_code: string;
  isp: string;
}

export default function PNodeDetail({
  params,
}: {
  params: Promise<{ ip: string }>;
}) {
  const { ip } = use(params);
  const decodedIp = decodeURIComponent(ip);
  const router = useRouter();
  const { themeId } = useTheme();
  const isDay = themeId === "day";

  const [pnodeData, setPnodeData] = useState<PNodeData | null>(null);
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const updateHistory = (newCpu: number) => {
    setHistoryData((prev) => {
      const now = new Date();
      const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      const newPoint = { time: timeLabel, cpu: newCpu };
      const newHistory = [...prev, newPoint];
      if (newHistory.length > 40) newHistory.shift();
      return newHistory;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pnodes");
        const data: PNodeData[] = await res.json();
        const node = data.find((n) => n.ip === decodedIp);

        if (node) {
          setPnodeData(node);

          if (node.stats && node.stats.cpu_percent !== undefined) {
            updateHistory(node.stats.cpu_percent);
          }

          if (!geoData) {
            fetch(`https://ipwho.is/${decodedIp}`)
              .then((r) => r.json())
              .then((geo) => {
                if (geo.success) {
                  setGeoData({
                    city: geo.city,
                    country: geo.country,
                    country_code: geo.country_code,
                    isp: geo.isp,
                  });
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [decodedIp, geoData]);

  const formatBytes = (bytes: number) =>
    (bytes / 1_000_000_000).toFixed(2) + " GB";

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  if (loading && !pnodeData) {
    return (
      <main
        className={`min-h-screen flex items-center justify-center ${
          isDay ? "bg-slate-950" : "bg-[#020617]"
        }`}
      >
        <div className="w-12 h-12 border-4 border-[#00D4AA] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!pnodeData) {
    return (
      <main
        className={`min-h-screen flex flex-col items-center justify-center text-white ${
          isDay ? "bg-slate-950" : "bg-[#020617]"
        }`}
      >
        <h1 className="text-2xl font-bold mb-4">Node Not Found</h1>
        <button
          onClick={() => router.push("/")}
          className="text-[#00D4AA] hover:underline"
        >
          ← Back to Dashboard
        </button>
      </main>
    );
  }

  const isPrivate =
    pnodeData.status === "gossip_only" || pnodeData.stats.uptime === 0;
  const statusColor = isPrivate
    ? "text-gray-400 bg-gray-800/50 border-gray-600"
    : "text-[#00D4AA] bg-[#00D4AA]/20 border-[#00D4AA]/30";
  const statusLabel = isPrivate ? "PRIVATE / SECURED" : "PUBLIC / ACTIVE";

  const mainBg = isDay ? "bg-slate-950" : "bg-[#020617]";
  const surface = isDay ? "bg-slate-900" : "bg-[#1A1F3A]";

  return (
    <main className={`min-h-screen text-white pb-20 flex flex-col ${mainBg}`}>
      <div
        className={`bg-gradient-to-r border-b border-[#1F2937] py-6 px-8 ${
          isDay
            ? "from-slate-800 to-slate-900"
            : "from-[#020617] via-slate-900 to-black"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="text-gray-300 hover:text-white text-sm mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-mono font-bold text-white">
                  {decodedIp}
                </h1>
                <span
                  className={`px-3 py-1 rounded text-xs font-bold border ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-200">
                {geoData ? (
                  <>
                    <img
                      src={`https://flagcdn.com/24x18/${geoData.country_code.toLowerCase()}.png`}
                      alt={geoData.country}
                      className="rounded shadow-sm"
                    />
                    <span className="text-gray-100">
                      {geoData.city}, {geoData.country}
                    </span>
                    <span className="text-gray-400 text-xs">
                      • {geoData.isp}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-300">Locating...</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-300 uppercase tracking-wider">
                Client Version
              </div>
              <div className="text-xl font-mono text-[#7B3FF2]">
                {pnodeData.version || "Unknown"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 w-full flex-1">
        {isPrivate ? (
          <div
            className={`border border-[#2D3454] rounded-2xl p-12 text-center ${surface}`}
          >
            <div className="w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#374151]">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  ry="2"
                />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Secured Node
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm">
              This pNode is participating in the Gossip network but has
              restricted RPC access (Port 6000 closed). Metrics are not
              publicly available.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div
                className={`p-6 rounded-xl border border-[#2D3454] ${surface}`}
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  CPU Load
                </p>
                <p className="text-3xl font-bold text-[#00D4AA]">
                  {pnodeData.stats.cpu_percent.toFixed(1)}%
                </p>
                <div className="w-full h-1 bg-gray-700 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#00D4AA]"
                    style={{
                      width: `${Math.min(
                        pnodeData.stats.cpu_percent,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div
                className={`p-6 rounded-xl border border-[#2D3454] ${surface}`}
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  RAM Usage
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatBytes(pnodeData.stats.ram_used)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {formatBytes(pnodeData.stats.ram_total)}
                </p>
              </div>

              <div
                className={`p-6 rounded-xl border border-[#2D3454] ${surface}`}
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Storage
                </p>
                <p className="text-3xl font-bold text-[#7B3FF2]">
                  {formatBytes(pnodeData.stats.file_size)}
                </p>
              </div>

              <div
                className={`p-6 rounded-xl border border-[#2D3454] ${surface}`}
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Uptime
                </p>
                <p className="text-3xl font-bold text-[#F59E0B]">
                  {formatUptime(pnodeData.stats.uptime)}
                </p>
              </div>
            </div>

            <div
              className={`p-6 rounded-xl border border-[#2D3454] ${surface}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Live CPU Monitor
                </h3>
                <span className="text-[11px] text-gray-400 font-mono">
                  Sampling every 3s from pRPC
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient
                        id="colorCpuDetail"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#00D4AA"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#00D4AA"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1F2933"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#6B7280"
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#00D4AA",
                      }}
                      labelStyle={{ color: "#E5E7EB" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      stroke="#00D4AA"
                      fillOpacity={1}
                      fill="url(#colorCpuDetail)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
