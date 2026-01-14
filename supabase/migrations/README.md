# Supabase Migrations

This folder contains all SQL migrations to setup the database schema for the Xandeum pNode Analytics Platform.

## Setup Instructions

Execute these migrations **in order** in your Supabase SQL Editor:

### 1. Base Tables (Required First)
```sql
-- Run: supabase/migrations/00_create_base_tables.sql
```
Creates the main `pnodes` and `pnode_history` tables.

### 2. Confidence Scoring
```sql
-- Run: supabase/migrations/add_confidence_scoring.sql
```
Adds confidence scoring columns and indexes.

### 3. Failed Checks
```sql
-- Run: supabase/migrations/add_failed_checks.sql
```
Adds `failed_checks` column to track RPC failures.

### 4. Network Metadata
```sql
-- Run: supabase/migrations/create_network_metadata.sql
```
Creates `network_metadata` table for storing official API data.

### 5. Network Snapshots
```sql
-- Run: supabase/migrations/create_network_snapshots.sql
```
Creates `network_snapshots` table for daily analytics.

### 6. Network Classification
```sql
-- Run: supabase/migrations/20260112_add_network_classification.sql
```
Adds enhanced network classification columns.

## Quick Setup (Copy-Paste All)

For convenience, you can also copy and paste all migrations at once in this order:

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy-paste the content of each file in the order listed above
4. Run the query

## Schema Overview

**Main Tables:**
- `pnodes` - Current state of all pNodes
- `pnode_history` - Historical metrics for analytics
- `network_metadata` - Official API data (MAINNET registry)
- `network_snapshots` - Daily network statistics

**Key Columns:**
- `confidence_score` (0-100) - Multi-source validation score
- `network` - MAINNET, DEVNET, or NULL
- `status` - active, gossip_only, etc.
- `stats` (JSONB) - All node metrics (CPU, RAM, storage, uptime)

## Notes

- All migrations use `IF NOT EXISTS` - safe to run multiple times
- JSONB is used for flexible stats storage
- Indexes are optimized for dashboard queries
- Foreign keys ensure data integrity
