# 🚀 Xandeum pNode Analytics Dashboard -MVP-

> Real-time monitoring and analytics platform for Xandeum Provider Nodes

**Built for [Superteam Earn Bounty](https://earn.superteam.fun/listing/build-analytics-platform-for-xandeum-pnodes) - $5,000 Prize**

![Dashboard Preview](https://github.com/CryptoNNja/xandeum-pnode-dashboard/blob/main/screenshots/dashboard-main.png?raw=true)

## ✨ Key Features

### 🎨 Advanced UI/UX

- **Animated Aurora Gradient Hero** - Smooth 15s violet/cyan animation
- **Multiple View Modes**: Table, Grid, and Interactive Map
- **KPI Cards with Glow Effects** - Lucide React icons + hover animations
- **Alert System** - Modal panel with severity-based notifications
- **Donut Charts** - Modern visualizations with centered metrics

### 📊 Real-Time Analytics

- **116 Nodes Tracked** (19 Public + 97 Private)
- **4 Distribution Charts**: CPU Load, Storage, Client Versions, Health Status
- **Health Distribution Bars** - Excellent/Good/Warning/Critical breakdown
- **Live Metrics**: CPU, RAM, Storage, Uptime, Network Traffic

### 🔍 Interactive Features

- **Advanced Search** - Filter pNodes by IP
- **Advanced Filters** - Multi-select by Health, Version, CPU Load and Storage
- **Multi-Sort** - Sort by IP, CPU, RAM, Storage, Uptime, Health, Packets
- **Public/Private Toggle** - Filter node visibility
- **Auto-Refresh** - 30-second intervals + manual refresh
- **pNode Detail Pages** - Dedicated analytics per node

### 🗺️ Map View

- **Global Visualization** - Interactive world map with node markers
- **Geolocation** - Precise node positioning
- **Cluster Support** - Grouped markers for dense regions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Maps**: Leaflet (dynamic import, SSR-safe)
- **API**: Custom Next.js API Routes
- **Performance**: useMemo optimizations for 100+ nodes

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/CryptoNNja/xandeum-pnode-dashboard.git
cd xandeum-pnode-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
xandeum-dashboard/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── pnode/[ip]/page.tsx   # pNode detail page
│   ├── api/pnodes/route.ts   # API endpoint
│   └── globals.css           # Global styles + Aurora animation
├── components/
│   ├── NodesMap.tsx          # Map view component
│   └── PNodeTable.tsx        # Table view component
├── lib/
│   ├── api.ts                # API utilities
│   ├── types.ts              # TypeScript types
│   └── theme.tsx             # Theme management
└── public/
    └── avatar-ninja.png      # Author avatar
```

## 🎯 Performance

- **Optimized Rendering**: All distributions memoized with useMemo
- **No Unnecessary Recalculations**: filteredAndSortedPNodes cached
- **Smooth 60fps**: Even with 100+ nodes displayed
- **Parallel API Calls**: Fast data fetching

## 🎨 Design System

### Colors

- **Primary Violet**: `#7B3FF2` (Xandeum brand)
- **Primary Cyan**: `#00D4AA` (Xandeum accent)
- **Blue (Good)**: `#3B82F6`
- **Green (Excellent)**: `#10B981`
- **Red (Critical/Private)**: `#EF4444`
- **Orange (Warning)**: `#F59E0B`

### Typography

- **Font**: System fonts optimized for readability
- **Headers**: Uppercase tracking for technical aesthetic

## 🏆 Superteam Bounty

- **Prize Pool**: $5,000 (1st), $1,500 (2nd), $1,000 (3rd)
- **Deadline**: January 9, 2026
- **Status**: In Development (19 days remaining)

## 🔮 Roadmap

- [x] Table/Grid/Map views
- [x] Alert system
- [x] pNode detail pages
- [x] Performance optimizations
- [x] Advanced Filters (Health, Version, Resources)
- [x] Dark/Light mode (completed)
- [x] Export to CSV/Excel (completed)
- [ ] Deploy to Vercel
- [ ] Historical data tracking
- [ ] Demo video

## 👨‍💻 Author

**Ludovic Diore** (aka `Ninja0x`)
_Freelance Full Stack Developer & Web3 Architect_

Combining 13+ years of crypto experience with solid business acumen.

- 🚀 **Full Stack Specialist:** Expert in Next.js, React, and Tailwind CSS.
- ⛓️ **Blockchain Veteran:** Active in the crypto space for over a decade.
- 🎓 **Business Oriented:** MBA in Marketing & Management — I code products that make sense - Focus on ROI.
- 🧠 **Self-Made Engineer:** Driven by curiosity and continuous learning.

---

## 📝 License

MIT License

## 🙏 Acknowledgments

- [Xandeum](https://xandeum.network) - Innovative pNode network
- [Superteam](https://superteam.fun) - Bounty organizers

---

**Built with ❤️ by Ninja0x for the Xandeum ecosystem**
