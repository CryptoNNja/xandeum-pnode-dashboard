'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import HistoryChart from '@/components/HistoryChart';
import ScoreDisplay from '@/components/ScoreDisplay';
import { getHealthStatus } from '@/lib/health';
import type { PNode } from '@/lib/types';
import { useToast } from '@/components/common/Toast';

// Helper to get CSS variable value
const getCssVar = (varName: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

const getStatusColors = (): Record<string, string> => ({
  Excellent: getCssVar("--kpi-excellent", "#10B981"),
  Good: getCssVar("--kpi-good", "#3B82F6"),
  Warning: getCssVar("--kpi-warning", "#F59E0B"),
  Critical: getCssVar("--kpi-critical", "#EF4444"),
  Private: getCssVar("--kpi-private", "#64748B"),
});

const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#', '');
    const isShort = sanitized.length === 3;
    const full = isShort
      ? sanitized
        .split('')
        .map((char) => char + char)
        .join('')
      : sanitized.padEnd(6, '0');
    const r = parseInt(full.substring(0, 2), 16) || 0;
    const g = parseInt(full.substring(2, 4), 16) || 0;
    const b = parseInt(full.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
  
const getStatusStyles = (status: string) => {
    const statusColors = getStatusColors();
    const base = statusColors[status] || statusColors.Private;
    return {
      color: base,
      backgroundColor: hexToRgba(base, 0.15),
      border: `1px solid ${hexToRgba(base, 0.35)}`,
      boxShadow: `0 8px 18px ${hexToRgba(base, 0.18)}`,
    };
};

const formatBytes = (bytes: number) =>
    bytes > 0 ? (bytes / 1_000_000_000).toFixed(2) + ' GB' : '-';

const formatUptime = (seconds: number) => {
    if (seconds <= 0) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
};

export default function PNodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ip = params.ip as string;
  const toast = useToast();

  const [pnode, setPNode] = useState<PNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodeData = async () => {
      if (!ip) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/pnodes/${ip}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Node ${ip} not found`);
          }
          throw new Error(`Failed to load node data (${res.status})`);
        }
        const node: PNode = await res.json();
        setPNode(node);
        toast.success(`Node ${ip} loaded successfully`);
      } catch (e: any) {
        const errorMessage = e.message || 'Failed to fetch node data';
        setError(errorMessage);
        console.error(e);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchNodeData();
  }, [ip]);

  // Note: getHealthStatus will use cached network context from the main dashboard
  // This ensures consistent health calculation even without direct access to allNodes
  const health = useMemo(() => pnode ? getHealthStatus(pnode) : 'Private', [pnode]);
  
  const ramPercent = useMemo(() => {
    if (!pnode || !pnode.stats.ram_total || pnode.stats.ram_total === 0) return 0;
    return Math.round((pnode.stats.ram_used / pnode.stats.ram_total) * 100);
  }, [pnode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-app text-text-main flex items-center justify-center">
        <Loader2
          className="w-12 h-12 animate-spin"
          style={{ color: 'var(--accent-aqua)' }}
        />
      </main>
    );
  }

  if (error || !pnode) {
    return (
      <main className="min-h-screen bg-bg-app text-text-main p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-aqua)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div
          className="max-w-7xl mx-auto mt-8 rounded-xl p-8 text-center border theme-transition shadow-xl"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-app)' }}
        >
          <AlertCircle
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--kpi-critical)' }}
          />
          <p className="text-xl" style={{ color: 'var(--text-soft)' }}>
            {error || "Node data could not be loaded."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-app text-text-main pb-20">
      <div className="border-b border-border-app bg-bg2">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: 'var(--accent-aqua)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold font-mono">{ip}</h1>
              <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                pNode Details & Analytics
              </p>
            </div>
            <span
              className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide theme-transition"
              style={getStatusStyles(health)}
            >
              {health}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        <div className="bg-bg-card border border-border-app rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold mb-4 uppercase">Node Status</h2>
            </div>
            <ScoreDisplay pnode={pnode} size="md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-1">Status</p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent-aqua)' }}>
                {pnode.status.replace('_', ' ')}
              </p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-1">Version</p>
              <p className="text-lg font-bold">{pnode.version || 'Unknown'}</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-1">Uptime</p>
              <p className="text-lg font-bold">{formatUptime(pnode.stats.uptime)}</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-1">Updated</p>
              <p className="text-lg font-bold">{pnode.stats.last_updated > 0 ? new Date(pnode.stats.last_updated * 1000).toLocaleTimeString() : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-app rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">CPU</p>
              <p className="text-2xl font-bold text-kpi-good">{pnode.stats.cpu_percent.toFixed(1)}%</p>
              <div className="w-full bg-bg-app rounded-full h-2 mt-3">
                <div className="h-full bg-kpi-good rounded-full" style={{ width: `${Math.min(pnode.stats.cpu_percent, 100)}%` }} />
              </div>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">RAM</p>
              <p className="text-2xl font-bold text-kpi-good">{ramPercent}%</p>
              <p className="text-xs text-text-faint mt-1">{formatBytes(pnode.stats.ram_used)} / {formatBytes(pnode.stats.ram_total)}</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Storage Committed</p>
              <p className="text-2xl font-bold text-accent">{formatBytes(pnode.stats.storage_committed ?? 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-app rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">Blockchain Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Active Streams</p>
              <p className="text-2xl font-bold text-green-400">{pnode.stats.active_streams ?? 0}</p>
              <p className="text-xs text-text-faint mt-1">Real-time data channels</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Total Pages</p>
              <p className="text-2xl font-bold text-accent-purple">{(pnode.stats.total_pages ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Blockchain data indexed</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Current Index</p>
              <p className="text-2xl font-bold text-blue-400">{(pnode.stats.current_index ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Indexing position</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Packets Sent</p>
              <p className="text-2xl font-bold text-accent-aqua">{(pnode.stats.packets_sent ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Network traffic out</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Packets Received</p>
              <p className="text-2xl font-bold text-kpi-warning">{(pnode.stats.packets_received ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Network traffic in</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Total Packets</p>
              <p className="text-2xl font-bold text-text-main">{((pnode.stats.packets_sent ?? 0) + (pnode.stats.packets_received ?? 0)).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Combined traffic</p>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-card border border-border-app rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">24h History</h2>
          <HistoryChart ip={ip} />
        </motion.div>
      </div>
    </main>
  );
}
