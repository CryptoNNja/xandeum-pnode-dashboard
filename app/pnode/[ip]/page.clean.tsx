'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import HistoryChart from '@/components/HistoryChart';

interface PNodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
}

interface PNode {
  ip: string;
  status: string;
  stats: PNodeStats;
  version?: string;
}

export default function PNodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ip = params.ip as string;

  const [pnode, setPNode] = useState<PNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const res = await fetch('/api/pnodes');
        const allNodes: PNode[] = await res.json();
        const node = allNodes.find((n) => n.ip === ip);

        if (node) {
          setPNode(node);
        } else {
          setError('Node not found');
        }
      } catch (e) {
        setError('Failed to fetch node data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (ip) {
      fetchNodeData();
    }
  }, [ip]);

  const formatBytes = (bytes: number) =>
    bytes > 0 ? (bytes / 1_000_000_000).toFixed(2) + ' GB' : '-';

  const formatUptime = (seconds: number) => {
    if (seconds <= 0) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const getHealthStatus = (node: PNode) => {
    if (node.status === 'gossip_only' || !node.stats || node.stats.uptime === 0)
      return 'Private';

    const cpu = node.stats.cpu_percent;
    const hours = node.stats.uptime / 3600;

    if (cpu >= 90) return 'Critical';
    if (hours < 1) return 'Warning';
    if (cpu >= 70) return 'Warning';
    if (cpu < 20 && hours >= 24) return 'Excellent';
    return 'Good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-[#10B981] text-white';
      case 'Good': return 'bg-[#3B82F6] text-white';
      case 'Warning': return 'bg-[#F59E0B] text-white';
      case 'Critical': return 'bg-[#EF4444] text-white';
      default: return 'bg-[#64748B] text-white';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0E27] text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#00D4AA]" />
      </main>
    );
  }

  if (error || !pnode) {
    return (
      <main className="min-h-screen bg-[#0A0E27] text-white p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#00D4AA] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="max-w-7xl mx-auto bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
          <p className="text-xl text-gray-300">{error}</p>
        </div>
      </main>
    );
  }

  const health = getHealthStatus(pnode);
  const ramPercent = pnode.stats.ram_total > 0 ? Math.round((pnode.stats.ram_used / pnode.stats.ram_total) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0A0E27] text-white pb-20">
      <div className="border-b border-[#2D3454] bg-[#111827]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#00D4AA] mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold font-mono">{ip}</h1>
              <p className="text-gray-400 text-sm">pNode Details & Analytics</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getStatusColor(health)}`}>{health}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">Node Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-1">Status</p>
              <p className="text-lg font-bold text-[#00D4AA]">{pnode.status}</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-1">Version</p>
              <p className="text-lg font-bold">{pnode.version || 'Unknown'}</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-1">Uptime</p>
              <p className="text-lg font-bold">{formatUptime(pnode.stats.uptime)}</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-1">Updated</p>
              <p className="text-lg font-bold">{pnode.stats.last_updated > 0 ? new Date(pnode.stats.last_updated * 1000).toLocaleTimeString() : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-2">CPU</p>
              <p className="text-2xl font-bold text-[#10B981]">{pnode.stats.cpu_percent.toFixed(1)}%</p>
              <div className="w-full bg-[#0A0E27] rounded-full h-2 mt-3">
                <div className="h-full bg-[#10B981] rounded-full" style={{width: `${Math.min(pnode.stats.cpu_percent, 100)}%`}} />
              </div>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-2">RAM</p>
              <p className="text-2xl font-bold text-[#3B82F6]">{ramPercent}%</p>
              <p className="text-xs text-gray-400 mt-1">{formatBytes(pnode.stats.ram_used)} / {formatBytes(pnode.stats.ram_total)}</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-2">Storage</p>
              <p className="text-2xl font-bold text-[#7B3FF2]">{formatBytes(pnode.stats.file_size)}</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-2">Sent</p>
              <p className="text-2xl font-bold text-[#00D4AA]">{(pnode.stats.packets_sent / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-2">Received</p>
              <p className="text-2xl font-bold text-[#F59E0B]">{(pnode.stats.packets_received / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="bg-[#111827] p-4 rounded-lg">
              <p className="text-gray-400 text-xs uppercase mb-2">Streams</p>
              <p className="text-2xl font-bold">{pnode.stats.active_streams}</p>
            </div>
          </div>
        </div>

        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">24h History</h2>
          <HistoryChart ip={ip} />
        </motion.div>
      </div>
    </main>
  );
}
