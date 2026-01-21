# Changelog

All notable changes to Xandeum pNode Analytics Dashboard.

## [Unreleased]

### 🎯 MAJOR: Comprehensive pNode Detail View & Export System (2024-12-24)

**Professional individual node analytics with expert-level UX/UI design**

#### Added
- 🎨 **Enhanced Visual Design**
  - Country flags with intelligent fallback (30+ countries supported via name mapping)
  - Geographic location display (city, country) in header
  - Gradient cards with blur halo effects on all metrics
  - Color-coded system metrics (CPU: green/orange, RAM: blue/red, Storage: purple)
  - Color-coded blockchain metrics (Streams: green, Pages: purple, Index: blue, Packets: aqua/orange)
  - Dynamic color thresholds (warning colors activate at >80% usage)
  - LED indicators on all metric labels
  - Hover animations with scale(1.02) and smooth transitions
  - Text gradient effect on Total Packets (aqua→purple)

- 📊 **New Information Sections**
  - **Node Identity**: Pubkey with one-click copy button, first seen date (calculated from uptime), node type badge, geographic coordinates
  - **Storage Analytics**: Committed capacity, actually used, available space, utilization gauge with gradient progress bar
  - **Economic Metrics**: Total credits earned (XAN), network rank (#X / total nodes), performance tier (Top 10 Elite / Top 50 Performer / Active Earner)
  - **Enhanced System Metrics**: CPU/RAM/Storage cards with gradients, blur halos, and progress bars
  - **Enhanced Blockchain Metrics**: Individual color themes per metric with gradient effects

- 🎯 **Floating Action Button (FAB)**
  - Modern circular button with gradient design (aqua→purple when closed, red when open)
  - Fixed position (bottom-right) with smooth spring animations
  - Rotates 45° when opened with X icon
  - Backdrop blur effect (glassmorphism) when menu displayed
  - Three professional actions:
    - 📄 **Export PDF Report** - Multi-page professional report
    - 📊 **Export JSON Data** - Raw node data download
    - 🔗 **Copy Share Link** - One-click URL sharing
  - Toast notifications for instant feedback
  - Stagger animations (0.05s delay per menu item)
  - Responsive hover effects on each action

- 📄 **Professional PDF Export System**
  - Multi-page PDF reports with purple gradient header
  - Comprehensive sections: Node Overview, Identity & Credentials, System Metrics, Storage Analytics, Blockchain Metrics, Economic Performance
  - Smart pagination (auto-creates new page when content exceeds 80% height)
  - Professional typography (Helvetica, section dividers, color coding)
  - Section headers with purple accent bars
  - Monospace font for IPs and pubkeys
  - Footer with generation timestamp and dashboard URL (xandeum-dashboard-topaz.vercel.app)
  - Auto-named downloads (pnode-{IP}-report.pdf)
  - Economic section only shows if node has rewards data
  - Tier badges: "Top 10 Elite", "Top 50 Performer", "Active Earner"

- 🔍 **Enhanced Search Functionality**
  - Multi-field search beyond IP filtering
  - **Geographic search**: Country name (India, France), country code (IN, FR), city name (Paris, Surat)
  - **Health status search**: excellent, good, warning, critical
  - **Node status search**: User-friendly aliases (private, public, gossip) mapped to actual status
  - **Technical search**: IP (partial match), version, pubkey
  - **Interactive tooltip** on search bar with color-coded examples
  - **Search modal** with 8 categorized example queries
  - Real-time filtering with 300ms debounce
  - Backward compatible with existing search functionality

#### API Improvements
- `/api/pnodes/[ip]` now returns `pubkey` and `country_code` fields
- Automatic integration with `/api/pods-credits` for rewards matching
- Economic metrics fetched via pubkey matching with rank calculation

#### Technical Improvements
- Created reusable `FloatingActionButton` component with Framer Motion
- Created `pnode-pdf-export.ts` utility with jsPDF
- Country code fallback mapping for 30+ countries
- Memoized calculations for performance
- TypeScript strict type checking maintained
- Clean component architecture with separation of concerns

#### Design Philosophy
- **UX/UI Excellence**: Expert-crafted with attention to micro-interactions
- **Color Psychology**: Purple (brand accent), Aqua (success), Orange (warning), Red (critical), Blue (info)
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewports
- **Performance**: Lazy loading, optimized renders, efficient state management
- **Accessibility**: Proper ARIA labels, keyboard navigation, screen reader support

### 🎯 MAJOR: Advanced Scoring System v3.0 (2024-12-23)

**Revolutionary scoring system designed for storage-first blockchain networks**

#### Added
- 🏆 **Dynamic Version Consensus Detection** - Auto-detects network consensus (currently 0.8.0 @ 63.6%)
- 🐋 **Whale Protection System** - Caps nodes with >10x average storage at 72 points
- 🎯 **Dual Scoring Logic** - Separate algorithms for active (0-100) vs gossip nodes (0-75)
- 📊 **Version Tier System** - 4 tiers (Consensus/Supported/Legacy/Deprecated) with multipliers
- 🔄 **Network Context Awareness** - Uses full network data for accurate tier detection
- ✅ **23 Comprehensive Tests** - Full coverage of version detection, whale caps, node types

#### Scoring Weights
**Active Nodes (Public - Full Metrics):**
- Version Consensus: 15%
- Storage Committed: 20%
- Uptime: 25% (critical for 24/7 availability)
- Network I/O: 20%
- CPU Efficiency: 10%
- RAM Efficiency: 10%

**Gossip Nodes (Private - Limited Metrics):**
- Version Consensus: 25% (higher weight without performance metrics)
- Storage Committed: 45% (primary contribution)
- Storage Efficiency: 20% (relative to network average)
- Participation: 10% (discovery bonus)
- Global Cap: 75 max | Whale Cap: 72 (>10x avg storage)

#### Version Penalties
- Trynet/Beta builds: 0.85x multiplier (-15%)
- Outdated versions: 0.90x multiplier (-10%)
- Gossip + Outdated: 0.80x multiplier (-20%)
- Unknown version: 0.75x multiplier (-25%)

#### Results & Impact
- ✅ 13 active nodes now score 90+ (vs 0 before)
- ✅ Top active node: 95/100 (vs 83 previously)
- ✅ Active node average: +8.68 points improvement
- ✅ 15 whale gossip nodes: 100 → 72 (fair cap applied)
- ✅ Gossip node average: Normalized to 60-75 range
- ✅ All trynet builds properly penalized

#### Technical Improvements
- Backward compatible API with intelligent caching
- Network context passed throughout component tree
- Automatic cache refresh (1 minute TTL)
- Comprehensive error handling for missing data

### 🎨 Recent Features (December 2024)

#### Added
- **Favorites System** - Save and manage favorite nodes with bulk operations
- **Node Comparison** - Side-by-side radar chart comparison (up to 5 nodes)
- **Professional PDF Export** - Multi-node reports with executive summaries
- **Expert SRE Alert System** - Actionable thresholds with severity levels
- **4 Animated Visualizations**:
  - Packets Animation (Network Throughput)
  - Active Streams Animation (Data Flow)
  - Memory Flow Animation (RAM Usage)
  - Rewards Rain Animation (Credit Distribution)
- **Flags Carousel** - Geographic spread with animated country flags
- **Network Coverage Modal** - Growth metrics and discovery insights
- **Selection Action Bar** - Bulk operations on multiple nodes
- **Collapsible Sections** - Organized dashboard (Network Status, System Health, etc.)
- **Dark/Light Mode Toggle** - Full theme support with smooth transitions

#### Performance Optimizations
- Memoized filteredAndSortedPNodes (prevents 30 recalculations/second)
- Memoized cpuDistribution and healthDistribution
- Memoized healthCounts and healthPercent
- Pre-calculated scores in hook for filtering/sorting
- Significant improvement with 100+ nodes

#### UI/UX Improvements
- Animated Aurora gradient in hero section (15s violet/cyan loop)
- KPI cards with Lucide React icons and glow effects
- Donut charts with centered totals and fixed legends
- Private nodes badge color: red neon (#EF4444)
- Health "Good" status color: blue (#3B82F6)
- Enhanced modal affordance and styling consistency
- Reduced cognitive load with collapsed sections by default

### Fixed
- TypeScript build errors in health sorting and crawler stats
- Hydration warnings from browser extensions
- NaN values in comparison radar chart
- Missing grid closing div tags
- Hero gradient display issues
- Network health sparkline rendering

### Changed
- All French content translated to English (international submission)
- Default display: 25 nodes (table and grid views)
- Crawler now uses `is_public` flag (correctly identifies 65 public nodes)
- Chart legends moved below visualizations
- Pie charts → Donut charts for modern aesthetic

### Documentation
- Complete README with performance & scalability section
- **New: Individual pNode Detail View section** - Comprehensive documentation of all features
- **Enhanced Search Functionality section** - Multi-field search capabilities documented
- Network discovery process explained
- Dark/Light mode showcase added
- Toolbar documentation expanded
- View modes details documented
- Future enhancements roadmap
- Advanced scoring system v3.0 fully documented
- FAB and PDF export features fully documented with technical stack examples

## [0.2.0] - 2024-12-09

### Added
- Table view with sortable columns
- Grid view with compact cards
- Interactive Map view with geolocation
- Health Distribution progress bars
- Client Versions chart
- Toolbar with search, filter, and view mode toggles
- Theme system foundation (lib/theme.tsx)

### Changed
- Improved responsive layout
- Enhanced mobile experience

## [0.1.0] - 2024-12-06

### Added
- Initial dashboard with 15 responding pNodes
- CPU Load Distribution chart
- Network Health pie chart
- Search functionality
- Sort by multiple metrics
- Auto-refresh every 30 seconds
- GitHub repository with README