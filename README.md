# 🚀 Xandeum pNode Analytics Dashboard

> Real-time monitoring and analytics platform for Xandeum Provider Nodes

**Built for [Superteam Earn Bounty](https://earn.superteam.fun/listing/build-analytics-platform-for-xandeum-pnodes) - $5,000 Prize**

![Dashboard Preview](./screenshots/dashboard-main.png)

## ✨ Features

### 📊 Network Overview
- **Real-time Stats**: Live monitoring of all active pNodes
- **Auto-discovery**: Dynamic pNode detection via Gossip Protocol (93 nodes discovered)
- **Global Metrics**: Total storage, average CPU, average uptime across the network

### 📈 Advanced Analytics
- **CPU Load Distribution**: Histogram showing network resource usage
- **Storage Distribution**: Visual breakdown of storage allocation
- **Network Health**: Pie chart with health status (Excellent/Good/Warning/Critical)

### 🔍 Interactive Features
- **Search**: Filter pNodes by IP address
- **Multi-sort**: Sort by IP, CPU, RAM, Storage, or Uptime
- **Auto-refresh**: 30-second intervals with manual refresh option
- **Health Badges**: Color-coded status indicators per pNode

### 📱 Modern UI/UX
- Responsive design (mobile + desktop)
- Dark theme optimized for readability
- Xandeum brand colors (#7B3FF2 violet, #00D4AA cyan)
- Smooth animations and transitions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **API**: Axios, Custom Next.js API Routes
- **Deployment**: Vercel (coming soon)

## 🏗️ Architecture
```
Browser → Next.js API Route → Gossip API (VPS) → pNode pRPC endpoints
                            ↓
                      Filter & aggregate
                            ↓
                    Return JSON to frontend
```

### Key Components

1. **Gossip API** (`/root/gossip-api.js` on VPS)
   - Discovers all pNodes via `pod --gossip` command
   - Returns list of 93 active nodes
   - Port: 5000

2. **Next.js API Route** (`/api/pnodes`)
   - Fetches pNode list from Gossip API
   - Calls each pNode's pRPC endpoint (port 6000)
   - Aggregates stats and returns to client

3. **Frontend** (`app/page.tsx`)
   - Displays real-time data
   - Interactive charts with Recharts
   - Search/sort functionality

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Usage

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📊 Data Sources

- **Gossip Protocol**: Auto-discovers pNodes on the network
- **pRPC API**: Fetches real-time stats from each pNode
  - CPU usage (%)
  - RAM used/total (GB)
  - Storage (GB)
  - Uptime (hours)
  - Packets sent/received

## 🎯 Project Stats

- **pNodes Discovered**: 93 (via Gossip)
- **pNodes Responding**: 15 (pRPC enabled)
- **Auto-refresh**: Every 30 seconds
- **Response Time**: ~5 seconds (parallel API calls)

## 🏆 Superteam Bounty Details

- **Prize**: $5,000 (1st place), $1,500 (2nd), $1,000 (3rd)
- **Deadline**: January 9, 2026
- **Submission**: [Bounty Link](https://earn.superteam.fun/listing/build-analytics-platform-for-xandeum-pnodes)

## 🔮 Roadmap

- [ ] Deploy to Vercel
- [ ] Add historical data tracking
- [ ] Individual pNode detail pages
- [ ] Export to CSV functionality
- [ ] Email/Discord alerts for critical nodes
- [ ] Dark/Light mode toggle

## 👨‍💻 Author

**Ninja0x** - Freelance Web Developer, Digital Solutions Builder & Crypto Enthusiast

- 13 years in cryptocurrency 
- MBA in Marketing & Management
- Specialized in Next.js, React, and Web3 development

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- [Xandeum](https://xandeum.network) - For the innovative pNode network
- [Superteam](https://superteam.fun) - For organizing the bounty
- Xandeum Discord community - For technical support

---

**Built with ❤️ by Ninja0x for the Xandeum ecosystem**
