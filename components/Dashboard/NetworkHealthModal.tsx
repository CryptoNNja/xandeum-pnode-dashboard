"use client";

import { useState } from 'react';
import { X, Download, TrendingUp, Activity, History, Users, Lightbulb, CheckCircle2, Zap, Database, Cpu, Wifi } from 'lucide-react';
import type { NetworkHealthScore } from '@/lib/network-health';

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

  if (!isOpen) return null;

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clicked');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center pointer-events-none">
        <div 
          className="w-full h-full bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${healthData.components.versionConsensus.color}20` }}
              >
                <Activity className="w-5 h-5" style={{ color: healthData.components.versionConsensus.color }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-main">Network Health - Detailed Analysis</h2>
                <p className="text-sm text-text-soft">
                  Overall Score: {healthData.overall}/100 ({healthData.rating})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-4 border-b border-border overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-all
                    ${isActive 
                      ? 'bg-card text-primary border-b-2 border-primary' 
                      : 'text-text-soft hover:text-text-main hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'overview' && <OverviewTab healthData={healthData} />}
            {activeTab === 'components' && <ComponentsTab healthData={healthData} />}
            {activeTab === 'history' && <HistoryTab />}
            {activeTab === 'nodes' && <NodesTab />}
            {activeTab === 'recommendations' && <RecommendationsTab healthData={healthData} />}
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
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <div className="inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg mb-4 mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{healthData.overall}</div>
              <div className="text-xs text-white/80">/100</div>
            </div>
          </div>
        </div>
        <div className="text-xl font-semibold text-text-main mb-2">
          {healthData.rating === 'excellent' && '⭐⭐⭐⭐⭐ Excellent'}
          {healthData.rating === 'good' && '⭐⭐⭐⭐ Good'}
          {healthData.rating === 'fair' && '⭐⭐⭐ Fair'}
          {healthData.rating === 'poor' && '⭐⭐ Poor'}
          {healthData.rating === 'critical' && '⭐ Critical'}
        </div>
        <p className="text-sm text-text-soft max-w-2xl mx-auto">
          {healthData.rating === 'poor' && 'Your network health needs attention. Multiple components require optimization.'}
          {healthData.rating === 'fair' && 'Your network health is acceptable but has room for improvement.'}
          {healthData.rating === 'good' && 'Your network health is good. Minor optimizations recommended.'}
          {healthData.rating === 'excellent' && 'Your network health is excellent! Keep up the great work.'}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(healthData.components).map(([key, component]) => {
          // Map icon names to components
          const iconMap: Record<string, any> = {
            'CheckCircle2': CheckCircle2,
            'Zap': Zap,
            'Database': Database,
            'Cpu': Cpu,
            'Wifi': Wifi,
          };
          const Icon = iconMap[component.icon] || Activity;
          
          return (
            <div key={key} className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${component.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: component.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-text-soft">{component.label}</div>
                  <div className="text-lg font-bold text-text-main">{component.score}/100</div>
                </div>
              </div>
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
          );
        })}
      </div>

      {/* Top Issues */}
      {healthData.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Top Issues Requiring Attention
          </h3>
          <div className="space-y-3">
            {healthData.recommendations.slice(0, 3).map((rec, index) => {
              const severityColors = {
                critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600 dark:text-red-400', icon: '🔴' },
                warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', icon: '🟡' },
                info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: '🔵' },
              };
              const style = severityColors[rec.severity];

              return (
                <div key={index} className={`${style.bg} border ${style.border} rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{style.icon}</span>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${style.text} mb-1`}>
                        {rec.title}
                      </h4>
                      <p className="text-sm text-text-soft mb-2">{rec.description}</p>
                      {rec.impact && (
                        <p className="text-xs text-text-soft italic">
                          Impact: {rec.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Placeholder for 30-day trend chart */}
      <div className="bg-muted/30 rounded-lg p-6 border border-border">
        <h3 className="text-sm font-semibold text-text-main mb-4">30-Day Health Trend</h3>
        <div className="h-48 flex items-center justify-center text-text-soft">
          <div className="text-center">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Historical data chart coming soon</p>
            <p className="text-xs">Requires historical API implementation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentsTab({ healthData }: { healthData: NetworkHealthScore }) {
  return (
    <div className="text-center py-12">
      <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Component Details</h3>
      <p className="text-sm text-text-soft">Coming in Phase 2</p>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="text-center py-12">
      <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Historical Analysis</h3>
      <p className="text-sm text-text-soft">Coming in Phase 2</p>
    </div>
  );
}

function NodesTab() {
  return (
    <div className="text-center py-12">
      <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Node Details</h3>
      <p className="text-sm text-text-soft">Coming in Phase 3</p>
    </div>
  );
}

function RecommendationsTab({ healthData }: { healthData: NetworkHealthScore }) {
  return (
    <div className="text-center py-12">
      <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Recommendations & Actions</h3>
      <p className="text-sm text-text-soft">Coming in Phase 3</p>
    </div>
  );
}
