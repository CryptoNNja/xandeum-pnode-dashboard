"use client";

import { useState, useEffect } from 'react';
import { X, Users, Network, HardDrive, TrendingUp, Globe, Award } from 'lucide-react';
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

export default function ManagerProfilesModalCompact({ isOpen, onClose }: ManagerProfilesModalProps) {
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
      <div className="relative w-full max-w-7xl h-[90vh] bg-[var(--bg-card)] border-2 border-orange-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER - Ultra compact */}
        <div className="flex-shrink-0 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-hover)] border-b-2 border-orange-500 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Title + Stats inline */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-[var(--text-main)]">Manager Profiles</h2>
              </div>
              
              {/* Compact stats inline */}
              {stats && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-bg)] rounded-full">
                    <span className="text-[var(--text-secondary)]">Total:</span>
                    <span className="font-bold text-[var(--accent-aqua)]">{stats.totalManagers}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[var(--kpi-excellent)]/10 rounded-full">
                    <span className="text-[var(--text-secondary)]">Multi-Node:</span>
                    <span className="font-bold text-[var(--kpi-excellent)]">{stats.multiNodeOperators}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[var(--kpi-warning)]/10 rounded-full">
                    <span className="text-[var(--text-secondary)]">Largest:</span>
                    <span className="font-bold text-[var(--kpi-warning)]">{stats.largestOperator.nodeCount} nodes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Filters + Close */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilter('multi')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'multi'
                    ? 'bg-orange-500 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                Multi-Node
              </button>
              
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                All
              </button>

              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT - Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Manager List - 40% width */}
          <div className="w-2/5 border-r border-[var(--border-subtle)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[var(--text-secondary)]">Loading...</div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {managers.map((manager) => (
                  <button
                    key={manager.pubkey}
                    onClick={() => setSelectedManager(manager)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedManager?.pubkey === manager.pubkey
                        ? 'bg-orange-500/10 border-2 border-orange-500'
                        : 'bg-[var(--bg-bg)] border-2 border-transparent hover:border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-xs text-[var(--text-main)]">
                        {truncatePubkey(manager.pubkey, 8)}
                      </div>
                      <div className="flex items-center gap-2">
                        {manager.networks.map((net) => (
                          <span
                            key={net}
                            className={`px-2 py-0.5 text-white text-xs rounded-full ${
                              net === 'MAINNET' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          >
                            {net}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Network className="w-3 h-3" />
                        {manager.nodeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {manager.countries.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {manager.totalCredits.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}

                {managers.length === 0 && (
                  <div className="text-center py-12 text-[var(--text-secondary)]">
                    No managers found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Manager Detail - 60% width */}
          <div className="flex-1 overflow-y-auto">
            {selectedManager ? (
              <div className="p-6">
                {/* Manager Header - Ultra compact inline */}
                <div className="mb-3 pb-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-500" />
                    <div className="font-mono text-xs font-bold text-[var(--text-main)]">
                      {truncatePubkey(selectedManager.pubkey, 16)}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-orange-500">
                    {selectedManager.nodeCount} nodes
                  </div>
                </div>

                {/* Stats - Ultra compact inline */}
                <div className="flex items-center gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-secondary)]">Credits:</span>
                    <span className="font-bold text-[var(--kpi-excellent)]">{selectedManager.totalCredits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-secondary)]">Storage:</span>
                    <span className="font-bold text-[var(--kpi-good)]">{formatStorageSize(selectedManager.totalStorage)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-secondary)]">Uptime:</span>
                    <span className="font-bold text-[var(--kpi-warning)]">{formatUptime(selectedManager.averageUptime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-secondary)]">Countries:</span>
                    <span className="font-bold text-[var(--kpi-good)]">{selectedManager.countries.length}</span>
                  </div>
                </div>

                {/* Distribution & Health - Inline compact */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)]">Networks:</span>
                      {selectedManager.networks.map((network) => (
                        <span
                          key={network}
                          className={`px-2 py-0.5 text-white rounded text-[10px] font-medium ${
                            network === 'MAINNET' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                        >
                          {network}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 border-l border-[var(--border-subtle)] pl-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--kpi-excellent)]"></div>
                        <span>{selectedManager.healthStatus.active}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--kpi-warning)]"></div>
                        <span>{selectedManager.healthStatus.gossipOnly}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--kpi-critical)]"></div>
                        <span>{selectedManager.healthStatus.stale}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {selectedManager.countries.slice(0, 3).map((country) => (
                      <span
                        key={country}
                        className="px-2 py-0.5 bg-[var(--bg-bg)] text-[var(--text-secondary)] rounded text-[10px]"
                      >
                        {country}
                      </span>
                    ))}
                    {selectedManager.countries.length > 3 && (
                      <span className="px-2 py-0.5 bg-[var(--bg-bg)] text-[var(--text-secondary)] rounded text-[10px]">
                        +{selectedManager.countries.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nodes Table - Ultra Compact */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="text-xs text-[var(--text-secondary)] mb-2 font-medium">
                    {selectedManager.nodes.length} Nodes
                  </div>
                  <div className="flex-1 overflow-y-auto bg-[var(--bg-bg)] rounded-lg mb-2">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
                        <tr>
                          <th className="text-left p-1.5 text-[10px] font-medium text-[var(--text-secondary)]">IP</th>
                          <th className="text-left p-1.5 text-[10px] font-medium text-[var(--text-secondary)]">Location</th>
                          <th className="text-left p-1.5 text-[10px] font-medium text-[var(--text-secondary)]">Network</th>
                          <th className="text-left p-1.5 text-[10px] font-medium text-[var(--text-secondary)]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedManager.nodes.map((node) => (
                          <tr key={node.ip} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]">
                            <td className="p-1.5 font-mono text-[10px]">{node.ip}</td>
                            <td className="p-1.5 text-[10px]">{node.city}, {node.country}</td>
                            <td className="p-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${
                                node.network === 'MAINNET' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}>
                                {node.network}
                              </span>
                            </td>
                            <td className="p-1.5">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  node.status === 'active'
                                    ? 'bg-[var(--kpi-excellent)]'
                                    : node.status === 'gossip_only'
                                    ? 'bg-[var(--kpi-warning)]'
                                    : 'bg-[var(--kpi-critical)]'
                                }`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* On-Chain Data - Compact footer */}
                  <div className="flex-shrink-0 px-2 py-1.5 bg-[var(--bg-bg)] rounded border border-dashed border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] flex items-center justify-between">
                    <span>🔗 On-Chain: NFTs, SBTs, Balance</span>
                    <span className="text-[var(--kpi-warning)]">Coming Soon</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <div className="text-lg font-medium mb-2">Select a manager</div>
                  <div className="text-sm">Click on a manager to view details</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
