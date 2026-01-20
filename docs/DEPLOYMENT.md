# 🚀 Deployment Guide

Complete guide for deploying the Xandeum pNode Analytics Dashboard to production.

---

## Quick Deploy to Vercel (Recommended)

### Prerequisites

- GitHub account
- Vercel account ([sign up free](https://vercel.com))
- Supabase account ([sign up free](https://supabase.com))
- Groq API key ([get free key](https://console.groq.com))

### Step-by-Step Deployment

#### 1. Fork & Clone Repository

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/xandeum-dashboard.git
cd xandeum-dashboard
```

#### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **API**
4. Copy your:
   - Project URL
   - Anon (public) key
   - Service role key

5. Go to **SQL Editor**
6. Run each migration from `supabase/migrations/` in order (00, 01, 02, etc.)

#### 3. Connect to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

#### 4. Configure Environment Variables

In Vercel project settings, add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Chatbot (optional)
GROQ_API_KEY=your_groq_api_key_here

# Security
CRON_SECRET=generate_random_32_char_string
BACKFILL_SECRET=generate_random_32_char_string
```

**Generate secrets:**
```bash
openssl rand -hex 32
```

#### 5. Configure Cron Jobs

Vercel will automatically detect `vercel.json` and set up cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the crawler **every 5 minutes**.

#### 6. Deploy

Click **"Deploy"** in Vercel.

Your dashboard will be live at:
```
https://your-project.vercel.app
```

---

## Manual Deployment (Alternative)

### Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm run start
```

Server runs on `http://localhost:3000`

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | `eyJhbGci...` |
| `CRON_SECRET` | Secret for cron endpoints | `random_32_chars` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for AI chatbot | (disabled) |
| `BACKFILL_SECRET` | Secret for backfill endpoint | same as CRON |
| `NODE_ENV` | Environment | `production` |

---

## Cron Jobs Setup

### Vercel Cron (Recommended)

Vercel automatically runs cron jobs defined in `vercel.json`.

**Current jobs:**
1. **Crawler** - Every 5 minutes
   - Path: `/api/cron/crawl`
   - Purpose: Discover & update pNodes

**Future jobs (add to vercel.json):**
2. **Cleanup** - Daily at midnight
   ```json
   {
     "path": "/api/cron/cleanup",
     "schedule": "0 0 * * *"
   }
   ```

3. **Daily Snapshot** - Daily at 1 AM
   ```json
   {
     "path": "/api/cron/snapshot",
     "schedule": "0 1 * * *"
   }
   ```

### Manual Cron (Linux/macOS)

If not using Vercel:

```bash
# Edit crontab
crontab -e

# Add crawler job (every 5 minutes)
*/5 * * * * curl -X POST https://your-domain.com/api/cron/crawl \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Add cleanup job (daily at midnight)
0 0 * * * curl -X POST https://your-domain.com/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Custom Domain

### Add Custom Domain in Vercel

1. Go to Vercel project settings
2. Navigate to **Domains**
3. Add your domain (e.g., `xandeum-analytics.com`)
4. Follow DNS configuration instructions
5. SSL certificate auto-provisioned

---

## Performance Optimization

### Next.js Configuration

**Already optimized in `next.config.ts`:**

```typescript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['your-cdn.com'],
  },
  
  // Compression
  compress: true,
  
  // Headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60' },
        ],
      },
    ];
  },
};
```

### Vercel Settings

- **Enable Edge Network** - Automatic
- **Enable Image Optimization** - Automatic
- **Enable Compression** - Automatic

---

## Monitoring & Logging

### Vercel Analytics

Enable in Vercel dashboard:
- **Web Analytics** - Page views, bounce rate
- **Speed Insights** - Core Web Vitals
- **Log Drain** - Stream logs to external service

### Error Tracking (Optional)

Integrate Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.config.ts
Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV,
});
```

---

## Scaling

### Current Capacity

- **Handles:** ~1000 concurrent users
- **API calls:** ~10,000 requests/hour
- **Database:** 10GB free on Supabase
- **Bandwidth:** Unlimited on Vercel

### Scaling Strategies

#### 1. Horizontal Scaling (Vercel)

Vercel auto-scales:
- Multiple regions
- Edge functions
- Load balancing

#### 2. Database Scaling (Supabase)

Upgrade Supabase plan:
- **Free:** 500MB database, 2GB bandwidth
- **Pro:** 8GB database, 50GB bandwidth
- **Team:** 100GB database, unlimited bandwidth

#### 3. Caching

Implement Redis for caching:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache network stats
await redis.setex('network-stats', 60, JSON.stringify(stats));
```

---

## Backup Strategy

### Database Backups

**Supabase:**
- Daily backups (7-day retention on free tier)
- Point-in-time recovery (paid plans)

**Manual backup:**
```bash
# Export database
npm run db:backup

# Or direct pg_dump
pg_dump -h db.PROJECT.supabase.co -U postgres > backup.sql
```

### Code Backups

- **GitHub** - Primary repository
- **Vercel** - Automatic deployment backups
- **Local** - Clone repository locally

---

## Security Checklist

### Before Production

- [ ] Environment variables set correctly
- [ ] `CRON_SECRET` is strong (32+ chars)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not exposed
- [ ] `.env.local` in `.gitignore`
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (sanitize inputs)

### Headers

Add security headers in `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      ],
    },
  ];
},
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Error:** `Module not found`

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Database Connection Fails

**Error:** `Could not connect to Supabase`

**Solution:**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify Supabase project is not paused
- Check network connectivity

#### 3. Cron Jobs Not Running

**Error:** `Cron job failed`

**Solution:**
- Verify `CRON_SECRET` matches in Vercel and code
- Check Vercel logs for errors
- Ensure `vercel.json` is in repository root

#### 4. AI Chatbot Not Working

**Error:** `Groq API error`

**Solution:**
- Verify `GROQ_API_KEY` is set
- Check Groq API quota
- Fallback: Chatbot gracefully disabled if key missing

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm run test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables prepared
- [ ] Database migrations ready
- [ ] Cron jobs configured

### Post-Deployment

- [ ] Site accessible at production URL
- [ ] Database connected and seeded
- [ ] Crawler running (check after 5 min)
- [ ] AI chatbot working (if enabled)
- [ ] All modals opening correctly
- [ ] Map displaying nodes
- [ ] PDF export working
- [ ] Mobile responsive
- [ ] Analytics tracking

---

## Alternative Hosting Platforms

### Railway

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Deploy
railway up
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Self-Hosted (Docker)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t xandeum-dashboard .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  xandeum-dashboard
```

---

## Cost Estimate

### Free Tier (Sufficient for Bounty)

- **Vercel:** Free (hobby plan)
- **Supabase:** Free (up to 500MB DB, 2GB bandwidth)
- **Groq:** Free (API rate limits apply)
- **Total:** $0/month

### Production (Recommended)

- **Vercel Pro:** $20/month
- **Supabase Pro:** $25/month
- **Groq:** Pay-as-you-go (~$5/month)
- **Total:** ~$50/month

---

## Related Documentation

- [API Reference](API.md)
- [Database Schema](DATABASE.md)
- [Architecture Overview](ARCHITECTURE.md)
