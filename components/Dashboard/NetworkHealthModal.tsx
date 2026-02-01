"use client";

import { useState, useEffect } from 'react';
import { X, Download, TrendingUp, Activity, History, Users, Lightbulb, CheckCircle2, Zap, Database, Cpu, Wifi, FileDown, FileText, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { NetworkHealthScore, NetworkHealthComponent } from '@/lib/network-health';
import { exportNetworkHealthToPDF } from '@/lib/network-health-pdf-export';

// Custom scrollbar styles for modal
const scrollbarStyles = `
  .modal-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .modal-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .modal-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
  }
  .modal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
  }
`;

interface NetworkHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: NetworkHealthScore;
}

type TabKey = 'overview' | 'components' | 'history' | 'nodes' | 'recommendations';

const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'components', label: 'Components', icon: Activity },
  { key: 'history', label: 'History', icon: History },
  { key: 'nodes', label: 'Nodes', icon: Users },
  { key: 'recommendations', label: 'Recommendations', icon: Lightbulb },
];

export function NetworkHealthModal({ isOpen, onClose, healthData }: NetworkHealthModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a refresh - in a real app, this would refetch the data
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefresh(new Date());
      // In production, you'd call a callback prop to refetch data
      // onRefresh?.();
    }, 1500);
  };

  const handleExportPDF = async () => {
    try {
      await exportNetworkHealthToPDF(healthData);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportCSV = () => {
    // CSV export implementation
    const csvData = [];
    csvData.push(['Component', 'Score', 'Weight', 'Color']);
    
    Object.entries(healthData.components).forEach(([, component]) => {
      csvData.push([
        component.label,
        component.score.toString(),
        (component.weight * 100).toString() + '%',
        component.color
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `network-health-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup object URL
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal - Fixed 85vh height, no internal scrolling */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="w-full max-w-7xl h-[85vh] bg-gradient-to-br from-background to-background/95 border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed 68px */}
          <div className="h-[68px] flex items-center justify-between px-6 border-b border-border/50 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main tracking-tight">Network Health Dashboard</h2>
                <p className="text-xs text-text-soft">
                  Score: <span className="font-semibold text-text-main">{healthData.overall}/100</span> · {healthData.rating.charAt(0).toUpperCase() + healthData.rating.slice(1)}
                  {" · "}
                  <span className="italic">Updated {lastRefresh.toLocaleTimeString()}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-muted rounded-lg transition-all disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted hover:shadow-md transition-all flex items-center gap-2 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                {showExportMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[70]" 
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-xl z-[71] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={handleExportPDF}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <FileDown className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">Export as PDF</div>
                          <div className="text-xs text-text-soft">Detailed report</div>
                        </div>
                      </button>
                      <div className="h-px bg-border" />
                      <button
                        onClick={handleExportCSV}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">Export as CSV</div>
                          <div className="text-xs text-text-soft">Raw data</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-all hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs - Fixed 52px */}
          <div className="h-[52px] flex border-b border-border/50 bg-muted/10 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 text-sm font-semibold transition-all relative
                    ${isActive 
                      ? 'text-primary bg-background/50' 
                      : 'text-text-soft hover:text-text-main hover:bg-muted/30'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content - Remaining height (calc(85vh - 120px)) with internal structure */}
          <div className="flex-1 overflow-hidden relative bg-gradient-to-br from-transparent via-transparent to-muted/5">
            <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {activeTab === 'overview' && <OverviewTab healthData={healthData} />}
              {activeTab === 'components' && <ComponentsTab healthData={healthData} />}
              {activeTab === 'history' && <HistoryTab />}
              {activeTab === 'nodes' && <NodesTab />}
              {activeTab === 'recommendations' && <RecommendationsTab healthData={healthData} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Tab Components
// ============================================================================

function OverviewTab({ healthData }: { healthData: NetworkHealthScore }) {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetch('/api/network-health/history?days=30')
      .then(res => res.json())
      .then(data => {
        if (data.history) {
          const formattedData = data.history.map((point: any) => ({
            date: new Date(point.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: point.overall,
            timestamp: point.timestamp,
          }));
          setHistoricalData(formattedData);
        }
      })
      .catch(err => console.error('Error fetching history:', err))
      .finally(() => setIsLoadingHistory(false));
  }, []);

  return (
    <div className="h-full flex p-6 gap-6 overflow-hidden">
      {/* Left Column - 2/5 width */}
      <div className="w-2/5 flex flex-col gap-4">
        {/* Hero Score */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-6 border border-border/50 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-xl mb-3 mx-auto ring-4 ring-blue-500/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{healthData.overall}</div>
              <div className="text-[10px] text-white/80">/100</div>
            </div>
          </div>
          <div className="text-base font-bold text-text-main mb-1">
            {healthData.rating === 'excellent' && '⭐⭐⭐⭐⭐ Excellent'}
            {healthData.rating === 'good' && '⭐⭐⭐⭐ Good'}
            {healthData.rating === 'fair' && '⭐⭐⭐ Fair'}
            {healthData.rating === 'poor' && '⭐⭐ Poor'}
            {healthData.rating === 'critical' && '⭐ Critical'}
          </div>
          <p className="text-xs text-text-soft">
            {healthData.rating === 'poor' && 'Needs attention'}
            {healthData.rating === 'fair' && 'Room for improvement'}
            {healthData.rating === 'good' && 'Minor optimizations'}
            {healthData.rating === 'excellent' && 'Keep up the great work'}
          </p>
        </div>

        {/* Component Mini Cards */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 modal-scrollbar">
          {Object.entries(healthData.components).map(([key, component]) => {
            const iconMap: Record<string, any> = {
              'CheckCircle2': CheckCircle2,
              'Zap': Zap,
              'Database': Database,
              'Cpu': Cpu,
              'Wifi': Wifi,
            };
            const Icon = iconMap[component.icon] || Activity;
            
            return (
              <div key={key} className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:border-border transition-all">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${component.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: component.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-soft truncate">{component.label}</div>
                    <div className="text-sm font-bold text-text-main">{component.score}/100</div>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${component.score}%`,
                          backgroundColor: component.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column - 3/5 width */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Chart */}
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/50">
          <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Health Trend (Last 30 Days)
          </h3>
          {isLoadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs text-text-soft">Loading...</p>
              </div>
            </div>
          ) : historicalData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs text-text-soft">No historical data yet</p>
              </div>
            </div>
          ) : (
            <div className="h-[calc(100%-2rem)]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#F3F4F6', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Health Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Issues */}
        {healthData.recommendations.length > 0 && (
          <div className="h-32 bg-muted/30 rounded-xl p-4 border border-border/50 overflow-y-auto modal-scrollbar">
            <h3 className="text-sm font-semibold text-text-main mb-2 flex items-center gap-2 sticky top-0 bg-muted/30 pb-2">
              <Lightbulb className="w-4 h-4" />
              Top Issues
            </h3>
            <div className="space-y-2">
              {healthData.recommendations.slice(0, 2).map((rec, index) => {
                const severityColors = {
                  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400' },
                  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400' },
                  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
                };
                const style = severityColors[rec.severity];

                return (
                  <div key={index} className={`${style.bg} border ${style.border} rounded-lg p-2`}>
                    <h4 className={`text-xs font-semibold ${style.text} mb-0.5`}>{rec.title}</h4>
                    <p className="text-[11px] text-text-soft line-clamp-1">{rec.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentsTab({ healthData }: { healthData: NetworkHealthScore }) {
  const [selectedComponent, setSelectedComponent] = useState<keyof NetworkHealthScore['components']>('versionConsensus');
  
  const component = healthData.components[selectedComponent];

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Component Selector - Compact pills */}
      <div className="flex gap-2 shrink-0">
        {Object.entries(healthData.components).map(([key, comp]) => {
          const isActive = selectedComponent === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedComponent(key as keyof NetworkHealthScore['components'])}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${isActive 
                  ? 'bg-primary text-white shadow-md ring-2 ring-primary/20' 
                  : 'bg-muted hover:bg-muted-foreground/10 text-text-main'
                }
              `}
            >
              {comp.label.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Component Details - Fixed layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Score & Bar */}
        <div className="w-64 shrink-0 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-4 border border-border/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${component.color}20` }}
            >
              <Activity className="w-7 h-7" style={{ color: component.color }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">{component.label}</h3>
              <p className="text-xs text-text-soft">Weight: {(component.weight * 100)}%</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="text-5xl font-bold mb-1" style={{ color: component.color }}>
              {component.score}
            </div>
            <div className="text-xs text-text-soft uppercase tracking-wide">Current Score</div>
          </div>

          {/* Score Bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${component.score}%`,
                backgroundColor: component.color,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-soft mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Right: Details (scrollable) */}
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/50 overflow-y-auto modal-scrollbar">
          <ComponentDetailView component={component} componentKey={selectedComponent} />
        </div>
      </div>
    </div>
  );
}

function ComponentDetailView({ component, componentKey }: { 
  component: NetworkHealthComponent; 
  componentKey: keyof NetworkHealthScore['components'];
}) {
  const details = component.details;

  // Version Consensus Details
  if (componentKey === 'versionConsensus') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Consensus Version" value={details.consensusVersion} />
          <StatCard label="Consensus Nodes" value={`${details.consensusCount} (${details.consensusPercent}%)`} />
          <StatCard label="Legacy Nodes" value={details.legacyCount} />
          <StatCard label="Total Versions" value={details.totalVersions} />
        </div>

        {details.consensusPercent < 90 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                  Optimization Goal
                </h4>
                <p className="text-sm text-text-soft">
                  Target: 90%+ on consensus version ({details.consensusVersion})
                </p>
                <p className="text-sm text-text-soft">
                  Current Gap: {90 - details.consensusPercent}% (need {Math.ceil((90 - details.consensusPercent) * (details.consensusCount + details.legacyCount) / 100)} more nodes to upgrade)
                </p>
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mt-2">
                  Potential Score: 90/100 (+{90 - component.score} points!)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Network Uptime Details
  if (componentKey === 'networkUptime') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Avg Uptime" value={`${details.avgUptimeDays} days`} />
          <StatCard label="Nodes with Data" value={details.nodesWithUptime} />
          <StatCard label="30+ Days Uptime" value={details.distribution?.moreThan30d || 0} />
        </div>

        {details.distribution && (
          <div>
            <h4 className="text-sm font-semibold text-text-main mb-3">Uptime Distribution</h4>
            <div className="space-y-2">
              <UptimeBar label="30+ days" count={details.distribution.moreThan30d} color="#10B981" />
              <UptimeBar label="7-30 days" count={details.distribution.between7And30d} color="#3B82F6" />
              <UptimeBar label="1-7 days" count={details.distribution.between1And7d} color="#F59E0B" />
              <UptimeBar label="< 1 day" count={details.distribution.lessThan1d} color="#EF4444" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Storage Health Details
  if (componentKey === 'storageHealth') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Storage" value={`${details.totalStorageTB} TB`} />
          <StatCard label="Avg per Node" value={`${details.avgStorageTB} TB`} />
          <StatCard label="Distribution" value={details.distribution} className="capitalize" />
        </div>
      </div>
    );
  }

  // Resource Efficiency Details
  if (componentKey === 'resourceEfficiency') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Avg CPU" value={`${details.avgCpu}%`} />
          <StatCard label="Avg RAM" value={`${details.avgRam}%`} />
          <StatCard label="CPU Critical" value={details.cpuCritical} />
          <StatCard label="RAM Critical" value={details.ramCritical} />
        </div>

        {(details.cpuCritical > 0 || details.ramCritical > 0) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">
                  Critical Resource Usage Detected
                </h4>
                <p className="text-sm text-text-soft">
                  {details.cpuCritical} node(s) with CPU ≥90%, {details.ramCritical} node(s) with RAM ≥90%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Network Connectivity Details
  if (componentKey === 'networkConnectivity') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Active Nodes" value={`${details.activeNodes} / ${details.totalNodes}`} />
          <StatCard label="Connectivity Rate" value={`${Math.round((details.activeNodes / details.totalNodes) * 100)}%`} />
        </div>
      </div>
    );
  }

  return null;
}

function StatCard({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="text-xs text-text-soft mb-1">{label}</div>
      <div className={`text-lg font-bold text-text-main ${className}`}>{value}</div>
    </div>
  );
}

function UptimeBar({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-text-soft">{label}</div>
      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
        <div
          className="h-full flex items-center justify-end px-2 text-xs font-medium text-white"
          style={{
            width: `${Math.max(15, count * 2)}px`,
            backgroundColor: color,
          }}
        >
          {count}
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/network-health/history?days=${days}`)
      .then(res => res.json())
      .then(data => {
        if (data.history) {
          const formattedData = data.history.map((point: any) => ({
            date: new Date(point.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            overall: point.overall,
            versionConsensus: point.components.versionConsensus,
            networkUptime: point.components.networkUptime,
            storageHealth: point.components.storageHealth,
            resourceEfficiency: point.components.resourceEfficiency,
            networkConnectivity: point.components.networkConnectivity,
            timestamp: point.timestamp,
          }));
          setHistoricalData(formattedData);
        }
      })
      .catch(err => console.error('Error fetching history:', err))
      .finally(() => setIsLoading(false));
  }, [days]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-text-soft">Loading historical data...</p>
        </div>
      </div>
    );
  }

  if (historicalData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4">
            <History className="w-16 h-16 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">🚧 Historical Data - In Development</h3>
          <p className="text-sm text-text-soft mb-3">
            Historical tracking requires database migration to be applied
          </p>
          <div className="inline-block bg-muted/50 border border-border rounded-lg px-4 py-2 text-xs text-text-soft">
            <div className="font-mono">Migration: 16_add_version_to_history.sql</div>
            <div className="mt-1">Status: Pending deployment</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-base font-semibold text-text-main">Component Scores Over Time</h3>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`
                px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                ${days === d 
                  ? 'bg-primary text-white shadow-md ring-2 ring-primary/20' 
                  : 'bg-muted hover:bg-muted-foreground/10 text-text-main'
                }
              `}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Multi-line Chart */}
      <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/50 overflow-hidden">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickLine={{ stroke: '#374151' }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickLine={{ stroke: '#374151' }}
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#F3F4F6', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="overall" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={false}
                name="Overall Score"
              />
              <Line 
                type="monotone" 
                dataKey="versionConsensus" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Version Consensus"
              />
              <Line 
                type="monotone" 
                dataKey="networkUptime" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Network Uptime"
              />
              <Line 
                type="monotone" 
                dataKey="storageHealth" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Storage Health"
              />
              <Line 
                type="monotone" 
                dataKey="resourceEfficiency" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Resource Efficiency"
              />
              <Line 
                type="monotone" 
                dataKey="networkConnectivity" 
                stroke="#06B6D4" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Network Connectivity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats - Compact row */}
      <div className="grid grid-cols-6 gap-2 shrink-0">
        <ComponentSummary 
          label="Overall" 
          current={historicalData[historicalData.length - 1]?.overall || 0}
          avg={Math.round(historicalData.reduce((sum, d) => sum + d.overall, 0) / historicalData.length)}
          color="#8B5CF6"
        />
        <ComponentSummary 
          label="Version" 
          current={historicalData[historicalData.length - 1]?.versionConsensus || 0}
          avg={Math.round(historicalData.reduce((sum, d) => sum + d.versionConsensus, 0) / historicalData.length)}
          color="#10B981"
        />
        <ComponentSummary 
          label="Uptime" 
          current={historicalData[historicalData.length - 1]?.networkUptime || 0}
          avg={Math.round(historicalData.reduce((sum, d) => sum + d.networkUptime, 0) / historicalData.length)}
          color="#3B82F6"
        />
        <ComponentSummary 
          label="Storage" 
          current={historicalData[historicalData.length - 1]?.storageHealth || 0}
          avg={Math.round(historicalData.reduce((sum, d) => sum + d.storageHealth, 0) / historicalData.length)}
          color="#F59E0B"
        />
        <ComponentSummary 
          label="Resources" 
          current={historicalData[historicalData.length - 1]?.resourceEfficiency || 0}
          avg={Math.round(historicalData.reduce((sum, d) => sum + d.resourceEfficiency, 0) / historicalData.length)}
          color="#EF4444"
        />
        <ComponentSummary 
          label="Connectivity" 
          current={historicalData[historicalData.length - 1]?.networkConnectivity || 0}
          avg={Math.round(historicalData.reduce((sum, d) => sum + d.networkConnectivity, 0) / historicalData.length)}
          color="#06B6D4"
        />
      </div>
    </div>
  );
}

function ComponentSummary({ label, current, avg, color }: { label: string; current: number; avg: number; color: string }) {
  const diff = current - avg;
  return (
    <div className="bg-muted/30 rounded-lg p-2 border border-border/50">
      <div className="text-[10px] text-text-soft mb-1 truncate">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold" style={{ color }}>{current}</span>
        <span className="text-[10px] text-text-soft">/{avg}</span>
      </div>
      {diff !== 0 && (
        <div className={`text-[10px] mt-0.5 ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}
        </div>
      )}
    </div>
  );
}

function NodesTab() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'uptime' | 'cpu' | 'ram'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/pnodes')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch nodes: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(result => {
        const nodesData = result?.data;
        if (Array.isArray(nodesData)) {
          const nodesWithScores = nodesData.map((node: any) => {
            const rawCpu = node.stats?.cpu_percent;
            const hasCpu = typeof rawCpu === 'number';
            const cpu = hasCpu ? rawCpu : null;

            const hasRam =
              typeof node.stats?.ram_used === 'number' &&
              typeof node.stats?.ram_total === 'number' &&
              node.stats.ram_total > 0;
            const ram = hasRam
              ? (node.stats.ram_used / node.stats.ram_total) * 100
              : null;

            const rawUptime = node.stats?.uptime;
            const hasUptime = typeof rawUptime === 'number' && rawUptime > 0;
            const uptime = hasUptime ? rawUptime : 0;

            const scores: number[] = [];

            if (hasCpu && cpu !== null) {
              const cpuScore = Math.max(0, 100 - cpu);
              scores.push(cpuScore);
            }

            if (hasRam && ram !== null) {
              const ramScore = Math.max(0, 100 - ram);
              scores.push(ramScore);
            }

            if (hasUptime) {
              const uptimeScore = Math.min(100, (uptime / 2592000) * 100);
              scores.push(uptimeScore);
            }

            const nodeScore =
              scores.length > 0
                ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
                : 0;

            return {
              ...node,
              healthScore: nodeScore,
              cpu,
              ram,
              uptimeDays: hasUptime ? Math.floor(uptime / 86400) : 0,
            };
          });
          setNodes(nodesWithScores);
        }
      })
      .catch(err => console.error('Error fetching nodes:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredNodes = nodes
    .filter(node => 
      !filter || 
      node.ip?.toLowerCase().includes(filter.toLowerCase()) ||
      node.pubkey?.toLowerCase().includes(filter.toLowerCase()) ||
      node.version?.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'score') return (a.healthScore - b.healthScore) * multiplier;
      if (sortBy === 'uptime') return (a.uptimeDays - b.uptimeDays) * multiplier;
      if (sortBy === 'cpu') return (a.cpu - b.cpu) * multiplier;
      if (sortBy === 'ram') return (a.ram - b.ram) * multiplier;
      return 0;
    });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-text-soft">Loading nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-text-main">Nodes Explorer</h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-semibold">{filteredNodes.length}</span> nodes
            </span>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search IP, pubkey, version..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-border rounded-lg bg-muted/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
        />
      </div>

      <div className="flex-1 bg-muted/30 rounded-xl border border-border/50 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 border-b border-border/50 text-xs font-semibold text-text-soft shrink-0">
          <div className="col-span-3">IP Address</div>
          <div 
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-text-main"
            onClick={() => {
              if (sortBy === 'score') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else setSortBy('score');
            }}
          >
            Health {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-text-main"
            onClick={() => {
              if (sortBy === 'uptime') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else setSortBy('uptime');
            }}
          >
            Uptime {sortBy === 'uptime' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-text-main"
            onClick={() => {
              if (sortBy === 'cpu') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else setSortBy('cpu');
            }}
          >
            CPU {sortBy === 'cpu' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-text-main"
            onClick={() => {
              if (sortBy === 'ram') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else setSortBy('ram');
            }}
          >
            RAM {sortBy === 'ram' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-span-1"></div>
        </div>

        <div className="flex-1 overflow-y-auto modal-scrollbar">
          {filteredNodes.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-text-soft">No nodes found</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredNodes.map((node, index) => (
                <NodeRow 
                  key={node.ip || index} 
                  node={node}
                  onClick={() => setSelectedNode(node)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedNode && (
        <NodeDetailModal 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
}

function NodeRow({ node, onClick }: { node: any; onClick: () => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div 
      className="grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="col-span-3 text-xs font-mono text-text-main truncate">
        {node.ip}
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <span className={`text-sm font-bold ${getScoreColor(node.healthScore)}`}>
          {node.healthScore}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              node.healthScore >= 80 ? 'bg-green-500' :
              node.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${node.healthScore}%` }}
          />
        </div>
      </div>
      <div className="col-span-2 text-xs text-text-soft">
        {node.uptimeDays}d
      </div>
      <div className="col-span-2 text-xs text-text-soft">
        {node.cpu !== null ? node.cpu.toFixed(1) : 'N/A'}%
      </div>
      <div className="col-span-2 text-xs text-text-soft">
        {node.ram !== null ? node.ram.toFixed(1) : 'N/A'}%
      </div>
      <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <TrendingUp className="w-4 h-4 text-primary" />
      </div>
    </div>
  );
}

function NodeDetailModal({ node, onClose }: { node: any; onClose: () => void }) {
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[60] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="w-full max-w-2xl bg-background rounded-xl shadow-2xl border border-border/50 overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div>
              <h3 className="text-lg font-bold text-text-main font-mono">{node.ip}</h3>
              <p className="text-xs text-text-soft">Node Details</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto modal-scrollbar">
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-text-soft mb-2">Overall Health Score</div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{node.healthScore}</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      node.healthScore >= 80 ? 'bg-green-500' :
                      node.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${node.healthScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-text-soft mb-1">CPU Usage</div>
                <div className="text-xl font-bold text-text-main">
                  {node.cpu !== null ? `${node.cpu.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-text-soft mb-1">RAM Usage</div>
                <div className="text-xl font-bold text-text-main">
                  {node.ram !== null ? `${node.ram.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-text-soft mb-1">Uptime</div>
                <div className="text-xl font-bold text-text-main">{node.uptimeDays} days</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-text-soft mb-1">Version</div>
                <div className="text-xl font-bold text-text-main">{node.version || 'N/A'}</div>
              </div>
            </div>

            {node.pubkey && (
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="text-xs text-text-soft mb-1">Public Key</div>
                <div className="text-xs font-mono text-text-main break-all">{node.pubkey}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function RecommendationsTab({ healthData }: { healthData: NetworkHealthScore }) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showSimulator, setShowSimulator] = useState(false);

  const filteredRecommendations = healthData.recommendations.filter(rec => 
    filter === 'all' ? true : rec.severity === filter
  );

  const criticalCount = healthData.recommendations.filter(r => r.severity === 'critical').length;
  const warningCount = healthData.recommendations.filter(r => r.severity === 'warning').length;
  const infoCount = healthData.recommendations.filter(r => r.severity === 'info').length;

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Header with filters and stats */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-text-main">Recommendations</h3>
          {healthData.recommendations.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-semibold text-red-600 dark:text-red-400">{criticalCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{warningCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{infoCount}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5
              ${showSimulator 
                ? 'bg-primary text-white border-primary shadow-md' 
                : 'bg-muted border-border hover:bg-muted-foreground/10 text-text-main'
              }
            `}
          >
            <Zap className="w-3.5 h-3.5" />
            What-If Simulator
          </button>
          <FilterButton 
            label="All" 
            count={healthData.recommendations.length}
            isActive={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterButton 
            label="Critical" 
            count={criticalCount}
            isActive={filter === 'critical'}
            onClick={() => setFilter('critical')}
            color="red"
          />
          <FilterButton 
            label="Warning" 
            count={warningCount}
            isActive={filter === 'warning'}
            onClick={() => setFilter('warning')}
            color="yellow"
          />
          <FilterButton 
            label="Info" 
            count={infoCount}
            isActive={filter === 'info'}
            onClick={() => setFilter('info')}
            color="blue"
          />
        </div>
      </div>

      {/* Content - Simulator or Recommendations */}
      {showSimulator ? (
        <WhatIfSimulator healthData={healthData} />
      ) : (
        <>
          {filteredRecommendations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Lightbulb className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">All Good! 🎉</h3>
                <p className="text-sm text-text-soft">No {filter !== 'all' ? filter : ''} recommendations at this time.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 modal-scrollbar">
              {filteredRecommendations.map((rec, index) => (
                <RecommendationCard key={rec.id || index} recommendation={rec} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WhatIfSimulator({ healthData }: { healthData: NetworkHealthScore }) {
  const [improvements, setImprovements] = useState({
    versionConsensus: 0,
    networkUptime: 0,
    storageHealth: 0,
    resourceEfficiency: 0,
    networkConnectivity: 0,
  });

  const calculateProjectedScore = () => {
    let projectedScore = 0;
    Object.entries(healthData.components).forEach(([key, component]) => {
      const improvement = improvements[key as keyof typeof improvements] || 0;
      const newScore = Math.min(100, component.score + improvement);
      projectedScore += newScore * component.weight;
    });
    return Math.round(projectedScore);
  };

  const projectedScore = calculateProjectedScore();
  const scoreDiff = projectedScore - healthData.overall;

  return (
    <div className="flex-1 flex gap-4 overflow-hidden">
      {/* Left: Score Display & Impact */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-sm font-bold text-text-main">What-If Simulator</h4>
              <p className="text-[10px] text-text-soft">See projected impact</p>
            </div>
          </div>

          {/* Current vs Projected */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/50 rounded-lg p-2 border border-border/50">
              <div className="text-[10px] text-text-soft mb-0.5">Current</div>
              <div className="text-xl font-bold text-text-main">{healthData.overall}</div>
            </div>
            <div className="bg-background/50 rounded-lg p-2 border border-primary/50">
              <div className="text-[10px] text-primary mb-0.5">Projected</div>
              <div className="flex items-baseline gap-1">
                <div className="text-xl font-bold text-primary">{projectedScore}</div>
                {scoreDiff !== 0 && (
                  <div className={`text-xs font-semibold ${scoreDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        {scoreDiff > 0 ? (
          <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-3 overflow-y-auto modal-scrollbar">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                  Potential Impact
                </h4>
                <p className="text-[11px] text-text-soft mb-2">
                  Implementing these improvements could increase your score by <span className="font-bold text-green-600 dark:text-green-400">{scoreDiff} points</span>.
                </p>
                <div className="text-[11px] text-text-soft">
                  {projectedScore >= 90 && "→ EXCELLENT range! 🌟"}
                  {projectedScore >= 80 && projectedScore < 90 && "→ GOOD range! ⭐"}
                  {projectedScore >= 60 && projectedScore < 80 && "→ FAIR range."}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-muted/30 border border-border/50 rounded-xl p-3 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-xs text-text-soft">Adjust sliders to simulate improvements</p>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={() => setImprovements({
            versionConsensus: 0,
            networkUptime: 0,
            storageHealth: 0,
            resourceEfficiency: 0,
            networkConnectivity: 0,
          })}
          className="w-full px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Right: Component Sliders */}
      <div className="flex-1 bg-muted/30 rounded-xl border border-border/50 p-4 overflow-y-auto modal-scrollbar">
        <div className="space-y-3">
          {Object.entries(healthData.components).map(([key, component]) => {
            const improvement = improvements[key as keyof typeof improvements] || 0;
            const newScore = Math.min(100, component.score + improvement);
            
            const maxImprovement = Math.min(50, 100 - component.score);
            const isMaxed = maxImprovement === 0;
            
            return (
              <div key={key} className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: component.color }}
                    />
                    <span className="text-xs font-semibold text-text-main">{component.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-text-soft">{component.score}</span>
                    <span className="text-[11px] text-text-soft">→</span>
                    <span className="text-[11px] font-bold text-primary">{newScore}</span>
                    {improvement !== 0 && (
                      <span className="text-[11px] text-green-500">(+{improvement})</span>
                    )}
                  </div>
                </div>
                
                {isMaxed ? (
                  <div className="w-full h-1.5 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-[9px] text-green-600 font-semibold">Already at maximum</span>
                  </div>
                ) : (
                  <input
                    type="range"
                    min="0"
                    max={maxImprovement}
                    value={improvement}
                    onChange={(e) => setImprovements({
                      ...improvements,
                      [key]: parseInt(e.target.value)
                    })}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${component.color} 0%, ${component.color} ${(improvement / maxImprovement) * 100}%, #E5E7EB ${(improvement / maxImprovement) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                )}
                
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-text-soft">0</span>
                  <span className="text-[9px] text-text-soft">+{maxImprovement}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterButton({ 
  label, 
  count, 
  isActive, 
  onClick, 
  color 
}: { 
  label: string; 
  count: number; 
  isActive: boolean; 
  onClick: () => void;
  color?: 'red' | 'yellow' | 'blue';
}) {
  const colorClasses = {
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
        ${isActive 
          ? color ? `${colorClasses[color]} ring-2 ring-offset-1` : 'bg-primary text-white border-primary shadow-md ring-2 ring-primary/20' 
          : 'bg-muted border-border hover:bg-muted-foreground/10 text-text-main'
        }
      `}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

function RecommendationCard({ recommendation }: { recommendation: any }) {
  const severityConfig = {
    critical: {
      icon: '🔴',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      badgeBg: 'bg-red-500',
    },
    warning: {
      icon: '🟡',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      badgeBg: 'bg-yellow-500',
    },
    info: {
      icon: '🔵',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-500',
    },
  };

  const config = severityConfig[recommendation.severity as keyof typeof severityConfig];

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-3`}>
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${config.text} line-clamp-1`}>
              {recommendation.title}
            </h4>
            <span className={`${config.badgeBg} text-white text-[10px] px-1.5 py-0.5 rounded uppercase shrink-0`}>
              {recommendation.severity}
            </span>
          </div>
          
          <p className="text-xs text-text-soft mb-2 line-clamp-2">{recommendation.description}</p>
          
          {recommendation.impact && (
            <div className="mb-2 text-[11px] text-text-soft italic">
              💡 {recommendation.impact}
            </div>
          )}

          {recommendation.affectedNodes && recommendation.affectedNodes.length > 0 && (
            <div className="mb-2">
              <div className="text-[11px] text-text-soft mb-1">
                Affected: {recommendation.affectedNodes.length} node{recommendation.affectedNodes.length > 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap gap-1">
                {recommendation.affectedNodes.slice(0, 3).map((ip: string, i: number) => (
                  <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                    {ip}
                  </span>
                ))}
                {recommendation.affectedNodes.length > 3 && (
                  <span className="text-[10px] text-text-soft px-1.5 py-0.5">
                    +{recommendation.affectedNodes.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {recommendation.actionable && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button className="text-[11px] px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                View Nodes
              </button>
              <button className="text-[11px] px-2 py-1 border border-border rounded hover:bg-muted transition-colors">
                Docs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
