'use client';

import { Search, BarChart3, Download, GitCompare, Filter, TrendingUp } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string, prompt: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      icon: Search,
      label: 'Search',
      prompt: 'Help me find specific nodes',
      color: 'hover:text-blue-500',
    },
    {
      icon: BarChart3,
      label: 'Charts',
      prompt: 'Show me visualization of the network',
      color: 'hover:text-purple-500',
    },
    {
      icon: Download,
      label: 'Export',
      prompt: 'How do I export this data?',
      color: 'hover:text-green-500',
    },
    {
      icon: GitCompare,
      label: 'Compare',
      prompt: 'Compare different nodes or networks',
      color: 'hover:text-orange-500',
    },
  ];

  return (
    <div className="px-4 py-2 border-t border-border bg-muted/30">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-2">Quick:</span>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onAction(action.label.toLowerCase(), action.prompt)}
            className={`
              p-2 rounded-lg
              hover:bg-muted
              transition-all
              group
              ${action.color}
            `}
            title={action.label}
          >
            <action.icon className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}
