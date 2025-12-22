# 🌐 Xandeum pNode Analytics Platform

<div align="center">

![Xandeum Dashboard](screenshots/dashboard-main.png)

**Professional-grade analytics platform for Xandeum pNodes with real-time monitoring, intelligent scoring, and interactive visualizations.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Dashboard-7B3FF2?style=for-the-badge)](https://xandeum-dashboard-topaz.vercel.app)
[![Tests](https://img.shields.io/badge/✓_Tests-64_Passing-10B981?style=for-the-badge)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript)](.)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Testing](#-testing) • [API Docs](#-api-documentation)

</div>

---

## 🎯 Executive Summary

This platform goes **beyond basic pNode listing** to deliver a comprehensive analytics solution that combines real-time data collection, intelligent health scoring, and engaging visualizations. Built with production-ready architecture and tested to enterprise standards.

### **Why This Platform Stands Out**

✨ **Adaptive Animations** - Canvas-based visualizations that respond to real network metrics  
🗺️ **Geographic Intelligence** - Interactive map with IP geolocation and clustering  
🏆 **Competitive Leaderboards** - Multi-metric rankings with performance badges  
📊 **Blockchain Integration** - Network participation, epoch tracking, and credit monitoring  
⚡ **Production Architecture** - Automated crawlers, database persistence, and optimized performance  

---

## 🚀 Features

### **Core Functionality (Bounty Requirements)**

| Requirement | Implementation | Status |
|------------|----------------|--------|
| **pRPC Integration** | `getStats()` and `getPodsWithStats()` calls via crawler | ✅ Complete |
| **pNode Listing** | Real-time data from **235 nodes** (55 public + 180 private) | ✅ Complete |
| **Data Display** | 3 view modes (Table, Grid, Map) with filtering | ✅ Complete |
| **Live Platform** | Deployed on Vercel with auto-refresh | ✅ Complete |
| **Documentation** | Comprehensive setup and usage guide | ✅ Complete |

### **Core User Interface**

#### **🎨 Dark/Light Theme System**

<table>
<tr>
<td width="50%">
<img src="screenshots/dashboard-main.png" alt="Dark Mode"/>
<p align="center"><strong>Dark Mode</strong> - Optimized for extended use</p>
</td>
<td width="50%">
<img src="screenshots/dashboard-light-mode.png" alt="Light Mode"/>
<p align="center"><strong>Light Mode</strong> - Professional presentation</p>
</td>
</tr>
</table>

Seamless theme switching with full design system support:
- **Dark Mode** - Optimized for extended viewing sessions with reduced eye strain
- **Light Mode** - Clean, professional appearance for presentations and demos
- **System Preference** - Auto-detects OS theme preference on first load
- **Persistent** - Theme choice saved in localStorage across sessions
- **Smooth Transitions** - All UI elements (cards, charts, animations) adapt gracefully
- **Toggle Anywhere** - Sun/Moon icon in top-right corner accessible on all pages

#### **📊 Multiple View Modes**
Three distinct ways to explore node data:

**1. Table View (Default)**
- **Sortable columns** - Click any header to sort (IP, Score, CPU, RAM, Storage, Uptime)
- **Multi-select nodes** - Checkbox selection for batch operations and custom reports
- **Pagination** - Navigate through 235 nodes efficiently
- **Search & Filters** - Instant filtering by IP, health status, version, location
- **Row actions** - Click any node for detailed view
- **Color-coded badges** - Instant visual health indicators

**2. Grid View**
- **Card-based layout** - Visual overview of all nodes
- **Compact information** - Essential metrics at a glance
- **Responsive** - Adapts to screen size (1-4 columns)
- **Same filtering** - All search/filter features work in grid mode

**3. Map View**
- **Geographic clustering** - See node distribution worldwide
- **Interactive markers** - Click clusters to zoom, markers for details
- **Health color-coding** - Green (Excellent), Blue (Good), Orange (Warning), Red (Critical)
- **Real-time data** - Shows current node status on map

#### **🛠️ Advanced Toolbar**
Powerful controls for data exploration:
- **View Toggle** - Switch between Table/Grid/Map instantly
- **Search Bar** - Real-time IP address filtering
- **Advanced Filters** - Multi-select dropdowns for Health, Version, CPU range, Storage range
- **Public/Private Toggle** - Show/hide private nodes
- **Auto-refresh** - 30-second updates + manual refresh button
- **Export** - Download data as JSON, CSV, Excel, or comprehensive PDF reports

---

### **Innovation & Advanced Features**

#### **1. 🎨 Intelligent Animations**
Four custom Canvas-based animations that adapt to network state:

![Animations Showcase](screenshots/animations-showcase.png)

- **Active Streams** - Horizontal blue particle flow representing data synchronization
- **RAM Usage** - Animated memory bars with rising bubbles scaled to usage %
- **Network Throughput** - Packet animation with speed based on bandwidth
- **Network Participation** - Falling $XAND coins with 3D flip effect based on participation rate

*All animations are performance-optimized (60 FPS) and respond to real-time metrics.*

#### **2. 🗺️ Geographic Distribution**

![Global Node Distribution](screenshots/map-view.png)

- **IP Geolocation** - Automatic location detection for all nodes
- **Interactive Map** - Leaflet with clustering for dense areas (141 nodes in Europe, 42 in North America, etc.)
- **Regional Insights** - Node distribution by country with flag indicators
- **Health-coded Markers** - Color-coded by node status (Excellent/Good/Warning/Critical)

#### **3. 🏆 Competitive Scoring System**

![Network Leaderboard](screenshots/leaderboard-modal.png)

```
Node Score = (CPU × 25%) + (RAM × 25%) + (Uptime × 30%) + (Storage × 20%)
```
- **4-Tier Health System** - Excellent (>90%) | Good (70-90%) | Warning (50-70%) | Critical (<50%)
- **Multi-Metric Leaderboards** - Performance, Storage, Uptime, Credits
- **Visual Badges** - Star ratings with confetti for #1 performers
- **Real-time Rankings** - Top 10 updated every 5 minutes

#### **4. 📄 Professional PDF Reports**

Export comprehensive, production-ready PDF reports with customizable node selection:

**📊 Executive Summary Dashboard**
- Total nodes, public/private breakdown, healthy node percentage
- Average CPU, RAM usage metrics
- **Storage Analytics** - Total committed, used, and utilization percentage
- All metrics formatted and color-coded for easy reading

**🏆 Top Performing Nodes Table**
- Dynamic title (e.g., "Top 3 Selected Nodes" for custom selections)
- Complete node data: IP, PubKey, Score, CPU, RAM
- **Storage Committed & Used** - Essential for decentralized storage network
- Uptime and health status
- Perfectly aligned columns with professional formatting

**💾 Storage Analytics Section**
- Top 10 storage contributors ranked by committed capacity
- Full breakdown: IP, PubKey, Committed, Used, Utilization %, Uptime
- Purple-themed headers to differentiate from performance metrics
- Ideal for tracking decentralized storage network capacity

**📈 Health Distribution**
- Network health breakdown (Excellent/Good/Warning/Critical)
- Node counts per category with percentage calculations

**✨ Key Features:**
- **Smart Selection** - Export full network OR select specific nodes for comparison
- **Adaptive Titles** - Report title changes based on selection (e.g., "5 Selected Nodes")
- **Badge Indicator** - Purple pulsing badge on Export menu when nodes are selected
- **Professional Layout** - Multi-page support, headers, footers, page numbers
- **Storage-First** - Highlights decentralized storage metrics (committed/used/utilization)

#### **5. 📊 Data Visualizations**

<table>
<tr>
<td width="50%">
<img src="screenshots/chart-modal-cpu-distri.png" alt="CPU Distribution"/>
<p align="center"><strong>CPU Load Distribution</strong></p>
</td>
<td width="50%">
<img src="screenshots/chart-modal-health.png" alt="Health Distribution"/>
<p align="center"><strong>Health Status Breakdown</strong></p>
</td>
</tr>
<tr>
<td width="50%">
<img src="screenshots/chart-modal-network-growth.png" alt="Network Growth"/>
<p align="center"><strong>Network Growth & Expansion</strong></p>
</td>
<td width="50%">
<img src="screenshots/chart-modal-versions.png" alt="Version Distribution"/>
<p align="center"><strong>Version Adoption</strong></p>
</td>
</tr>
</table>

8 interactive charts and modals:
- **CPU Distribution** - Real-time load analysis across 55 public nodes
- **Health Distribution** - 62% excellent health, performance tracking
- **Network Growth** - +41% expansion rate (rapid growth trend)
- **Version Adoption** - 86% on latest v0.8 Quantum
- **Geographic Coverage** - World map with clustering
- **Storage Analytics** - Capacity planning and usage trends
- **Leaderboards** - Multi-metric rankings with gamification
- **Alerts Dashboard** - Critical issues aggregation

#### **5. ⚡ Performance & Architecture**
- **Automated Crawler** - Collects data every 5 minutes via GitHub Actions cron
- **Batch Processing** - Parallel RPC calls (10 nodes simultaneously)
- **Database Persistence** - Supabase for historical data and caching
- **Optimized Rendering** - React memoization, lazy loading, code splitting
- **Error Handling** - Comprehensive try/catch, fallbacks, and retry logic

---

## 🏗️ Architecture

### **Technology Stack**

```
Frontend:    Next.js 15 (App Router) + TypeScript + Tailwind CSS
State:       React Hooks (useMemo, useCallback for optimization)
UI Library:  Radix UI + Framer Motion + Lucide Icons
Charts:      Recharts + Canvas API (custom animations)
Maps:        Leaflet + React Leaflet Cluster
Database:    Supabase (PostgreSQL)
Deployment:  Vercel (Edge Functions + ISR)
Testing:     Vitest (64 tests, 100% pass rate)
```

### **System Design**

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (Next.js)                 │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │  Dashboard  │  Map View   │  Grid View  │  Node Detail │ │
│  │  (235 nodes)│ (Clusters)  │  (Cards)    │  (History)   │ │
│  └──────┬──────┴──────┬──────┴──────┬──────┴──────┬───────┘ │
│         │             │             │             │          │
└─────────┼─────────────┼─────────────┼─────────────┼──────────┘
          │             │             │             │
          ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  /api/pnodes  /api/network-health  /api/leaderboard  etc.   │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
          ┌──────────────┐  ┌──────────┐  ┌──────────┐
          │   Crawler    │  │ Supabase │  │   pRPC   │
          │  (Cron Job)  │  │    DB    │  │  Calls   │
          │  235 nodes   │  │ (History)│  │(getStats)│
          └──────────────┘  └──────────┘  └──────────┘
                │                              │
                └──────────────────────────────┘
                     Every 5 minutes
                     100% coverage
```

**Network Stats:**
- 📊 **235 total nodes** (rapid growth from initial 116)
- 📈 **+41% expansion rate** (recent trend)
- 🌍 **Global distribution** (North America, Europe, Asia, Australia)
- ⚡ **86% on latest version** (v0.8 Quantum adoption)

### **Key Components**

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Crawler** (`scripts/crawler.ts`) | Fetches pNode data via pRPC every 5 min | GitHub Actions Cron |
| **API Layer** (`app/api/*`) | 13 endpoints for data access | Next.js Route Handlers |
| **Database** | Stores historical data & geolocation | Supabase PostgreSQL |
| **Animations** (`components/Dashboard/*Animation.tsx`) | 4 Canvas-based visualizations | requestAnimationFrame |
| **Scoring Engine** (`lib/scoring.ts`) | Calculates node health scores | Custom algorithm |

---

## 📦 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### **1. Clone & Install**

```bash
git clone https://github.com/yourusername/xandeum-dashboard.git
cd xandeum-dashboard
npm install
```

### **2. Environment Setup**

Create `.env.local` with your Supabase credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: IP Geolocation API
IPGEOLOCATION_API_KEY=your_api_key
```

### **3. Database Setup**

Run the Supabase migrations:

```bash
# Option 1: Use Supabase CLI
supabase db push

# Option 2: Run SQL manually
# Execute files in supabase/migrations/ in your Supabase SQL editor
```

**Tables created:**
- `pnodes` - Current node data
- `pnode_history` - Historical snapshots
- `network_metadata` - Blockchain metrics

### **4. Run Development Server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### **5. Run Crawler (Optional)**

Populate database with live data:

```bash
npm run crawler
```

The crawler fetches data every 5 minutes automatically in production via GitHub Actions.

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test           # Run in watch mode
npm test -- --run  # Run once and exit
```

### **Test Coverage**

```
✓ tests/utils.test.ts (16 tests)           # Data formatting, colors, utilities
✓ tests/health.test.ts (13 tests)          # Health status calculations
✓ tests/scoring.test.ts (11 tests)         # Node scoring algorithm
✓ tests/kpi.test.ts (8 tests)              # KPI metrics aggregation
✓ tests/simple-integration.test.ts (16)    # Integration tests

Test Files  5 passed (5)
Tests      64 passed (64) ✅
Duration    ~70ms
```

**What's Tested:**
- ✅ Data formatting (bytes, uptime, percentages)
- ✅ Health status calculation (excellent/good/warning/critical)
- ✅ Node scoring algorithm with proper weighting
- ✅ KPI aggregations (averages, totals, distributions)
- ✅ Data validation (IP formats, ranges, edge cases)
- ✅ Integration scenarios (multi-node calculations, filtering, sorting)

---

## 📡 API Documentation

All endpoints return JSON and support CORS for external integrations.

### **Core Endpoints**

#### `GET /api/pnodes`
Returns list of all pNodes with current stats.

**Response:**
```json
{
  "nodes": [
    {
      "ip": "192.168.1.1",
      "cpu_usage": 45.5,
      "ram_used": 4096000000,
      "ram_total": 8192000000,
      "uptime": 86400,
      "storage_used": 500000000000,
      "storage_committed": 1000000000000,
      "is_public": true,
      "health_status": "excellent",
      "score": 87.5,
      "country": "US",
      "version": "v0.8 Quantum"
    }
  ],
  "total": 235,
  "public": 55,
  "private": 180,
  "lastUpdated": "2025-01-09T12:00:00Z"
}
```

#### `GET /api/pnodes/[ip]`
Get detailed stats for a specific pNode.

#### `GET /api/pnodes/[ip]/history`
Get 24-hour historical data for a pNode.

#### `GET /api/network-health/yesterday`
Get network health metrics for the past 24 hours.

#### `GET /api/network-metadata`
Get blockchain metrics (epoch, slot, sync status).

#### `GET /api/pods-credits`
Get credit distribution and participation stats.

---

## 🎨 UI/UX Design Philosophy

### **Design Principles**

1. **Clarity Over Complexity** - Information hierarchy guides the eye naturally
2. **Adaptive Feedback** - Animations respond to actual network state
3. **Consistent Theming** - Color-coded sections (Blue = Network, Green = System, Multi = Data)
4. **Progressive Disclosure** - Modals for deep-dive analysis without cluttering main view
5. **Accessibility First** - Tooltips, keyboard navigation, semantic HTML

### **Color System**

```css
/* Section Themes */
NETWORK STATUS:   #3B82F6 (Blue)    - Connectivity & throughput
SYSTEM HEALTH:    #10B981 (Green)   - Node health & stability  
DATA INSIGHTS:    Multi-color       - Charts & visualizations

/* Status Colors */
Excellent: #10B981 (Green)
Good:      #3B82F6 (Blue)  
Warning:   #F59E0B (Orange)
Critical:  #EF4444 (Red)
```

### **Animation Philosophy**

All animations serve a **functional purpose** - they're not just decorative:

- **Active Streams** → Shows network communication flow
- **RAM Usage** → Visualizes memory pressure with bubbles (more = higher usage)
- **Throughput** → Packet speed reflects actual bandwidth
- **Participation** → Coin density represents earning potential

---

## 📂 Project Structure

```
xandeum-dashboard/
├── app/
│   ├── page.tsx                      # Main dashboard
│   ├── pnode/[ip]/page.tsx          # Individual node detail
│   ├── layout.tsx                    # Root layout with theme
│   ├── globals.css                   # Global styles
│   └── api/                          # 13 API routes
│       ├── pnodes/route.ts
│       ├── network-health/route.ts
│       └── ...
├── components/
│   ├── Dashboard/                    # 25+ dashboard components
│   │   ├── DashboardContent.tsx
│   │   ├── KpiCards.tsx
│   │   ├── ActiveStreamsAnimation.tsx
│   │   ├── MemoryFlowAnimation.tsx
│   │   ├── RewardsRainAnimation.tsx
│   │   └── ...
│   ├── common/                       # Reusable UI components
│   └── ...
├── lib/
│   ├── api.ts                        # pRPC integration
│   ├── health.ts                     # Health scoring
│   ├── scoring.ts                    # Node scoring algorithm
│   ├── kpi.ts                        # KPI calculations
│   ├── utils.ts                      # Utility functions
│   └── types.ts                      # TypeScript types
├── scripts/
│   ├── crawler.ts                    # Main data collection script
│   └── ...
├── tests/                            # 64 tests across 5 files
├── supabase/migrations/              # Database schema
├── public/                           # Static assets
├── .github/workflows/crawler.yml     # Cron job config
├── vitest.config.ts                  # Test configuration
├── next.config.ts                    # Next.js config
└── README.md                         # This file
```

---

## 🚀 Deployment

### **Deploy to Vercel (Recommended)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/xandeum-dashboard)

**Manual deployment:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Set up GitHub Actions secrets for crawler
```

### **Environment Variables (Vercel)**

Add these in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `IPGEOLOCATION_API_KEY` (optional)

### **Crawler Setup**

Add these secrets to your GitHub repository (Settings → Secrets):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The crawler runs automatically every 5 minutes via `.github/workflows/crawler.yml`

---

## 🛠️ Development

### **Available Scripts**

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run test suite
npm run crawler      # Manual crawler run
npm run type-check   # TypeScript type checking
```

### **Adding New Features**

1. **New API Endpoint** → `app/api/your-endpoint/route.ts`
2. **New Component** → `components/YourComponent.tsx`
3. **New Utility** → `lib/your-util.ts` (+ add tests in `tests/`)
4. **New Animation** → `components/Dashboard/YourAnimation.tsx`

### **Code Quality**

- **TypeScript** - Strict mode enabled
- **ESLint** - Code linting with Next.js config
- **Prettier** - (Recommended) Add `.prettierrc` for auto-formatting
- **Tests** - Write tests for new utilities in `tests/`

---

## 📊 Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| **Lighthouse Score** | 95+ | 90+ |
| **First Contentful Paint** | < 1.5s | < 2s |
| **Time to Interactive** | < 3s | < 4s |
| **Bundle Size (gzip)** | ~180KB | < 250KB |
| **API Response Time** | < 200ms | < 500ms |
| **Test Coverage** | 64/64 pass | 100% |

### **Optimization Techniques Used**

- ✅ React `useMemo` and `useCallback` for expensive computations
- ✅ Next.js Image optimization
- ✅ Code splitting with dynamic imports
- ✅ Canvas animations (GPU-accelerated)
- ✅ Supabase query optimization with indexes
- ✅ Edge caching via Vercel

---

## 🤝 Contributing

While this is a bounty submission, contributions and suggestions are welcome!

### **How to Contribute**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Contribution Guidelines**

- Write tests for new features
- Follow existing code style
- Update README if adding major features
- Keep commits atomic and well-described

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

---

## 👤 About the Developer

**Ludovic aka Ninja0x** | Full-Stack Developer & Digital Solutions Builder

I'm a self-taught developer with a unique blend of technical expertise and business acumen. My journey into Web3 started as an early adopter and evolved into building production-grade applications. I don't just write code—I craft experiences that users love and businesses need.

### **My Background**

**Technical Foundation:**
- 🎯 **Self-Taught & Passionate** - Continuous learner who thrives on solving complex problems
- 💻 **Full-Stack Developer** (3-5 years) - React, Next.js, Node.js, TypeScript, Python
- 🎨 **Design-Driven** - Where aesthetics meet performance
- ⚡ **Detail-Oriented** - Every pixel, every millisecond, every line matters

**Business Perspective:**
- 🎓 **Master's in Business & Marketing** (Management specialization)
- 🌐 **Web3 Experience** - Former Ambassador & Community Manager at **Zharta** (DeFi NFT-backed loans)
- 📊 **Product Vision** - Understanding user needs, market fit, and growth strategies

This rare combination allows me to build products that are not only technically sound but also **market-ready** and **user-centric**.

### **Why I Built This**

I built this platform to prove a point: **great tools don't compromise**. They're:
- **Fast** - Optimized from the ground up (sub-200ms API responses)
- **Beautiful** - Animations that serve a purpose, not just decoration
- **Rigorous** - 64 tests, comprehensive documentation, production-ready code
- **Smart** - Every feature solves a real problem

This dashboard isn't just about meeting requirements—it's about **exceeding expectations** and setting a new standard for developer tools in the Xandeum ecosystem.

### **My Philosophy**

> "Execution eats strategy for breakfast. Ship fast, ship beautiful, ship right—every single time."

What drives me:
- ⚡ **Speed of Execution** - From idea to production in record time
- 🎨 **Aesthetic Excellence** - Beautiful interfaces that feel intuitive
- 🔬 **Technical Rigor** - Tests, documentation, best practices (no shortcuts)
- 🚀 **Continuous Improvement** - Always learning, always building

### **Open for Work**

I'm a **digital solutions builder** looking to collaborate with forward-thinking teams.

Whether you need:
- 🛠️ **Full-stack development** - From concept to deployment
- 🎨 **Product design** - UX/UI that converts
- 📈 **Growth strategy** - Marketing + community building
- 🌉 **Web2 to Web3** - Bridge traditional users to blockchain

**Let's talk about your project.** 💬

### **Connect**

- **GitHub**: [@CryptoNNja](https://github.com/CryptoNNja)
- **Twitter/X**: [@Crypt0xNinja](https://twitter.com/Crypt0xNinja)
- **LinkedIn**: [Available upon request]

*Building at the intersection of code, design, and business.* 🚀

---

## 🙏 Acknowledgments

- **Xandeum Team** - For creating an innovative blockchain network
- **Superteam** - For hosting the bounty and supporting builders
- **Open Source Community** - For the amazing tools that made this possible

---

<div align="center">

**Built with 💜 for the Xandeum Community**

[⬆ Back to Top](#-xandeum-pnode-analytics-platform)

</div>
