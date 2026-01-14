'use client';

import { X, Trash2, Settings, Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import { QuickActions } from './QuickActions';
import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useDashboardContext } from '@/lib/dashboard-context';
import { usePnodeDashboard } from '@/hooks/usePnodeDashboard';
import { useTheme } from '@/lib/theme';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { loadHistory, saveHistory, clearHistory } = useChatHistory();
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const { currentPage, selectedNodes, activeFilters } = useDashboardContext();
  const { themeId } = useTheme();
  const isDark = themeId === 'dark';
  const { 
    pnodes, 
    filteredAndSortedPNodes,
    networkHealthScore,
    storageCapacityStats,
    avgCpuUsage,
    avgRamUsage,
    networkUptimeStats,
    publicCount,
    privateCount,
    healthDistribution
  } = usePnodeDashboard();

  // Prepare dashboard context dynamically
  const getDashboardContext = () => {
    if (!pnodes || pnodes.length === 0) return null;
    
    // Public nodes (active status) + Private nodes (gossip_only status) = All online nodes
    const publicNodes = pnodes.filter(p => p.status === 'active').length;
    const privateNodes = pnodes.filter(p => p.status === 'gossip_only').length;
    const onlineNodes = publicNodes + privateNodes;
    const offlineNodes = pnodes.length - onlineNodes;
    const totalStorage = storageCapacityStats?.totalCommitted || 0;
    
    return {
      totalNodes: pnodes.length,
      visibleNodes: filteredAndSortedPNodes?.length || pnodes.length,
      selectedNodes: selectedNodes?.length || 0,
      currentPage,
      activeFilters,
      // Real KPIs from dashboard
      kpis: {
        networkHealthScore: networkHealthScore || 0,
        totalStorage: totalStorage,
        onlineNodes: onlineNodes,
        offlineNodes: offlineNodes,
        publicNodes: publicNodes,
        privateNodes: privateNodes,
        avgCpuUsage: avgCpuUsage?.percent || 0,
        avgRamUsage: avgRamUsage?.ratio || 0,
        networkUptime: networkUptimeStats?.percent || 0,
        healthDistribution: healthDistribution,
      },
      // Network breakdown for better context
      networkBreakdown: {
        mainnet: {
          total: pnodes.filter(p => p.network === 'MAINNET').length,
          online: pnodes.filter(p => p.network === 'MAINNET' && (p.status === 'active' || p.status === 'gossip_only')).length,
          avgScore: pnodes.filter(p => p.network === 'MAINNET').reduce((sum, p) => sum + (p._score || 0), 0) / (pnodes.filter(p => p.network === 'MAINNET').length || 1),
        },
        devnet: {
          total: pnodes.filter(p => p.network === 'DEVNET').length,
          online: pnodes.filter(p => p.network === 'DEVNET' && (p.status === 'active' || p.status === 'gossip_only')).length,
          avgScore: pnodes.filter(p => p.network === 'DEVNET').reduce((sum, p) => sum + (p._score || 0), 0) / (pnodes.filter(p => p.network === 'DEVNET').length || 1),
        },
      },
      // Top 5 from each network
      topMainnetNodes: [...pnodes]
        .filter(p => p.network === 'MAINNET')
        .sort((a, b) => (b._score || 0) - (a._score || 0))
        .slice(0, 5)
        .map(node => ({
          ip: node.ip,
          healthStatus: node._healthStatus || 'Unknown',
          healthScore: node._score || 0,
          status: node.status,
        })),
      topDevnetNodes: [...pnodes]
        .filter(p => p.network === 'DEVNET')
        .sort((a, b) => (b._score || 0) - (a._score || 0))
        .slice(0, 5)
        .map(node => ({
          ip: node.ip,
          healthStatus: node._healthStatus || 'Unknown',
          healthScore: node._score || 0,
          status: node.status,
        })),
    };
  };

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error, setMessages, setInput } = useChat({
    api: '/api/chat',
    initialMessages: [], // Start with empty to avoid hydration mismatch
  });

  // Custom submit handler that includes dashboard context
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const context = getDashboardContext();
    console.log('📊 Sending dashboard context to Ronin AI:', context);
    
    // Call original submit with dashboard context in body
    originalHandleSubmit(e, {
      body: {
        dashboardContext: context,
      },
    });
  };

  // Load history only on client-side after mount
  useEffect(() => {
    if (!isHistoryLoaded) {
      const history = loadHistory();
      if (history.length > 0) {
        setMessages(history);
      }
      setIsHistoryLoaded(true);
    }
  }, [isHistoryLoaded, loadHistory, setMessages]);

  // Save history when messages change
  useEffect(() => {
    if (messages.length > 0 && isHistoryLoaded) {
      saveHistory(messages);
    }
  }, [messages, saveHistory, isHistoryLoaded]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop - Ultra subtle, keeps dashboard visible, non-clickable */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/5 dark:bg-black/20 z-40 transition-opacity duration-300 pointer-events-none"
        />
      )}

      {/* Side Panel - Fully opaque */}
      <div
        style={{
          backgroundColor: isDark ? 'rgb(3, 7, 18)' : 'rgb(249, 250, 251)',
          color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
          borderLeft: isDark ? '1px solid rgb(31, 41, 55)' : '1px solid rgb(229, 231, 235)',
        }}
        className={`
          fixed right-0 top-0 h-screen w-[340px] max-w-[85vw]
          shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          flex flex-col
          z-50
        `}
      >
        {/* Header */}
        <div className="
          flex items-center justify-between
          px-4 py-3 border-b border-gray-200 dark:border-gray-800
          bg-gradient-to-r from-purple-500/10 to-blue-500/10
        ">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-lg">Ronin AI</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Online
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Clear chat history?')) {
                  clearHistory();
                  setMessages([]);
                }
              }}
              className="p-2 rounded hover:bg-muted transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Welcome Message (when empty) */}
        {messages.length === 0 && (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Bot className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg">Welcome to Ronin AI</h3>
              <p className="text-sm text-muted-foreground">
                Ask me anything about your pNode network
              </p>
            </div>

            <SuggestedPrompts 
              onSelect={(prompt) => {
                setInput(prompt);
                // Auto-submit after a small delay to show the prompt in input
                setTimeout(() => {
                  const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }, 50);
              }} 
            />
          </div>
        )}

        {/* Messages - Scrollable with subtle gradient fade */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative
          before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-4
          before:bg-gradient-to-b before:from-background/50 before:to-transparent before:pointer-events-none before:z-10
        ">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠️ Error: {error.message}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions - Always visible */}
        <QuickActions 
          onAction={(action, prompt) => {
            setInput(prompt);
            // Auto-submit
            setTimeout(() => {
              const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
              if (form) form.requestSubmit();
            }, 50);
          }} 
        />
        
        {/* Suggested Prompts - Always visible above input */}
        {messages.length > 0 && (
          <div className="border-t border-border/50">
            <SuggestedPrompts 
              onSelect={(prompt) => {
                setInput(prompt);
                // Auto-submit
                setTimeout(() => {
                  const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }, 50);
              }} 
            />
          </div>
        )}

        {/* Input */}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
