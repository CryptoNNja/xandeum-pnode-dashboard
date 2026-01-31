"use client";

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, HeartPulse, CheckCircle2, Zap, Database, Cpu, Wifi } from 'lucide-react';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { calculateNetworkHealthV2, getHealthRating, getHealthColor, getHealthGradient } from '@/lib/network-health';
import type { PNode } from '@/lib/types';
import type { NetworkHealthScore } from '@/lib/network-health';

interface NetworkHealthCardV2Props {
  nodes: PNode[];
  className?: string;
}

export function NetworkHealthCardV2({ nodes, className = '' }: NetworkHealthCardV2Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate health score
  const healthData = useMemo(() => calculateNetworkHealthV2(nodes), [nodes]);

  // Rating display
  const ratingStars = useMemo(() => {
    const stars = {
      excellent: '⭐⭐⭐⭐⭐',
      good: '⭐⭐⭐⭐',
      fair: '⭐⭐⭐',
      poor: '⭐⭐',
      critical: '⭐',
    };
    return stars[healthData.rating];
  }, [healthData.rating]);

  const ratingLabel = useMemo(() => {
    const labels = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
      critical: 'Critical',
    };
    return labels[healthData.rating];
  }, [healthData.rating]);

  // Mock data for deltas (will be replaced with real historical data)
  const yesterdayScore = 66; // TODO: Get from API
  const lastWeekScore = 70; // TODO: Get from API
  const deltaYesterday = healthData.overall - yesterdayScore;
  const deltaLastWeek = healthData.overall - lastWeekScore;

  // Mock sparkline data (will be replaced with real historical data)
  const sparklineData = [62, 64, 66, 68, 66, 65, healthData.overall];

  return (
    <div className={`relative overflow-hidden p-6 transition-all duration-300 ${className}`}>
      {/* Header - Match style of other cards */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
              Network Health
            </p>
            <InfoTooltip content="Comprehensive health score based on version consensus, uptime, storage, resources, and connectivity. Click card for detailed modal (coming soon)." />
          </div>
          <p className="text-sm text-text-faint">Component-based scoring</p>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{ 
            background: 'rgba(16, 185, 129, 0.12)' 
          }}
        >
          <HeartPulse
            className="w-5 h-5"
            strokeWidth={2.3}
            style={{ color: '#10B981' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Score and Deltas - Inline like other cards */}
        <div className="flex items-end justify-between gap-6">
          <div>
            {/* Main Score */}
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-bold tracking-tight"
                style={{ color: getHealthColor(healthData.rating) }}
              >
                {healthData.overall}
              </span>
              <span className="text-lg text-text-soft font-semibold">/100</span>
            </div>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">{ratingStars}</span>
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: getHealthColor(healthData.rating) }}
              >
                {ratingLabel}
              </span>
            </div>

            {/* Deltas */}
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-text-soft">
                <span
                  className="flex items-center gap-2 font-semibold"
                  style={{ color: deltaYesterday >= 0 ? '#10B981' : '#EF4444' }}
                >
                  <span>{deltaYesterday >= 0 ? '▲' : '▼'}</span>
                  <span className="font-mono">
                    {deltaYesterday > 0 ? '+' : ''}{deltaYesterday}
                  </span>
                </span>
                <span>vs yesterday</span>
              </div>
              <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-text-soft">
                <span
                  className="flex items-center gap-2 font-semibold"
                  style={{ color: deltaLastWeek >= 0 ? '#10B981' : '#EF4444' }}
                >
                  <span>{deltaLastWeek >= 0 ? '▲' : '▼'}</span>
                  <span className="font-mono">
                    {deltaLastWeek > 0 ? '+' : ''}{deltaLastWeek}
                  </span>
                </span>
                <span>vs last week</span>
              </div>
            </div>
          </div>

          {/* Mini Sparkline */}
          <div className="shrink-0">
            <MiniSparkline 
              data={sparklineData} 
              height={60} 
              color={getHealthColor(healthData.rating)} 
            />
          </div>
        </div>


        {/* Health Components - Always visible */}
        <div className="space-y-4 pt-6 border-t border-border-app-soft">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5" strokeWidth={2} />
            Health Components
          </div>

          {/* Component Bars */}
          <div className="space-y-2">
            {Object.entries(healthData.components).map(([key, component]) => (
              <ComponentBar
                key={key}
                component={component}
              />
            ))}
          </div>

          {/* Top Issues - Expandable */}
          {isExpanded && healthData.recommendations.length > 0 && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">

              <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                💡 Top Issues
                <span className="px-1.5 py-0.5 text-[10px] bg-destructive/10 text-destructive rounded">
                  {healthData.recommendations.length}
                </span>
              </div>
              <div className="space-y-1">
                {healthData.recommendations.slice(0, 3).map(rec => (
                  <IssueItem key={rec.id} recommendation={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 text-xs text-text-soft hover:text-text-main border border-border-app-soft rounded hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show Issues & Actions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface MiniSparklineProps {
  data: number[];
  height: number;
  color: string;
}

function MiniSparkline({ data, height, color }: MiniSparklineProps) {
  const width = 200;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((value - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Area fill */}
      <path
        d={`M ${padding},${height} L ${points} L ${width - padding},${height} Z`}
        fill={color}
        fillOpacity={0.1}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Points */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((value - min) / range) * (height - padding * 2) - padding;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={2}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

interface ComponentBarProps {
  component: NetworkHealthScore['components'][keyof NetworkHealthScore['components']];
}

function ComponentBar({ component }: ComponentBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Map icon names to Lucide components
  const iconMap: Record<string, any> = {
    'CheckCircle2': CheckCircle2,
    'Zap': Zap,
    'Database': Database,
    'Cpu': Cpu,
    'Wifi': Wifi,
  };

  const IconComponent = iconMap[component.icon] || CheckCircle2;

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <IconComponent 
            className="w-3.5 h-3.5" 
            style={{ color: component.color }}
            strokeWidth={2}
          />
          <span className="text-xs font-medium">{component.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{component.score}</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${component.score}%`,
            backgroundColor: component.color,
            boxShadow: isHovered ? `0 0 10px ${component.color}60` : 'none',
          }}
        />
      </div>

      {/* Tooltip on hover - Fixed background */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
        <div className="bg-card border border-border rounded p-3 text-xs shadow-xl min-w-[220px] backdrop-blur-sm"
          style={{ backgroundColor: 'var(--card)' }}
        >
          <div className="font-semibold mb-2 text-text-main flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: component.color }} />
            {component.label}
          </div>
          <div className="text-text-soft space-y-1">
            {Object.entries(component.details).map(([key, value]) => {
              // Skip rendering distribution as a single line
              if (key === 'distribution' && typeof value === 'object') {
                return (
                  <div key={key} className="pt-1 mt-1 border-t border-border space-y-0.5">
                    <div className="font-medium text-text-main text-[10px] uppercase tracking-wider mb-1">Distribution:</div>
                    {Object.entries(value as Record<string, any>).map(([distKey, distValue]) => {
                      // Format distribution keys nicely
                      const labelMap: Record<string, string> = {
                        'moreThan30d': '30+ days',
                        'between7And30d': '7-30 days',
                        'between1And7d': '1-7 days',
                        'lessThan1d': '<1 day',
                      };
                      const label = labelMap[distKey] || distKey;
                      
                      return (
                        <div key={distKey} className="flex justify-between gap-4 pl-2">
                          <span className="text-[10px]">{label}:</span>
                          <span className="font-medium text-text-main">{distValue} nodes</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              
              // Format regular values
              let displayValue: string;
              if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
              } else {
                displayValue = String(value);
              }
              
              // Format key nicely
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              return (
                <div key={key} className="flex justify-between gap-4">
                  <span>{formattedKey}:</span>
                  <span className="font-medium text-text-main">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface IssueItemProps {
  recommendation: NetworkHealthScore['recommendations'][0];
}

function IssueItem({ recommendation }: IssueItemProps) {
  const severityColors = {
    critical: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const severityIcons = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  };

  return (
    <div className="text-xs p-2 bg-muted/50 rounded hover:bg-muted transition-all duration-200 
      cursor-pointer hover:shadow-sm hover:scale-[1.02] active:scale-95">
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5">{severityIcons[recommendation.severity]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{recommendation.title}</div>
          {recommendation.impact && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {recommendation.impact}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
