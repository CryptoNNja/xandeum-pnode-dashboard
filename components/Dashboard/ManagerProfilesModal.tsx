"use client";

import { useState, useEffect } from 'react';
import { X, Users, Network, HardDrive, TrendingUp, Globe } from 'lucide-react';
import { truncatePubkey, formatStorageSize, formatUptime } from '@/lib/manager-profiles';

interface ManagerNode {
  ip: string;
  city: string;
  country: string;
  status: string;
  network: string;
}

interface ManagerProfile {
  pubkey: string;
  nodes: ManagerNode[];
  nodeCount: number;
  totalCredits: number;
  totalStorage: number;
  averageUptime: number;
  networks: string[];
  countries: string[];
  healthStatus: {
    active: number;
    gossipOnly: number;
    stale: number;
  };
}

interface ManagerStats {
  totalManagers: number;
  multiNodeOperators: number;
  singleNodeOperators: number;
  largestOperator: {
    pubkey: string;
    nodeCount: number;
  };
  totalNodesManaged: number;
}

interface ManagerProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManagerProfilesModal({ isOpen, onClose }: ManagerProfilesModalProps) {
  const [managers, setManagers] = useState<ManagerProfile[]>([]);
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'multi'>('multi');
  const [selectedManager, setSelectedManager] = useState<ManagerProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen, filter]);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const url = `/api/managers?multiNode=${filter === 'multi'}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setManagers(data.managers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-[var(--bg-card)] border-2 border-[var(--accent-aqua)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-hover)] border-b-2 border-[var(--accent-aqua)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-3">
                <Users className="w-8 h-8 text-[var(--accent-aqua)]" />
                Manager Profiles
              </h2>
              <p className="mt-2 text-[var(--text-secondary)]">
                Track multi-node operators and their infrastructure
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X className="w-6 h-6 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-[var(--bg-bg)] border border-[var(--accent-aqua)] rounded-lg p-3">
                <div className="text-xs text-[var(--text-secondary)]">Total Managers</div>
                <div className="text-2xl font-bold text-[var(--accent-aqua)]">
                  {stats.totalManagers}
                </div>
              </div>
              
              <div className="bg-[var(--bg-bg)] border border-[var(--kpi-excellent)] rounded-lg p-3">
                <div className="text-xs text-[var(--text-secondary)]">Multi-Node</div>
                <div className="text-2xl font-bold text-[var(--kpi-excellent)]">
                  {stats.multiNodeOperators}
                </div>
              </div>

              <div className="bg-[var(--bg-bg)] border border-[var(--kpi-warning)] rounded-lg p-3">
                <div className="text-xs text-[var(--text-secondary)]">Single-Node</div>
                <div className="text-2xl font-bold text-[var(--kpi-warning)]">
                  {stats.singleNodeOperators}
                </div>
              </div>

              <div className="bg-[var(--bg-bg)] border border-[var(--accent-aqua)] rounded-lg p-3">
                <div className="text-xs text-[var(--text-secondary)]">Largest Operator</div>
                <div className="text-xl font-bold text-[var(--accent-aqua)]">
                  {stats.largestOperator.nodeCount} nodes
                </div>
              </div>

              <div className="bg-[var(--bg-bg)] border border-[var(--kpi-good)] rounded-lg p-3">
                <div className="text-xs text-[var(--text-secondary)]">Total Nodes</div>
                <div className="text-2xl font-bold text-[var(--kpi-good)]">
                  {stats.totalNodesManaged}
                </div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setFilter('multi')}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                filter === 'multi'
                  ? 'bg-[var(--accent-aqua)] text-[var(--bg-bg)]'
                  : 'bg-[var(--bg-bg)] text-[var(--text-secondary)] border border-[var(--accent-aqua)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Multi-Node Operators
            </button>
            
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                filter === 'all'
                  ? 'bg-[var(--accent-aqua)] text-[var(--bg-bg)]'
                  : 'bg-[var(--bg-bg)] text-[var(--text-secondary)] border border-[var(--accent-aqua)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              All Managers
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-300px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--text-secondary)]">Loading managers...</div>
            </div>
          ) : selectedManager ? (
            // Manager Detail View
            <div>
              <button
                onClick={() => setSelectedManager(null)}
                className="mb-4 text-[var(--accent-aqua)] hover:underline"
              >
                ← Back to list
              </button>
              
              <div className="bg-[var(--bg-bg)] border-2 border-[var(--accent-aqua)] rounded-lg p-6">
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-4">
                  Manager: {truncatePubkey(selectedManager.pubkey, 12)}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">Total Nodes</div>
                    <div className="text-2xl font-bold text-[var(--accent-aqua)]">
                      {selectedManager.nodeCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">Total Credits</div>
                    <div className="text-2xl font-bold text-[var(--kpi-excellent)]">
                      {selectedManager.totalCredits.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">Total Storage</div>
                    <div className="text-lg font-bold text-[var(--kpi-good)]">
                      {formatStorageSize(selectedManager.totalStorage)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[var(--text-secondary)]">Avg Uptime</div>
                    <div className="text-lg font-bold text-[var(--kpi-warning)]">
                      {formatUptime(selectedManager.averageUptime)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Networks</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedManager.networks.map((network) => (
                        <span
                          key={network}
                          className="px-3 py-1 bg-[var(--accent-aqua)] text-[var(--bg-bg)] rounded-full text-xs font-mono"
                        >
                          {network}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Countries</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedManager.countries.map((country) => (
                        <span
                          key={country}
                          className="px-3 py-1 bg-[var(--kpi-good)] text-white rounded-full text-xs"
                        >
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-[var(--text-secondary)] mb-2">Health Status</div>
                  <div className="flex gap-4">
                    <div className="text-sm">
                      <span className="text-[var(--kpi-excellent)]">●</span> Active: {selectedManager.healthStatus.active}
                    </div>
                    <div className="text-sm">
                      <span className="text-[var(--kpi-warning)]">●</span> Gossip: {selectedManager.healthStatus.gossipOnly}
                    </div>
                    <div className="text-sm">
                      <span className="text-[var(--kpi-critical)]">●</span> Stale: {selectedManager.healthStatus.stale}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-2">Nodes ({selectedManager.nodes.length})</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedManager.nodes.map((node) => (
                      <div
                        key={node.ip}
                        className="flex items-center justify-between p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              node.status === 'active'
                                ? 'bg-[var(--kpi-excellent)]'
                                : node.status === 'gossip_only'
                                ? 'bg-[var(--kpi-warning)]'
                                : 'bg-[var(--kpi-critical)]'
                            }`}
                          />
                          <div className="font-mono text-sm">{node.ip}</div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                          <span>{node.city}, {node.country}</span>
                          <span className="px-2 py-1 bg-[var(--bg-bg)] rounded">
                            {node.network}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Manager List View
            <div className="space-y-3">
              {managers.map((manager) => (
                <div
                  key={manager.pubkey}
                  onClick={() => setSelectedManager(manager)}
                  className="group bg-[var(--bg-bg)] border-2 border-[var(--border-subtle)] hover:border-[var(--accent-aqua)] rounded-lg p-4 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[var(--accent-aqua)]/10 rounded-lg">
                        <Users className="w-6 h-6 text-[var(--accent-aqua)]" />
                      </div>
                      
                      <div>
                        <div className="font-mono text-sm text-[var(--text-main)] mb-1">
                          {truncatePubkey(manager.pubkey, 12)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <Network className="w-3 h-3" />
                            {manager.nodeCount} nodes
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {manager.countries.length} {manager.countries.length === 1 ? 'country' : 'countries'}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {formatStorageSize(manager.totalStorage)}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {manager.totalCredits.toLocaleString()} credits
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {manager.networks.map((network) => (
                        <span
                          key={network}
                          className="px-2 py-1 bg-[var(--accent-aqua)] text-[var(--bg-bg)] rounded text-xs font-mono"
                        >
                          {network}
                        </span>
                      ))}
                      
                      <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent-aqua)] transition-colors">
                        →
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {managers.length === 0 && (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  No managers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
