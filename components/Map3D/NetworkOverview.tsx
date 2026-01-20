'use client';

import { Globe2, Zap, Radio, CloudOff, Lock, HardDrive, MapPin, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import type { PNode } from '@/lib/types';

type NetworkOverviewProps = {
  nodes: PNode[];
  onFilterChange?: (filterType: 'all' | 'active' | 'gossip' | 'stale' | 'private') => void;
};

type KPICard = {
  id: string;
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  filterType?: 'all' | 'active' | 'gossip' | 'stale' | 'private';
};

export function NetworkOverview({ nodes, onFilterChange }: NetworkOverviewProps) {
  const stats = useMemo(() => {
    const total = nodes.length;
    const active = nodes.filter(n => n.status === 'active').length;
    const gossip = nodes.filter(n => n.status === 'gossip_only').length;
    const stale = nodes.filter(n => n.status === 'stale').length;
    const privateNodes = nodes.filter(n => !n.stats || n.status === 'gossip_only' || n.status === 'stale').length;
    
    const totalStorage = nodes.reduce((sum, n) => {
      return sum + (n.stats?.storage_committed || 0);
    }, 0);
    
    // Get top country
    const countryCount = new Map<string, number>();
    nodes.forEach(n => {
      if (n.country) {
        countryCount.set(n.country, (countryCount.get(n.country) || 0) + 1);
      }
    });
    const topCountry = Array.from(countryCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    // Calculate average performance (using uptime as proxy)
    const avgUptime = nodes.reduce((sum, n) => {
      return sum + (n.stats?.uptime || 0);
    }, 0) / (nodes.length || 1);
    const avgPerformance = Math.min(100, (avgUptime / (24 * 3600 * 7)) * 100); // 7 days = 100%
    
    return {
      total,
      active,
      gossip,
      stale,
      privateNodes,
      totalStorage,
      topCountry,
      avgPerformance,
    };
  }, [nodes]);

  const cards: KPICard[] = [
    {
      id: 'total',
      label: 'Total Nodes',
      value: stats.total,
      subtitle: 'Network Wide',
      icon: Globe2,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      filterType: 'all',
    },
    {
      id: 'active',
      label: 'Active',
      value: stats.active,
      subtitle: `${((stats.active / stats.total) * 100).toFixed(0)}% of total`,
      icon: Zap,
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      filterType: 'active',
    },
    {
      id: 'gossip',
      label: 'Gossip Only',
      value: stats.gossip,
      subtitle: `${((stats.gossip / stats.total) * 100).toFixed(0)}% of total`,
      icon: Radio,
      color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
      filterType: 'gossip',
    },
    {
      id: 'stale',
      label: 'Stale',
      value: stats.stale,
      subtitle: `${((stats.stale / stats.total) * 100).toFixed(0)}% of total`,
      icon: CloudOff,
      color: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
      filterType: 'stale',
    },
    {
      id: 'private',
      label: 'Private',
      value: stats.privateNodes,
      subtitle: 'Limited visibility',
      icon: Lock,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      filterType: 'private',
    },
    {
      id: 'storage',
      label: 'Total Storage',
      value: `${(stats.totalStorage / (1024 ** 4)).toFixed(1)} TB`,
      subtitle: 'Committed capacity',
      icon: HardDrive,
      color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
    },
    {
      id: 'country',
      label: 'Top Country',
      value: stats.topCountry ? stats.topCountry[0] : 'N/A',
      subtitle: stats.topCountry ? `${stats.topCountry[1]} nodes` : '',
      icon: MapPin,
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
    },
    {
      id: 'performance',
      label: 'Avg Performance',
      value: `${stats.avgPerformance.toFixed(0)}%`,
      subtitle: 'Network health',
      icon: TrendingUp,
      color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    },
  ];

  return (
    <div className="w-full px-4 py-2 bg-bg-app/50 backdrop-blur-sm border-b border-border-app">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-aqua animate-pulse" />
            <h2 className="text-sm font-bold text-text-primary">Network Overview</h2>
          </div>
          <p className="text-[10px] text-text-secondary">
            Complete network visibility • All node types
          </p>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {cards.map((card) => {
            const Icon = card.icon;
            const isClickable = !!card.filterType && onFilterChange;

            return (
              <button
                key={card.id}
                onClick={() => card.filterType && onFilterChange?.(card.filterType)}
                disabled={!isClickable}
                className={`
                  relative group bg-gradient-to-br ${card.color}
                  rounded-lg p-2 border
                  transition-all duration-150
                  ${isClickable ? 'hover:scale-[1.02] hover:shadow-md cursor-pointer' : 'cursor-default'}
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-text-primary flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-text-primary leading-tight">
                      {card.value}
                    </div>
                    <div className="text-[9px] font-medium text-text-secondary uppercase tracking-wide truncate">
                      {card.label}
                    </div>
                    {card.subtitle && (
                      <div className="text-[8px] text-text-tertiary truncate">
                        {card.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
