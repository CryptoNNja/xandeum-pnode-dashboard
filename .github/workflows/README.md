# GitHub Actions - Xandeum pNodes Crawler

## 📋 Configuration

This workflow automatically runs the Xandeum crawler every **10 minutes**.

### 🔐 Required Secrets

Add these secrets to your GitHub repository:

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

2. Add these 2 secrets:

| Name | Value | Description |
|------|-------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase public (anon) key |

### ⏱️ Cron Frequency

**Current:** Every 10 minutes (`*/10 * * * *`)

**To change the frequency:**

```yaml
# Every 5 minutes
- cron: '*/5 * * * *'

# Every 15 minutes
- cron: '*/15 * * * *'

# Every hour
- cron: '0 * * * *'
```

### 🚀 Manual Trigger

You can run the crawler manually:

1. Go to **Actions** in GitHub
2. Click on **Xandeum pNodes Crawler**
3. Click **Run workflow** → **Run workflow**

### 📊 View Logs

1. **Actions** → Click on a run
2. Click on **crawl** job
3. Click on **Run pNodes crawler** step

You will see:
```
🚀 Starting Xandeum pNodes crawler...
📡 Discovering pNodes...
✅ Metadata discovery complete. Found X versions and Y pubkeys.
💾 Upserting XX pnodes to Supabase...
✅ Successfully upserted XX pnodes
✅ Crawler completed successfully!
```

### 💰 Cost

**100% FREE** on GitHub Actions (2000 minutes/month included)

- 1 run = ~2-3 minutes
- 6 runs/hour × 24h × 30d = ~12,960 minutes/month
- **Well within the free tier!**

### ⚠️ Limits

- **Timeout:** 10 minutes max per run
- If the crawler takes more than 10 min, optimize it or increase the timeout

### 🔧 Troubleshooting

**"Secrets not found" error:**
- Verify that you've added `SUPABASE_URL` and `SUPABASE_ANON_KEY` in GitHub secrets

**"npm ci failed" error:**
- Verify that your `package-lock.json` is up to date
- Commit and push changes

**Crawler timeout:**
- Increase `timeout-minutes: 15` in the workflow
- Or optimize the crawler to run faster
