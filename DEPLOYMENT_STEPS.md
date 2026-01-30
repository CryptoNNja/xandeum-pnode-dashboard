# 🚀 Deployment Steps for PR #36 - Storage Network Breakdown

This PR requires a database migration before the application can be deployed.

## ⚠️ Important: Migration Required

The semi-real-time storage sparkline feature requires new columns in the `pnode_history` table.

## 📋 Step-by-Step Deployment

### 1. Apply Database Migration

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content from `supabase/migrations/15_add_storage_to_history.sql`
4. Click **Run** to execute the migration
5. Verify success (should show "Success. No rows returned")

#### Option B: Using Supabase CLI
```bash
# Login to Supabase (if not already)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

### 2. Regenerate TypeScript Types

After the migration is applied, regenerate the TypeScript types:

```bash
# Get your project ID from Supabase dashboard (Settings > General > Reference ID)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.mts
```

### 3. Verify Build Passes

```bash
npm run build
```

If successful, you should see:
```
✓ Compiled successfully
```

### 4. Deploy to Vercel

Once the build passes locally:

```bash
git push origin feat/storage-network-breakdown
```

Vercel will automatically deploy the changes.

### 5. Wait for Crawler Run

The sparkline will populate automatically after the next crawler run (every 30 minutes).

## 🔍 Verification

After deployment:

1. **Check the migration**: Query Supabase to verify columns exist
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'pnode_history' 
   AND column_name IN ('storage_committed', 'storage_used');
   ```

2. **Check data collection**: After 30 minutes, verify data is being saved
   ```sql
   SELECT COUNT(*) 
   FROM pnode_history 
   WHERE storage_committed IS NOT NULL 
   AND ts > EXTRACT(EPOCH FROM NOW() - INTERVAL '1 hour');
   ```

3. **Check the dashboard**: Visit the dashboard and hover over the sparkline in "Avg Committed/Pod" card

## 🎯 What This PR Adds

- **Network breakdown progress bars** showing MAINNET (green) vs DEVNET (yellow) distribution
- **Semi-real-time storage sparkline** showing 24-hour trend with 30-minute intervals
- **Interactive tooltip** displaying formatted storage values and timestamps
- **All Copilot review feedback** addressed (types, unused code, console.logs, etc.)

## ⏱️ Timeline

- **Migration**: ~30 seconds
- **Type regeneration**: ~10 seconds  
- **First data point**: After next crawler run (~30 minutes max)
- **Full sparkline**: 24 hours for complete 48-point trend

## 🆘 Troubleshooting

**Build fails with "storage_committed does not exist"**
- Ensure migration was applied successfully
- Regenerate types with correct project ID
- Restart your dev server

**Sparkline shows "📊 Collecting data..."**
- Normal if crawler hasn't run yet (wait up to 30 min)
- Check crawler is running: `curl YOUR_DOMAIN/api/crawler-status`
- Verify migration applied: Query shown in Verification section

**Values don't match**
- Sparkline uses historical data (30-min buckets)
- Card value is real-time from current crawl
- After 30 minutes, they should align
