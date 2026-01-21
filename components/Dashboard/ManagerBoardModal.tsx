"use client";

import { useState, useEffect } from 'react';
import { X, Users, Network, HardDrive, TrendingUp, Globe, Award, Wallet, Image, BadgeCheck, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { truncatePubkey, formatStorageSize, formatUptime } from '@/lib/manager-profiles';
import { fetchOnChainData, type OnChainData } from '@/lib/blockchain-data';

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

interface ManagerBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortField = 'nodeCount' | 'totalCredits' | 'totalStorage';
type SortDirection = 'asc' | 'desc';

export default function ManagerBoardModal({ isOpen, onClose }: ManagerBoardModalProps) {
  const [managers, setManagers] = useState<ManagerProfile[]>([]);
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'multi'>('multi');
  const [selectedManager, setSelectedManager] = useState<ManagerProfile | null>(null);
  const [onChainData, setOnChainData] = useState<OnChainData | null>(null);
  const [sortField, setSortField] = useState<SortField>('nodeCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen, filter]);

  // Fetch blockchain data when a manager is selected
  useEffect(() => {
    if (selectedManager) {
      setOnChainData(null); // Reset previous data
      fetchOnChainData(selectedManager.pubkey)
        .then(data => setOnChainData(data))
        .catch(err => {
          console.error('Error fetching on-chain data:', err);
          setOnChainData({
            pubkey: selectedManager.pubkey,
            balance: null,
            nfts: [],
            sbts: [],
            lastFetched: Date.now(),
            loading: false,
            error: err.message,
          });
        });
    }
  }, [selectedManager]);

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

  // Sort managers based on current sort settings
  const sortedManagers = [...managers].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'nodeCount':
        comparison = a.nodeCount - b.nodeCount;
        break;
      case 'totalCredits':
        comparison = a.totalCredits - b.totalCredits;
        break;
      case 'totalStorage':
        comparison = a.totalStorage - b.totalStorage;
        break;
    }
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  // Toggle sort direction or change field
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
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
                <h2 className="text-xl font-bold text-[var(--text-main)]">Manager Board</h2>
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
          <div className="w-2/5 border-r border-[var(--border-subtle)] flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[var(--text-secondary)]">Loading...</div>
              </div>
            ) : (
              <>
                {/* Sort Controls */}
                <div className="flex-shrink-0 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-bg)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Showing {sortedManagers.length} {filter === 'multi' ? 'multi-node operators' : 'operators'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">Sort by:</span>
                    <button
                      onClick={() => handleSort('nodeCount')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        sortField === 'nodeCount'
                          ? 'bg-orange-500 text-white'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <Network className="w-3 h-3" />
                      Nodes
                      {sortField === 'nodeCount' && (
                        sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSort('totalCredits')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        sortField === 'totalCredits'
                          ? 'bg-orange-500 text-white'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      Credits
                      {sortField === 'totalCredits' && (
                        sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSort('totalStorage')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        sortField === 'totalStorage'
                          ? 'bg-orange-500 text-white'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <HardDrive className="w-3 h-3" />
                      Storage
                      {sortField === 'totalStorage' && (
                        sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Manager List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {sortedManagers.map((manager) => (
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

                </div>
              </>
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
                  
                  {/* On-Chain Data Section */}
                  <div className="flex-shrink-0 space-y-2">
                    <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-2">
                      <Award className="w-3 h-3" />
                      On-Chain Data
                    </div>
                    
                    {onChainData?.loading ? (
                      <div className="px-3 py-2 bg-[var(--bg-bg)] rounded text-[10px] text-[var(--text-secondary)]">
                        Loading blockchain data...
                      </div>
                    ) : onChainData?.error ? (
                      <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
                        Error: {onChainData.error}
                      </div>
                    ) : onChainData ? (
                      <div className="space-y-3">
                        {/* Balance Card */}
                        <div className="px-3 py-2 bg-[var(--bg-bg)] rounded border border-[var(--border-subtle)]">
                          <div className="flex items-center gap-1 mb-1">
                            <Wallet className="w-3 h-3 text-[var(--accent-aqua)]" />
                            <span className="text-[9px] text-[var(--text-secondary)]">Tokens</span>
                          </div>
                          {onChainData.balance ? (
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-bold text-[var(--text-main)]">
                                {onChainData.balance.sol.toFixed(4)} SOL
                              </div>
                              {onChainData.balance.xand > 0 && (
                                <div className="text-[9px] text-orange-400 font-medium">
                                  {onChainData.balance.xand.toFixed(2)} XAND
                                </div>
                              )}
                              {onChainData.balance.xeno > 0 && (
                                <div className="text-[9px] text-purple-400 font-medium">
                                  {onChainData.balance.xeno.toFixed(2)} XENO
                                </div>
                              )}
                              <div className="text-[9px] text-[var(--text-secondary)]">
                                {onChainData.balance.xand === 0 && onChainData.balance.xeno === 0 ? (
                                  `No XAND/XENO tokens`
                                ) : (
                                  `$${onChainData.balance.usd.toFixed(2)} USD`
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[9px] text-[var(--text-secondary)]">No balance</div>
                          )}
                        </div>

                        {/* NFTs Section */}
                        <div className="px-3 py-2 bg-[var(--bg-bg)] rounded border border-[var(--border-subtle)]">
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <div className="flex items-center gap-1">
                              <Image className="w-3 h-3 text-purple-400" />
                              <span className="text-[9px] text-[var(--text-secondary)]">Xandeum NFTs</span>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-main)]">
                              {onChainData.nfts.length}
                            </span>
                          </div>
                          {onChainData.nfts.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {onChainData.nfts.map((nft, idx) => (
                                <div key={nft.mint} className="flex items-center gap-2 p-1 bg-[var(--bg-card)] rounded">
                                  {nft.image ? (
                                    <img src={nft.image} alt={nft.name} className="w-6 h-6 rounded object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                                      <Image className="w-3 h-3 text-purple-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-medium text-[var(--text-main)] truncate">
                                      {nft.name}
                                    </div>
                                    {nft.symbol && (
                                      <div className="text-[8px] text-[var(--text-secondary)] truncate">
                                        {nft.symbol}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[9px] text-[var(--text-secondary)]">No Xandeum NFTs</div>
                          )}
                        </div>

                        {/* SBTs Section */}
                        <div className="px-3 py-2 bg-[var(--bg-bg)] rounded border border-[var(--border-subtle)]">
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <div className="flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3 text-[var(--kpi-excellent)]" />
                              <span className="text-[9px] text-[var(--text-secondary)]">SBTs / Badges</span>
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-main)]">
                              {onChainData.sbts.length}
                            </span>
                          </div>
                          {onChainData.sbts.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {onChainData.sbts.map((sbt, idx) => (
                                <div key={sbt.mint} className="p-1 bg-[var(--bg-card)] rounded">
                                  <div className="text-[9px] font-medium text-[var(--text-main)]">
                                    {sbt.name}
                                  </div>
                                  {sbt.description && (
                                    <div className="text-[8px] text-[var(--text-secondary)] truncate">
                                      {sbt.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[9px] text-[var(--text-secondary)]">No SBTs found</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-[var(--bg-bg)] rounded border border-dashed border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)]">
                        Select a manager to view on-chain data
                      </div>
                    )}
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
