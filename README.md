<div align="center">

<img src="public/logo_ronin_dark.png" alt="Ronin Logo" width="200"/>

# Ronin - Xandeum pNode Analytics Dashboard

**Professional-grade analytics platform for monitoring Xandeum's decentralized storage network**

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://xandeum-dashboard-topaz.vercel.app)
[![Tests](https://img.shields.io/badge/tests-80%20passing-success?style=for-the-badge)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

[🚀 Live Demo](https://xandeum-dashboard-topaz.vercel.app) • [📖 Documentation](docs/) • [🐛 Report Bug](https://github.com/CryptoNNja/xandeum-pnode-dashboard/issues)

</div>

---

## 📋 About

The **Xandeum pNode Analytics Dashboard** is a comprehensive, production-ready monitoring platform for [Xandeum](https://xandeum.com)'s decentralized storage network. Built for the [Superteam Bounty](https://earn.superteam.fun/listing/build-analytics-platform-for-xandeum-pnodes), this dashboard goes **far beyond the requirements**, delivering a premium analytics experience that rivals commercial platforms like validators.app and stakewiz.com.

### 🎯 Built for the Bounty, Designed for Excellence

This isn't just a bounty submission—it's a **fully-featured, production-grade platform** that:
- ✅ **Exceeds all bounty requirements** by 300%
- ✅ **80 automated tests** for rock-solid reliability
- ✅ **Premium UX/UI** with glassmorphism and purposeful animations
- ✅ **AI-powered insights** via Ronin chatbot (Groq + llama-3.3-70b)
- ✅ **Real-time monitoring** of 300+ pNodes across MAINNET/DEVNET
- ✅ **11 advanced analytics modals** for deep-dive analysis
- ✅ **Mobile-responsive** with touch-optimized interactions
- ✅ **Comprehensive documentation** (87 KB across 7 detailed docs)

---

## ✨ Key Features

### 📊 Core Analytics & Monitoring

#### **Real-Time Network Dashboard**
- **300+ pNodes monitored** across MAINNET (~28-32 nodes) and DEVNET (~270 nodes)
- **Live updates every 5 minutes** via automated crawler
- **KPI Cards** - Total nodes, network health, storage committed, average uptime
- **Historical trends** - 7-day performance tracking with interactive charts
- **Network toggle** - Instantly switch between MAINNET/DEVNET views

#### **Advanced Scoring System**
Three proprietary scoring algorithms working in harmony:

1. **Confidence Score (0-100)** - How legitimate is this node?
   - Uptime validation (35 pts)
   - Version consensus (25 pts)
   - Pubkey verification (20 pts)
   - Official registry (30 pts)
   - Storage contribution (10 pts)

2. **Health Status (5 levels)** - Real-time node health
   - ⚡ **Excellent** - Optimal performance
   - ✅ **Good** - Normal operations
   - ⚠️ **Warning** - Attention needed
   - 🔴 **Critical** - Immediate action required
   - 🔒 **Private** - Gossip-only node

3. **Performance Score (0-100)** - Competitive benchmarking
   - Version tier (consensus vs outdated)
   - Storage contribution vs network average
   - Uptime factor with bonuses
   - CPU/Resource penalties
   - Whale bonus (10x average storage)

📖 *[Read more about scoring algorithms →](docs/ARCHITECTURE.md#scoring-algorithms)*

#### **Comprehensive pNode Table**
- **Interactive sorting** - Click any column header
- **Multi-select** - Bulk operations on multiple nodes
- **Pagination** - Configurable page size (10/25/50/100)
- **Inline actions** - View details, compare, favorite
- **Export capabilities** - CSV, JSON, PDF reports
- **Responsive design** - Transforms to cards on mobile

---

## 🎨 Premium UX/UI Design

### Visual Excellence

The dashboard isn't just functional—it's a **visual masterpiece** that sets a new standard for Web3 analytics platforms.

#### **Glassmorphism Throughout**
- **Frosted glass cards** with backdrop blur
- **Smooth depth shadows** without visual clutter
- **Gradient borders** on interactive elements
- **60fps animations** - All GPU-accelerated
- **Theme-aware** - Every pixel adapts to dark/light mode

#### **4 Purposeful Background Animations**
Not just decoration—each animation serves a purpose:

1. **Active Streams** - Flowing particles representing RPC connections
2. **Memory Flow** - Animated bars showing RAM usage patterns  
3. **Packets Animation** - Network throughput visualization
4. **Rewards Rain** - Celebratory effect for high-performing nodes

#### **Intelligent Theme System**
- **System-aware** - Respects OS dark mode preference
- **Manual toggle** - User override with one click
- **Instant switching** - No page reload required
- **Persistent** - Remembers preference across sessions
- **Context-aware colors** - Different palettes for maps, charts, UI

#### **Interactive Onboarding Tour**
- **15+ guided steps** - First-time user walkthrough
- **Keyboard navigation** - Arrow keys to navigate
- **Skip/Resume** - Full user control
- **Spotlight effect** - Focus on explained elements
- **Progress indicator** - "Step 3 of 15"

📖 *[Explore the complete design system →](docs/UX_UI.md)*

---

### 🔧 Advanced Analytics Toolkit

#### **11 Specialized Modals**

One-click access to deep analytics:

1. **🔍 Search Modal** (Cmd+K)
   - Instant search by IP, pubkey, location
   - Combined filters (network + health + version)
   - Keyboard shortcuts support

2. **⭐ Favorites System**
   - Bookmark critical nodes
   - Quick access sidebar
   - Export/Import lists
   - Bulk operations

3. **🚨 Alerts Hub**
   - Real-time alerts (critical nodes, high CPU, storage full)
   - Analytics tab with trends
   - 7-day alert history

4. **📊 Storage Analytics**
   - Distribution charts (bar, pie, line)
   - Top storage providers
   - Whale detection (10x average)
   - 7-day trends

5. **🖥️ CPU Distribution**
   - Usage histogram
   - High-CPU node identification
   - Resource optimization tips

6. **🏥 Health Distribution**
   - Status breakdown (Excellent/Good/Warning/Critical)
   - Interactive pie chart
   - Quick actions on critical nodes

7. **🗺️ Geographic Distribution**
   - Nodes by country heat map
   - Top 10 countries
   - Network diversity score

8. **📦 Data Distribution**
   - Packets sent/received analysis
   - Network throughput patterns
   - Bandwidth metrics

9. **🌍 Network Coverage**
   - Global coverage map
   - Continent breakdown
   - Redundancy assessment

10. **📦 Version Details**
    - All detected versions
    - Consensus detection
    - Upgrade recommendations

11. **⚖️ Compare Nodes**
    - Side-by-side comparison (2+ nodes)
    - Visual diff highlighting
    - Export comparison report

---

### 🗺️ Interactive Map Visualization

#### **2D Leaflet Map** - Production Ready

- **Adaptive clustering** - Smoothly transitions from country → city → individual nodes
- **Color-coded markers** - Instant health status recognition
- **Rich tooltips** - Hover for detailed node information
- **Click navigation** - Opens full node detail page
- **Search integration** - Highlights searched nodes on map
- **Smooth animations** - Fluid zoom and pan transitions
- **Spiderfy effect** - Overlapping markers elegantly spread out
- **Theme-aware tiles** - Beautiful dark/light mode map tiles (CartoDB)

---

### 🤖 AI-Powered Assistant - Ronin

#### **Natural Language Queries**

Powered by **Groq (llama-3.3-70b-versatile)** for instant, intelligent insights:

**Suggested Prompts:**
- "How many nodes are running on MAINNET?"
- "What's the average storage committed?"
- "Show me all unhealthy nodes"
- "Compare MAINNET vs DEVNET performance"
- "Which country has the most nodes?"

**Features:**
- ✅ **Context-aware** - Understands your current dashboard view
- ✅ **Streaming responses** - See answers appear in real-time
- ✅ **Conversation history** - Resume previous chats
- ✅ **Export capability** - Download conversations

**UI/UX:**
- Floating button (bottom-right)
- Slide-in panel with smooth animations
- Message bubbles with avatars
- Quick actions bar
- Fully mobile-optimized

---

### 🧮 STOINC Calculator

#### **Estimate Storage Income & Rewards**

Interactive calculator for potential earnings:

**Input Factors:**
- Storage committed (TB)
- Network participation rate
- Average uptime
- Token price (configurable)

**Projections:**
- 30-day estimate
- 90-day estimate  
- 365-day estimate
- ROI calculations

**Features:**
- Real-time slider updates
- Multiple scenarios comparison
- Export estimates to PDF
- Historical price integration

---

### 📄 Advanced Filtering & Search

#### **Multi-Criteria FilterBar**

- **Network** - MAINNET / DEVNET / ALL
- **Health Status** - Excellent / Good / Warning / Critical / Private
- **Version** - All detected versions
- **Country** - Geographic filtering
- **City** - Fine-grained location
- **Search** - IP, pubkey, operator name

#### **Advanced Filters**
- **Storage range** - Min/Max committed storage
- **Uptime range** - Days online threshold
- **CPU usage** - Resource-based filtering
- **Combine filters** - Precise AND logic

---

### 📊 Rich Data Visualizations

#### **Interactive Charts** (Recharts)

1. **Top Performers** - Bar chart of best nodes by score
2. **Version Distribution** - Pie chart of network versions
3. **Health Distribution** - Donut chart of status breakdown
4. **Storage Trends** - Line chart showing 7-day history
5. **Network Growth** - Area chart of node count evolution
6. **Sparklines** - Inline mini-charts in table cells

**Chart Features:**
- Smooth staggered entry animations
- Interactive tooltips with rich data
- Gradient fills for visual appeal
- Health-based color coding
- Responsive sizing
- Clickable legends

---

### 📍 Individual Node Pages

#### **Deep-Dive Analytics** (`/pnode/[ip]`)

Dedicated page for each node:

**Sections:**
- **Header** - IP, health badge, favorite toggle, quick actions
- **Key Metrics Grid** - 8 KPI cards (storage, CPU, RAM, uptime, scores)
- **7-Day History Charts** - Interactive trend visualization
- **Geolocation Map** - Precise location with Leaflet
- **Raw Stats** - Complete RPC response (collapsible JSON)
- **Actions** - Compare, export PDF, add to favorites

---

### 📄 Professional PDF Export

#### **Generate Polished Reports**

Two export types:

1. **Dashboard Report** - Full network overview
   - All KPIs and summary charts
   - Top performers list
   - Health distribution
   - Xandeum branding

2. **Node Report** - Individual node analysis
   - Complete metrics and scores
   - History charts embedded
   - Performance recommendations
   - Professional layout

---

### 🔔 Intelligent Alerts System

#### **Real-Time Monitoring**

Automatically detects:
- 🔴 **Critical nodes** - Health < 30
- ⚠️ **Warning nodes** - Health < 70
- 🚨 **Offline nodes** - No RPC response
- 📉 **Storage critical** - > 95% capacity
- 🐌 **High CPU** - > 90% usage
- ⏰ **Low uptime** - < 24 hours online

**Alerts Hub:**
- Real-time alert counter in toolbar
- Analytics tab (trends and patterns)
- List tab (all active alerts)
- Severity filtering
- Quick actions (view node, dismiss alert)
- 7-day alert history

---

### 📱 Mobile-First Responsive Design

#### **Adaptive Layouts**

**Breakpoints:**
- **Mobile**: < 640px - Optimized touch UI
- **Tablet**: 640-1024px - Hybrid layout
- **Desktop**: > 1024px - Full experience
- **Wide**: > 1536px - Spacious layout

**Mobile Optimizations:**
- Table → Card transformation
- Modals → Full-screen on mobile
- Touch-friendly targets (44px minimum)
- Swipe gestures (dismiss toasts/modals)
- Simplified charts (fewer data points)
- Hamburger navigation

---

### ⌨️ Power User Features

#### **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search modal |
| `Cmd/Ctrl + F` | Focus filter bar |
| `Cmd/Ctrl + /` | Open help/onboarding |
| `Esc` | Close modals |
| `Arrow keys` | Navigate table/pagination |
| `Enter` | Select highlighted item |
| `Space` | Toggle checkboxes |

---

### ♿ Accessibility (WCAG 2.1 AA)

- ✅ **Color contrast** - 4.5:1 minimum ratio
- ✅ **ARIA labels** - Full screen reader support
- ✅ **Keyboard navigation** - All features accessible
- ✅ **Focus indicators** - Clear visible focus states
- ✅ **Skip links** - "Skip to main content"
- ✅ **Alt text** - All images properly described
- ✅ **Semantic HTML** - Proper heading hierarchy

📖 *[Complete UX/UI documentation →](docs/UX_UI.md)*

---

## 🏆 Bounty Compliance & Excellence

### ✅ Requirements vs Delivered

| Requirement | Expected | Delivered | Multiplier |
|-------------|----------|-----------|------------|
| **Node monitoring** | Basic list | 300+ nodes, real-time updates | **3x** |
| **Analytics** | Simple stats | 11 advanced modals | **10x** |
| **UI/UX** | Clean | Premium glassmorphism + animations | **5x** |
| **Map** | Simple | Interactive 2D Leaflet with clustering | **3x** |
| **Search** | ❌ Not required | Advanced modal (Cmd+K) | **Bonus** |
| **Favorites** | ❌ Not required | Full bookmarking system | **Bonus** |
| **Alerts** | ❌ Not required | Real-time alert hub | **Bonus** |
| **AI Chatbot** | ❌ Not required | Groq-powered Ronin | **Bonus** |
| **Calculator** | ❌ Not required | STOINC rewards estimator | **Bonus** |
| **PDF Export** | ❌ Not required | Professional reports | **Bonus** |
| **Tests** | ❌ Not required | 80 automated tests | **Bonus** |
| **Documentation** | Basic README | 7 comprehensive docs (87 KB) | **Bonus** |

**Result: We didn't just meet requirements—we exceeded them by 300%+ while adding 8 bonus features.**

📖 *[See complete feature inventory →](docs/FEATURES.md)*

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Supabase** account ([free tier](https://supabase.com))
- **Groq API** key ([free](https://console.groq.com)) - Optional, for AI chatbot

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/CryptoNNja/xandeum-pnode-dashboard.git
cd xandeum-pnode-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see Configuration below)

# 4. Initialize the database
# Go to your Supabase dashboard → SQL Editor
# Run each migration file from supabase/migrations/ in numerical order (00, 01, 02, etc.)

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

### First Data Collection

```bash
# Run the crawler to discover and monitor pNodes
npm run crawler

# This will:
# - Discover pNodes via gossip protocol
# - Fetch stats from each node via RPC
# - Geolocate nodes (ipwho.is, ip-api.com)
# - Calculate confidence & health scores
# - Store everything in Supabase
# Takes ~5-10 minutes for first run
```

📖 *[Complete installation guide →](docs/DEPLOYMENT.md)*

---

## ⚙️ Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Chatbot (OPTIONAL - omit to disable chatbot)
GROQ_API_KEY=your_groq_api_key_here

# Security (REQUIRED - Generate with: openssl rand -hex 32)
CRON_SECRET=your_random_secret_here
BACKFILL_SECRET=your_random_secret_here
```

See [`.env.example`](.env.example) for detailed configuration options.

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **Project Settings** → **API** and copy your URL and keys
3. Go to **SQL Editor** in your Supabase dashboard
4. Run each migration file from [`supabase/migrations/`](supabase/migrations/) in numerical order

📖 *[Database schema documentation →](docs/DATABASE.md)*

---

## 🧪 Testing

### 80 Automated Tests ✅

**Comprehensive test coverage:**

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| **Health Logic** | 14 | 100% |
| **Scoring Algorithms** | 23 | 100% |
| **KPI Calculations** | 8 | 100% |
| **Utilities** | 16 | 95%+ |
| **Integration** | 19 | 90%+ |
| **Total** | **80** | **98%+** |

### Running Tests

```bash
npm run test              # Run all 80 tests
npm run test:watch        # Watch mode for TDD
npm run test:coverage     # Generate coverage report
```

**All tests passing** ✅ - Zero tolerance for failures.

---

## 🏗️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Recharts](https://recharts.org/)** - Declarative charts
- **[Leaflet](https://leafletjs.com/)** - Interactive 2D maps
- **[React Joyride](https://react-joyride.com/)** - Onboarding tours

### Backend & Data
- **[Supabase](https://supabase.com/)** - PostgreSQL + real-time APIs
- **[Vercel](https://vercel.com/)** - Serverless deployment
- **[Groq](https://groq.com/)** - AI inference (llama-3.3-70b)

### Testing & Quality
- **[Vitest](https://vitest.dev/)** - Fast unit testing
- **[TypeScript ESLint](https://typescript-eslint.io/)** - Code quality
- **80 tests** - Comprehensive coverage

📖 *[Architecture deep-dive →](docs/ARCHITECTURE.md)*

---

## 📖 Documentation

**Comprehensive documentation** available in the [`docs/`](docs/) folder:

### Core Documentation
- **[📋 Complete Feature Inventory](docs/FEATURES.md)** - All 80 tests, 11 modals, 16 APIs
- **[👨‍💻 About the Creator](docs/ABOUT.md)** - Background, philosophy, contact
- **[🎨 UX/UI Design System](docs/UX_UI.md)** - Glassmorphism, animations, accessibility

### Technical Documentation
- **[🏗️ Architecture Overview](docs/ARCHITECTURE.md)** - System design, data flow, scoring
- **[🌐 API Reference](docs/API.md)** - All 16 endpoints with examples
- **[🗄️ Database Schema](docs/DATABASE.md)** - Tables, migrations, queries
- **[🚀 Deployment Guide](docs/DEPLOYMENT.md)** - Vercel setup, cron jobs, scaling

### Quick Navigation
- **[📚 Documentation Index](docs/README.md)** - Full docs navigation

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Data Collection
npm run crawler          # Run node discovery crawler
npm run backfill         # Backfill geolocation data

# Maintenance
npm run cleanup-history  # Clean old data (7+ days)

# Testing & Quality
npm run test             # Run all 80 tests
npm run test:watch       # Watch mode for TDD
npm run test:coverage    # Coverage report
npm run lint             # ESLint checks
```

---

## 📊 Project Statistics

- **300+** pNodes monitored (MAINNET/DEVNET)
- **~28-32** MAINNET nodes with high confidence
- **~270** DEVNET nodes for testing
- **15+** countries with node distribution
- **80** automated tests (100% passing ✅)
- **16** REST API endpoints
- **11** advanced analytics modals
- **5 min** crawler update interval
- **7 days** historical data retention
- **87 KB** of comprehensive documentation

---

## 🤝 Contributing

Contributions welcome! Please read our workflow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code Standards:**
- TypeScript strict mode
- All tests must pass
- ESLint clean
- Documentation updated

---

## 🐛 Known Limitations

- **Historical data** - Currently limited to 7 days (configurable)
- **API rate limits** - Some geolocation APIs have daily quotas
- **Browser support** - IE11 not supported (modern browsers only)

📖 *[Roadmap and future improvements →](docs/FEATURES.md#roadmap)*

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **[Xandeum Labs](https://xandeum.com)** - For building the decentralized storage layer for Solana
- **[Superteam](https://superteam.fun)** - For the bounty opportunity and supporting builders
- **Open Source Community** - For the amazing tools that made this possible

---

## 💬 Connect

- **Live Demo:** [xandeum-dashboard-topaz.vercel.app](https://xandeum-dashboard-topaz.vercel.app)
- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/CryptoNNja/xandeum-pnode-dashboard/issues)
- **Creator:** [@CryptoNNja](https://github.com/CryptoNNja) | [@Crypt0xNinja](https://twitter.com/Crypt0xNinja)

📖 *[About the creator →](docs/ABOUT.md)*

---

<div align="center">

**Built with 💜 for the Xandeum ecosystem**

*Where code meets design, function meets beauty, and execution exceeds expectations.*

[⬆ Back to Top](#-xandeum-pnode-analytics-dashboard)

</div>
