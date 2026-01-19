'use client';

import { Info, TrendingUp, HardDrive, Activity, Zap } from 'lucide-react';
import type { Globe3DTheme } from '@/lib/types-3d';

type Map3DLegendProps = {
  theme: Globe3DTheme;
  stats: {
    totalNodes: number;
    healthyNodes: number;
    warningNodes: number;
    criticalNodes: number;
    avgHealth: number;
    totalStorage: number;
    activeStreams: number;
  };
};

export function Map3DLegend({ theme, stats }: Map3DLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
      <div className="flex flex-col sm:flex-row gap-3 pointer-events-auto">
        {/* Legend Card */}
        <div className="flex-1 bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              {/* Title */}
              <div className="text-sm font-semibold text-text-primary">
                3D Visualization Guide
              </div>
              
              {/* Visual Encoding */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Height */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-medium">Height</span>
                  </div>
                  <div className="text-text-primary">= Health Score</div>
                  <div className="text-text-tertiary">Taller = Healthier</div>
                </div>
                
                {/* Color */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span className="font-medium">Color</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: theme.nodes.healthy }}
                    />
                    <span className="text-text-primary">Healthy (≥70)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: theme.nodes.warning }}
                    />
                    <span className="text-text-primary">Warning (40-69)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: theme.nodes.critical }}
                    />
                    <span className="text-text-primary">Critical (&lt;40)</span>
                  </div>
                </div>
                
                {/* Size */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="font-medium">Size</span>
                  </div>
                  <div className="text-text-primary">= Uptime</div>
                  <div className="text-text-tertiary">Larger = More Stable</div>
                </div>
              </div>
              
              {/* Interactions */}
              <div className="pt-2 border-t border-border-app text-xs text-text-secondary">
                <span className="font-medium">💡 Tip:</span> Hover nodes for details • Drag to rotate • Scroll to zoom
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Card */}
        <div className="bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-xl p-4 shadow-lg min-w-[200px]">
          <div className="space-y-2.5">
            {/* Network Health */}
            <div>
              <div className="text-xs text-text-secondary mb-1">Network Health</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  {stats.avgHealth.toFixed(0)}
                </span>
                <span className="text-sm text-text-secondary">/100</span>
              </div>
            </div>
            
            {/* Distribution */}
            <div className="space-y-1.5 pt-2 border-t border-border-app">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: theme.nodes.healthy }}
                  />
                  <span className="text-text-secondary">Healthy</span>
                </div>
                <span className="font-medium text-text-primary">{stats.healthyNodes}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: theme.nodes.warning }}
                  />
                  <span className="text-text-secondary">Warning</span>
                </div>
                <span className="font-medium text-text-primary">{stats.warningNodes}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: theme.nodes.critical }}
                  />
                  <span className="text-text-secondary">Critical</span>
                </div>
                <span className="font-medium text-text-primary">{stats.criticalNodes}</span>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="space-y-1.5 pt-2 border-t border-border-app">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Total Storage</span>
                <span className="font-medium text-text-primary">
                  {(stats.totalStorage / 1024).toFixed(1)} TB
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-text-secondary">Active Streams</span>
                </div>
                <span className="font-medium text-text-primary">{stats.activeStreams}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
