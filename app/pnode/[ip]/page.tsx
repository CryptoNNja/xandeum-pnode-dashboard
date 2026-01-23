'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import HistoryChart from '@/components/HistoryChart';
import ScoreDisplay from '@/components/ScoreDisplay';
import FloatingActionButton from '@/components/FloatingActionButton';
import { getHealthStatus } from '@/lib/health';
import type { PNode } from '@/lib/types';
import { useToast } from '@/components/common/Toast';
import { exportPNodeToPDF } from '@/lib/pnode-pdf-export';
import { Download, FileJson, Link2, Star } from 'lucide-react';

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
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const OLD_formatUptime = (seconds: number) => {
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
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsRank, setCreditsRank] = useState<number | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip]); // toast is stable, no need in deps

  // Fetch credits data if pubkey exists
  useEffect(() => {
    const fetchCredits = async () => {
      if (!pnode?.pubkey) return;

      try {
        const res = await fetch('/api/pods-credits');
        if (!res.ok) return;
        
        const data = await res.json();
        const allPods = data.allPods || [];
        
        // Find this node's credits by pubkey
        const nodeCredits = allPods.find((pod: any) => pod.pod_id === pnode.pubkey);
        
        if (nodeCredits) {
          setCredits(nodeCredits.credits);
          
          // Calculate rank
          const rank = allPods
            .sort((a: any, b: any) => b.credits - a.credits)
            .findIndex((pod: any) => pod.pod_id === pnode.pubkey) + 1;
          
          setCreditsRank(rank);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    fetchCredits();
  }, [pnode?.pubkey]);

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

  // FAB Actions
  const fabActions = [
    {
      id: 'pdf',
      label: 'Export PDF Report',
      icon: <Download className="w-4 h-4" />,
      color: '#7B3FF2',
      onClick: () => {
        exportPNodeToPDF(pnode, health, credits, creditsRank);
        toast.success('PDF report generated successfully');
      },
    },
    {
      id: 'json',
      label: 'Export JSON Data',
      icon: <FileJson className="w-4 h-4" />,
      color: '#14f195',
      onClick: () => {
        const dataStr = JSON.stringify(pnode, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pnode-${pnode.ip}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('JSON data exported');
      },
    },
    {
      id: 'share',
      label: 'Copy Share Link',
      icon: <Link2 className="w-4 h-4" />,
      color: '#3B82F6',
      onClick: () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      },
    },
  ];

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
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  // Try to get country code from country_code or derive from country name
                  const getCountryCode = () => {
                    if (pnode.country_code) return pnode.country_code.toLowerCase();
                    
                    // Common country name to code mappings
                    const countryMap: Record<string, string> = {
                      'finland': 'fi', 'france': 'fr', 'germany': 'de', 'india': 'in',
                      'united states': 'us', 'united kingdom': 'gb', 'canada': 'ca',
                      'japan': 'jp', 'china': 'cn', 'russia': 'ru', 'brazil': 'br',
                      'australia': 'au', 'south korea': 'kr', 'spain': 'es', 'italy': 'it',
                      'netherlands': 'nl', 'sweden': 'se', 'switzerland': 'ch', 'poland': 'pl',
                      'belgium': 'be', 'austria': 'at', 'norway': 'no', 'denmark': 'dk',
                      'singapore': 'sg', 'hong kong': 'hk', 'ireland': 'ie', 'portugal': 'pt',
                    };
                    
                    if (pnode.country) {
                      const normalized = pnode.country.toLowerCase();
                      return countryMap[normalized] || null;
                    }
                    return null;
                  };
                  
                  const countryCode = getCountryCode();
                  
                  return countryCode ? (
                    <img 
                      src={`https://flagcdn.com/w80/${countryCode}.png`}
                      alt={pnode.country || 'flag'}
                      className="w-10 h-7 object-cover rounded shadow-lg border border-border-app"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null;
                })()}
                <h1 className="text-3xl font-bold font-mono">{ip}</h1>
              </div>
              {pnode.city || pnode.country ? (
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  {[pnode.city, pnode.country].filter(Boolean).join(', ')} • pNode Details & Analytics
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  pNode Details & Analytics
                </p>
              )}
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
            {/* CPU Card with gradient */}
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: pnode.stats.cpu_percent > 80 ? '#F59E0B' : '#14f195' }}
              />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: pnode.stats.cpu_percent > 80 ? '#F59E0B' : '#14f195' }} />
                CPU Usage
              </p>
              <p className="text-3xl font-bold" style={{ color: pnode.stats.cpu_percent > 80 ? '#F59E0B' : '#14f195' }}>
                {pnode.stats.cpu_percent.toFixed(1)}%
              </p>
              <div className="w-full bg-bg-app rounded-full h-2.5 mt-3 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(pnode.stats.cpu_percent, 100)}%`,
                    background: pnode.stats.cpu_percent > 80 
                      ? 'linear-gradient(90deg, #F59E0B, #EF4444)' 
                      : 'linear-gradient(90deg, #14f195, #10B981)'
                  }} 
                />
              </div>
            </div>

            {/* RAM Card with gradient */}
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: ramPercent > 80 ? '#EF4444' : '#3B82F6' }}
              />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: ramPercent > 80 ? '#EF4444' : '#3B82F6' }} />
                RAM Usage
              </p>
              <p className="text-3xl font-bold" style={{ color: ramPercent > 80 ? '#EF4444' : '#3B82F6' }}>
                {ramPercent}%
              </p>
              <p className="text-xs text-text-faint mt-2">{formatBytes(pnode.stats.ram_used)} / {formatBytes(pnode.stats.ram_total)}</p>
              <div className="w-full bg-bg-app rounded-full h-2.5 mt-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${ramPercent}%`,
                    background: ramPercent > 80 
                      ? 'linear-gradient(90deg, #EF4444, #DC2626)' 
                      : 'linear-gradient(90deg, #3B82F6, #2563EB)'
                  }} 
                />
              </div>
            </div>

            {/* Storage Card with gradient */}
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div 
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: '#7B3FF2' }}
              />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-purple" />
                Storage Committed
              </p>
              <p className="text-3xl font-bold text-accent-purple">
                {formatBytes(pnode.stats.storage_committed ?? 0)}
              </p>
              <p className="text-xs text-text-faint mt-2">Total capacity pledged</p>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-app rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">Blockchain Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity bg-green-400" />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Active Streams
              </p>
              <p className="text-3xl font-bold text-green-400">{pnode.stats.active_streams ?? 0}</p>
              <p className="text-xs text-text-faint mt-1">Real-time data channels</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: '#7B3FF2' }} />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-purple" />
                Total Pages
              </p>
              <p className="text-3xl font-bold text-accent-purple">{(pnode.stats.total_pages ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Blockchain data indexed</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity bg-blue-400" />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Current Index
              </p>
              <p className="text-3xl font-bold text-blue-400">{(pnode.stats.current_index ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Indexing position</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: '#14f195' }} />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-aqua" />
                Packets Sent
              </p>
              <p className="text-3xl font-bold text-accent-aqua">{(pnode.stats.packets_sent ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Network traffic out</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: '#F59E0B' }} />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
                Packets Received
              </p>
              <p className="text-3xl font-bold" style={{ color: '#F59E0B' }}>{(pnode.stats.packets_received ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-faint mt-1">Network traffic in</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ background: 'linear-gradient(135deg, #14f195, #7B3FF2)' }} />
              <p className="text-text-soft text-xs uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #14f195, #7B3FF2)' }} />
                Total Packets
              </p>
              <p className="text-3xl font-bold" style={{ 
                background: 'linear-gradient(135deg, #14f195, #7B3FF2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {((pnode.stats.packets_sent ?? 0) + (pnode.stats.packets_received ?? 0)).toLocaleString()}
              </p>
              <p className="text-xs text-text-faint mt-1">Combined traffic</p>
            </div>
          </div>
        </div>

        {/* Node Identity - Only show if there's meaningful data */}
        {(pnode.pubkey || pnode.stats.uptime > 0 || (pnode.lat !== null && pnode.lng !== null)) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-bg-card border border-border-app rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 uppercase">Node Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pnode.pubkey ? (
                <div className="bg-bg2 p-4 rounded-lg theme-transition">
                  <p className="text-text-soft text-xs uppercase mb-2">Public Key</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-text-main truncate">{pnode.pubkey}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pnode.pubkey!);
                        toast.success('Pubkey copied to clipboard');
                      }}
                      className="px-2 py-1 rounded bg-accent-aqua/10 hover:bg-accent-aqua/20 transition-colors"
                      style={{ color: 'var(--accent-aqua)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-bg2 p-4 rounded-lg theme-transition opacity-50">
                  <p className="text-text-soft text-xs uppercase mb-2">Public Key</p>
                  <p className="text-sm text-text-faint italic">Not available</p>
                  <p className="text-xs text-text-faint mt-1">No pubkey registered</p>
                </div>
              )}
              <div className="bg-bg2 p-4 rounded-lg theme-transition">
                <p className="text-text-soft text-xs uppercase mb-2">First Seen</p>
                <p className="text-lg font-bold">
                  {pnode.stats.uptime > 0 
                    ? new Date(Date.now() - pnode.stats.uptime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Unknown'
                  }
                </p>
                <p className="text-xs text-text-faint mt-1">
                  {pnode.stats.uptime > 0 ? `${Math.floor(pnode.stats.uptime / 86400)} days ago` : 'No uptime data'}
                </p>
              </div>
              <div className="bg-bg2 p-4 rounded-lg theme-transition">
                <p className="text-text-soft text-xs uppercase mb-2">Node Type</p>
                <p className="text-lg font-bold" style={{ color: pnode.node_type === 'public' ? 'var(--kpi-excellent)' : 'var(--kpi-good)' }}>
                  {pnode.node_type === 'public' ? 'Public Node' : 'Private Node'}
                </p>
                <p className="text-xs text-text-faint mt-1">
                  {pnode.node_type === 'public' ? 'Fully accessible' : 'Privacy mode'}
                </p>
              </div>
              {(pnode.lat !== null && pnode.lng !== null) && (
                <div className="bg-bg2 p-4 rounded-lg theme-transition">
                  <p className="text-text-soft text-xs uppercase mb-2">Coordinates</p>
                  <p className="text-sm font-mono">
                    {pnode.lat?.toFixed(4)}, {pnode.lng?.toFixed(4)}
                  </p>
                  <p className="text-xs text-text-faint mt-1">Geographic position</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Economic Metrics - Show only if credits data available */}
        {credits !== null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-bg-card border border-border-app rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 uppercase">Economic Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bg2 p-4 rounded-lg theme-transition">
                <p className="text-text-soft text-xs uppercase mb-2">Total Credits Earned</p>
                <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
                  {credits.toLocaleString()}
                </p>
                <p className="text-xs text-text-faint mt-1">Cycle rewards</p>
              </div>
              {creditsRank && (
                <div className="bg-bg2 p-4 rounded-lg theme-transition">
                  <p className="text-text-soft text-xs uppercase mb-2">Network Rank</p>
                  <p className="text-2xl font-bold text-accent-aqua">
                    #{creditsRank}
                  </p>
                  <p className="text-xs text-text-faint mt-1">By earnings</p>
                </div>
              )}
              <div className="bg-bg2 p-4 rounded-lg theme-transition">
                <p className="text-text-soft text-xs uppercase mb-2">Performance Tier</p>
                <p className="text-lg font-bold" style={{ 
                  color: creditsRank && creditsRank <= 10 ? '#FFD700' 
                    : creditsRank && creditsRank <= 50 ? 'var(--kpi-excellent)' 
                    : 'var(--kpi-good)' 
                }}>
                  {creditsRank && creditsRank <= 10 ? '🏆 Top 10' 
                    : creditsRank && creditsRank <= 50 ? '⭐ Top 50' 
                    : '✓ Active'}
                </p>
                <p className="text-xs text-text-faint mt-1">Earning status</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Storage Deep Dive */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="bg-bg-card border border-border-app rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">Storage Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Committed Capacity</p>
              <p className="text-2xl font-bold text-accent-purple">{formatBytes(pnode.stats.storage_committed ?? 0)}</p>
              <p className="text-xs text-text-faint mt-1">Promised storage</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Actually Used</p>
              <p className="text-2xl font-bold text-accent-aqua">{formatBytes(pnode.stats.storage_used ?? 0)}</p>
              <p className="text-xs text-text-faint mt-1">Current utilization</p>
            </div>
            <div className="bg-bg2 p-4 rounded-lg theme-transition">
              <p className="text-text-soft text-xs uppercase mb-2">Available Space</p>
              <p className="text-2xl font-bold text-kpi-excellent">
                {formatBytes(Math.max(0, (pnode.stats.storage_committed ?? 0) - (pnode.stats.storage_used ?? 0)))}
              </p>
              <p className="text-xs text-text-faint mt-1">Remaining capacity</p>
            </div>
          </div>
          {pnode.stats.storage_committed && pnode.stats.storage_committed > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-soft">Storage Utilization</span>
                <span className="text-text-main font-bold">
                  {((pnode.stats.storage_used ?? 0) / pnode.stats.storage_committed * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-bg-app rounded-full h-3">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, ((pnode.stats.storage_used ?? 0) / pnode.stats.storage_committed * 100))}%`,
                    background: 'linear-gradient(90deg, var(--accent-aqua), var(--accent-purple))'
                  }} 
                />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-bg-card border border-border-app rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase">History</h2>
          <HistoryChart ip={ip} />
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton actions={fabActions} />
    </main>
  );
}
