'use client';

import { useDashboardContext } from '@/lib/dashboard-context';
import { 
  Search, 
  TrendingUp, 
  Scale, 
  Wrench, 
  Download, 
  BarChart3, 
  Lightbulb,
  Activity,
  Trophy,
  GitCompare,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface Prompt {
  icon: LucideIcon;
  text: string;
  fullPrompt: string;
}

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { currentPage, selectedNodes, activeFilters, visibleNodeCount } = useDashboardContext();

  const getContextualPrompts = (): Prompt[] => {
    // On node detail page
    if (currentPage.startsWith('/pnode/')) {
      const nodeIp = currentPage.split('/pnode/')[1];
      return [
        { icon: Search, text: 'Analyze this node', fullPrompt: `Analyze the node at ${nodeIp}` },
        { icon: TrendingUp, text: 'Uptime trends', fullPrompt: `Show uptime trends for ${nodeIp}` },
        { icon: Scale, text: 'Compare similar', fullPrompt: `Compare ${nodeIp} with similar nodes` },
        { icon: Wrench, text: 'Optimization tips', fullPrompt: `Give me optimization tips for ${nodeIp}` },
      ];
    }

    // When nodes are selected
    if (selectedNodes.length > 0) {
      return [
        { icon: Scale, text: `Compare ${selectedNodes.length} nodes`, fullPrompt: `Compare these ${selectedNodes.length} selected nodes` },
        { icon: Download, text: 'Export selection', fullPrompt: 'Export the selected nodes data' },
        { icon: BarChart3, text: 'Aggregate stats', fullPrompt: `Show aggregate statistics for ${selectedNodes.length} selected nodes` },
        { icon: Search, text: 'Find patterns', fullPrompt: 'Analyze patterns in the selected nodes' },
      ];
    }

    // When filters are active
    if (activeFilters.network || activeFilters.status) {
      const filterDesc = [
        activeFilters.network && `${activeFilters.network} network`,
        activeFilters.status && `${activeFilters.status} nodes`,
      ].filter(Boolean).join(', ');

      return [
        { icon: BarChart3, text: 'Analyze filtered', fullPrompt: `Analyze the ${filterDesc}` },
        { icon: Search, text: 'Why these results?', fullPrompt: `Explain the current filter results (${filterDesc})` },
        { icon: GitCompare, text: 'Compare groups', fullPrompt: 'Compare different groups in the filtered data' },
        { icon: Lightbulb, text: 'Insights', fullPrompt: `Give me insights about the ${filterDesc}` },
      ];
    }

    // Default dashboard prompts
    return [
      { icon: Activity, text: 'Network health', fullPrompt: 'Show me the overall network health' },
      { icon: Trophy, text: 'Top performing', fullPrompt: 'Who are the top performing nodes?' },
      { icon: GitCompare, text: 'MAINNET vs DEVNET', fullPrompt: 'Compare MAINNET and DEVNET networks' },
      { icon: AlertTriangle, text: 'Issues & alerts', fullPrompt: 'Show me any issues or nodes that need attention' },
    ];
  };

  const prompts = getContextualPrompts();

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <p className="text-xs text-muted-foreground font-medium">
            {currentPage.startsWith('/pnode/') && 'About this node:'}
            {selectedNodes.length > 0 && 'With your selection:'}
            {(activeFilters.network || activeFilters.status) && 'For these filters:'}
            {!currentPage.startsWith('/pnode/') && selectedNodes.length === 0 && !activeFilters.network && 'Try asking:'}
          </p>
        </div>
        {visibleNodeCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {visibleNodeCount} nodes visible
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt, i) => {
          const Icon = prompt.icon;
          return (
            <button
              key={i}
              onClick={() => onSelect(prompt.fullPrompt)}
              className="
                p-3 rounded-lg text-left text-sm
                bg-muted/50 hover:bg-muted
                border border-border hover:border-purple-500/50
                transition-all
                group
              "
            >
              <Icon className="w-4 h-4 mb-1.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs block">{prompt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
