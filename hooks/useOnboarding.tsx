import React, { useState, useEffect, useCallback } from 'react';
import { Step, CallBackProps, STATUS } from 'react-joyride';
import { 
  Sparkles, 
  Home, 
  ShieldAlert, 
  Sun, 
  Moon,
  BookOpen, 
  BarChart3, 
  AlertTriangle,
  Network,
  Activity,
  Database,
  Table2,
  Star,
  Search,
  Eye,
  LayoutGrid,
  Download,
  SlidersHorizontal,
  RefreshCw,
  HelpCircle,
  Layers,
  Calculator,
  Globe,
  MessageSquare,
  Users
} from 'lucide-react';

export function useOnboarding() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    
    console.log('🎯 Tour check:', { hasSeenTour, shouldStart: !hasSeenTour });
    
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        const searchButton = document.getElementById('search-button');
        console.log('🔍 Elements ready:', !!searchButton);
        
        if (searchButton) {
          console.log('✅ Starting tour!');
          setRun(true);
        } else {
          console.warn('⚠️ Retrying...');
          setTimeout(() => setRun(true), 2000);
        }
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      console.log('ℹ️ Tour already seen. Click Help button to restart.');
    }
  }, []);

  const steps: Step[] = [
    // STEP 1: WELCOME
    {
      target: 'body',
      title: (
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-aqua" />
          <span>Welcome to Xandeum</span>
        </div>
      ),
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            Your comprehensive <strong className="text-accent-aqua">pNode Analytics Dashboard</strong>.
            This guided tour will walk you through every feature from top to bottom.
          </p>
          <p className="text-xs text-text-faint">
            Ready to explore the network? Let's go!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    
    // STEP 2: System Alerts Button
    {
      target: 'header button[type="button"]:first-of-type',
      title: (
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span>System Alerts</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Monitor network health at a glance.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• Shows <span className="text-red-400 font-semibold">"X CRITICAL"</span> when issues are detected</li>
            <li>• Displays <span className="text-green-400 font-semibold">"All Systems Normal"</span> when healthy</li>
            <li>• Click to view detailed alerts modal</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'header button[class*="w-20 h-10"]',
      title: (
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          <span>Theme Toggle</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Switch between <strong>Dark</strong> and <strong>Light</strong> modes.
          </p>
          <p className="text-xs text-text-faint">
            The icon slides with a smooth animation for a premium feel!
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    
    // STEP 3: Theme Toggle
    
    // STEP 4-5: About pNodes Section
    {
      target: 'section.max-w-7xl:first-of-type',
      title: (
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <span>Educational Section</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Learn about <strong>Xandeum pNodes</strong> and network fundamentals.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• Click <strong>anywhere</strong> on this section to expand</li>
            <li>• View live <span className="text-accent-aqua font-semibold">$XAND</span> token price</li>
            <li>• Access network information and resources</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'section.max-w-7xl:first-of-type .flex.flex-wrap',
      title: (
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-aqua" />
          <span>Quick Stats</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Essential metrics <strong>always visible</strong>, even when section is collapsed.
          </p>
          <div className="text-xs text-text-faint grid grid-cols-2 gap-2 mt-2">
            <div>• Storage Committed</div>
            <div>• Storage Used</div>
            <div>• Avg per Pod</div>
            <div>• Countries</div>
          </div>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    
    // STEP 6-7: Summary Header KPI Cards
    {
      target: 'section.max-w-7xl > div.grid.grid-cols-1',
      title: (
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>System Status Overview</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Top-level KPIs for quick network assessment with MAINNET/DEVNET breakdown.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-faint mt-2">
            <div className="flex items-center gap-1">
              <span className="text-green-400">●</span> Public Nodes
            </div>
            <div className="flex items-center gap-1">
              <span className="text-purple-400">●</span> Private Nodes
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400">●</span> Total Nodes
            </div>
            <div className="flex items-center gap-1">
              <span className="text-orange-400">●</span> Network Ops
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-400">●</span> System Alerts
            </div>
          </div>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'section.max-w-7xl > div.grid > div:nth-child(5)',
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>System Alerts Card</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Real-time monitoring of network issues.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• Count of nodes with <strong className="text-red-400">critical issues</strong></li>
            <li>• Count of nodes with <strong className="text-orange-400">warnings</strong></li>
            <li>• Click to view detailed breakdown and analysis</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    
    // STEP 8: Network Status Section
    {
      target: '#network-status-section',
      title: (
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-400" />
          <span>Network Status</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Core network metrics and composition.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs text-text-faint mt-2 space-y-1">
            <div><strong className="text-blue-400">Network Participation</strong> - Credit system active nodes</div>
            <div><strong className="text-blue-400">Network Throughput</strong> - Packets per second</div>
            <div><strong className="text-blue-400">Avg RAM Usage</strong> - Memory consumption</div>
          </div>
          <p className="text-xs text-text-faint italic">
            Click the chevron to expand this section
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    
    // STEP 9: System Health Section
    {
      target: '#system-health-section',
      title: (
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          <span>System Health</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Performance, reliability, and network status indicators.
          </p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-xs text-text-faint mt-2 space-y-1">
            <div><strong className="text-green-400">Network Coverage</strong> - Growth charts (clickable modal)</div>
            <div><strong className="text-green-400">Network Health</strong> - Score + sparkline (clickable)</div>
            <div><strong className="text-green-400">Version Adoption</strong> - Distribution chart (clickable)</div>
          </div>
          <p className="text-xs text-text-faint italic">
            Click cards to open detailed modals
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    
    // STEP 10: Data Insights Section
    {
      target: '#data-insights-section',
      title: (
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          <span>Data Insights</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Storage analytics and geographic distribution.
          </p>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-xs text-text-faint mt-2 space-y-1">
            <div><strong className="text-purple-400">Storage Capacity</strong> - Detailed storage modal</div>
            <div><strong className="text-purple-400">Total Pages</strong> - Network pages distribution</div>
            <div><strong className="text-purple-400">Geographic Spread</strong> - Interactive map view</div>
            <div><strong className="text-purple-400">Leaderboard</strong> - Top performers by category</div>
          </div>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    
    // STEP 11-16: Table View and Features
    {
      target: 'table',
      title: (
        <div className="flex items-center gap-2">
          <Table2 className="w-5 h-5 text-accent-aqua" />
          <span>Nodes Table</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Main data table displaying <strong>all network nodes</strong> with comprehensive metrics.
          </p>
          <p className="text-xs text-text-faint">
            Let's explore its powerful features!
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: 'table thead th:nth-child(3)',
      title: (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-accent-aqua" />
          <span>Sortable Columns</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Click any column header to <strong>sort</strong> the table.
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-text-faint mt-2">
            <div>• IP Address</div>
            <div>• Score</div>
            <div>• Health Status</div>
            <div>• Uptime</div>
            <div>• CPU %</div>
            <div>• RAM %</div>
            <div>• Storage</div>
            <div>• Version</div>
          </div>
          <p className="text-xs text-text-faint italic mt-2">
            Click again to reverse sort direction
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'table thead th:first-child input[type="checkbox"]',
      title: (
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-green-400" />
          <span>Select All</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Check this box to select <strong>all visible nodes</strong> on the current page.
          </p>
          <p className="text-xs text-text-faint">
            Perfect for bulk operations like export or comparison!
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'table tbody tr:first-child td:first-child input[type="checkbox"]',
      title: (
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-400" />
          <span>Individual Selection</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Check individual rows to select specific nodes.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• Compare nodes (2-4 nodes)</li>
            <li>• Export selected nodes</li>
            <li>• Add to favorites</li>
          </ul>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'table tbody tr:first-child td:nth-child(2) button',
      title: (
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Favorite Node</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Click the star to <strong>bookmark</strong> this node.
          </p>
          <p className="text-xs text-text-faint">
            The star turns <span className="text-yellow-400 font-semibold">yellow</span> when favorited. Access all your favorites from the toolbar!
          </p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'table tbody tr:first-child',
      title: (
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-accent-aqua" />
          <span>Node Details</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Click anywhere on a row to navigate to the <strong>detailed node page</strong>.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• Full performance metrics</li>
            <li>• Historical data charts</li>
            <li>• Network activity logs</li>
          </ul>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    
    // STEP 17-24: Toolbar Features
    {
      target: '#search-button',
      title: (
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-accent-aqua" />
          <span>Search & Filter</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Type to filter nodes in <strong>real-time</strong>.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• Search by IP address</li>
            <li>• Filter by version</li>
            <li>• Search by city or country</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#filter-button',
      title: (
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          <span>Visibility Filter</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Toggle node visibility by type.
          </p>
          <div className="flex flex-col gap-1 text-xs text-text-faint mt-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span> <strong>All Nodes</strong> - Show everything
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">●</span> <strong>Public Only</strong> - Active nodes
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">●</span> <strong>Private Only</strong> - Gossip nodes
            </div>
          </div>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#view-toggle',
      title: (
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-400" />
          <span>View Modes</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Switch between different data visualizations.
          </p>
          <div className="space-y-1 text-xs text-text-faint mt-2">
            <div className="flex items-center gap-2">
              <span className="text-accent-aqua">▪</span> <strong>Table</strong> - Detailed list view with sorting
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-aqua">▪</span> <strong>Grid</strong> - Compact card layout
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-aqua">▪</span> <strong>Map</strong> - Geographic distribution
            </div>
          </div>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#export-button',
      title: (
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-green-400" />
          <span>Export Data</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Download data in multiple formats.
          </p>
          <div className="bg-accent-aqua/10 border border-accent-aqua/20 rounded-lg p-2 text-xs mt-2">
            <div className="font-semibold text-accent-aqua mb-1">Available Formats:</div>
            <div className="space-y-0.5 text-text-faint">
              <div>• CSV - Spreadsheet data</div>
              <div>• Excel - Advanced formatting</div>
              <div>• PDF - Professional reports</div>
            </div>
          </div>
          <p className="text-xs text-text-faint italic">
            Select nodes first to export specific ones!
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: 'button[aria-label="Advanced Filters"]',
      title: (
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-purple-400" />
          <span>Advanced Filters</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Apply <strong>complex filters</strong> to refine your view.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-faint mt-2">
            <div>• Version</div>
            <div>• Health Status</div>
            <div>• CPU Usage</div>
            <div>• Storage Size</div>
            <div>• Location</div>
            <div>• Performance</div>
          </div>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: 'button[aria-label="Favorites"]',
      title: (
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Favorites Manager</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Manage your <strong>bookmarked nodes</strong>.
          </p>
          <ul className="text-xs text-text-faint space-y-1 ml-4">
            <li>• View all favorited nodes</li>
            <li>• Compare favorites (2-4 nodes)</li>
            <li>• Export/import favorites list</li>
            <li>• Quick access to starred nodes</li>
          </ul>
          <p className="text-xs text-yellow-400 italic mt-2">
            Star turns yellow with count badge!
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: 'button[aria-label="Refresh"]',
      title: (
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-400" />
          <span>Data Refresh</span>
        </div>
      ),
      content: (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">
            Keep your data <strong>up-to-date</strong>.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs text-text-faint mt-2">
            <div>• <strong>Manual refresh</strong> - Click anytime</div>
            <div>• <strong>Auto-refresh</strong> - Every 30 seconds</div>
            <div>• Last update timestamp shown</div>
          </div>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    
    // STEP 25: Floating Widgets Area
    {
      target: '#manager-board-button',
      title: (
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent-aqua" />
          <span>Floating Widgets</span>
        </div>
      ),
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            Access powerful tools via <strong>floating buttons</strong> in the bottom-right corner.
          </p>
          <div className="space-y-2 text-xs text-text-faint">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span><strong className="text-accent-aqua">3D Map</strong> - Interactive globe visualization of nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span><strong className="text-accent-aqua">Operator Board</strong> - Manager leaderboard & analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-green-400" />
              <span><strong className="text-accent-aqua">STOINC Calculator</strong> - Rewards calculator tool</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span><strong className="text-accent-aqua">Ronin AI Chatbot</strong> - AI assistant for queries</span>
            </div>
          </div>
          <p className="text-xs text-text-faint italic mt-2">
            Click any button to open its widget!
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
      disableScrolling: true,
      spotlightPadding: 10,
    },
    {
      target: '#help-button',
      title: (
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-aqua" />
          <span>Tour Complete!</span>
        </div>
      ),
      content: (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">
            Congratulations! You now know <strong className="text-accent-aqua">every feature</strong> of the dashboard.
          </p>
          <div className="bg-accent-aqua/10 border border-accent-aqua/20 rounded-lg p-3 text-xs text-text-faint">
            <div className="flex items-center gap-2 font-semibold text-accent-aqua mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Pro Tip:</span>
            </div>
            Click this Help button anytime to restart the tour and refresh your knowledge!
          </div>
          <p className="text-xs text-text-faint italic">
            Happy monitoring! 🚀
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    console.log('Joyride:', status);

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('hasSeenOnboardingTour', 'true');
      setRun(false);
      setStepIndex(0);
    }
  }, []); // No dependencies - callback logic is stable

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  const resetTour = () => {
    console.log('🔄 Resetting tour...');
    localStorage.removeItem('hasSeenOnboardingTour');
    setStepIndex(0);
    setRun(true);
    console.log('✅ Tour restarted!');
  };

  return {
    run,
    steps,
    stepIndex,
    handleJoyrideCallback,
    startTour,
    resetTour,
  };
}
