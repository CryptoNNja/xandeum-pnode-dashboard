# 🗄️ Database Schema & Migrations

Complete documentation for the Supabase PostgreSQL database schema used in the Xandeum pNode Analytics Dashboard.

---

## Overview

**Database:** PostgreSQL (via Supabase)  
**Migrations:** 13 migration files in `supabase/migrations/`  
**Total Tables:** 4 main tables  
**Retention:** 7-day rolling history  

---

## Main Tables

### 1. `pnodes` - Primary Node Data

**Purpose:** Stores all pNode information, stats, and scores.

```sql
CREATE TABLE pnodes (
  -- Identity
  ip TEXT PRIMARY KEY,
  pubkey TEXT,
  
  -- Network & Status
  network TEXT NOT NULL,              -- 'MAINNET' | 'DEVNET'
  status TEXT NOT NULL,               -- 'active' | 'gossip_only'
  version TEXT,
  
  -- Geolocation
  city TEXT,
  country TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  
  -- Stats (JSON)
  stats JSONB,                        -- All RPC stats
  
  -- Scoring
  confidence_score NUMERIC(5,2),      -- 0-100
  health_score NUMERIC(5,2),          -- 0-100
  performance_score NUMERIC(5,2),     -- 0-100
  
  -- Credits
  credits BIGINT DEFAULT 0,
  
  -- Tracking
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_gossip TIMESTAMP WITH TIME ZONE,
  failed_checks INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Stats JSONB Structure

```json
{
  "cpu_percent": 45.2,
  "ram_used": 8000000000,
  "ram_total": 16000000000,
  "storage_committed": 1000000000000,
  "storage_used": 500000000000,
  "storage_available": 500000000000,
  "file_size": 1000000000000,
  "total_bytes": 500000000000,
  "uptime": 2592000,
  "packets_sent": 1000000,
  "packets_received": 950000,
  "version": "v0.7.3"
}
```

#### Indexes

```sql
CREATE INDEX idx_pnodes_network ON pnodes(network);
CREATE INDEX idx_pnodes_status ON pnodes(status);
CREATE INDEX idx_pnodes_health_score ON pnodes(health_score DESC);
CREATE INDEX idx_pnodes_confidence_score ON pnodes(confidence_score DESC);
CREATE INDEX idx_pnodes_country ON pnodes(country);
CREATE INDEX idx_pnodes_last_seen ON pnodes(last_seen DESC);
CREATE INDEX idx_pnodes_pubkey ON pnodes(pubkey);
CREATE INDEX idx_pnodes_last_seen_gossip ON pnodes(last_seen_gossip);
CREATE UNIQUE INDEX idx_pnodes_ip_network ON pnodes(ip, network);
```

---

### 2. `pnode_history` - Time-Series Data

**Purpose:** Store 7-day historical snapshots for trend analysis.

```sql
CREATE TABLE pnode_history (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  network TEXT NOT NULL,
  
  -- Snapshot Time
  snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Key Metrics (snapshot)
  health_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  performance_score NUMERIC(5,2),
  
  -- Storage Metrics
  storage_committed BIGINT,
  storage_used BIGINT,
  storage_available BIGINT,
  
  -- Resource Usage
  cpu_percent NUMERIC(5,2),
  ram_used BIGINT,
  ram_total BIGINT,
  
  -- Uptime & Network
  uptime BIGINT,
  packets_sent BIGINT,
  packets_received BIGINT,
  
  -- Metadata
  version TEXT,
  status TEXT,
  
  -- Constraints
  UNIQUE(ip, snapshot_time)
);
```

#### Indexes

```sql
CREATE INDEX idx_pnode_history_ip ON pnode_history(ip);
CREATE INDEX idx_pnode_history_snapshot_time ON pnode_history(snapshot_time DESC);
CREATE INDEX idx_pnode_history_ip_time ON pnode_history(ip, snapshot_time DESC);
```

#### Retention Policy

```sql
-- Automatic cleanup via cron job
-- Deletes records older than 7 days
DELETE FROM pnode_history 
WHERE snapshot_time < NOW() - INTERVAL '7 days';
```

---

### 3. `network_metadata` - Network Aggregates

**Purpose:** Store network-level statistics and metadata.

```sql
CREATE TABLE network_metadata (
  id SERIAL PRIMARY KEY,
  
  -- Network Identifier
  network TEXT NOT NULL,              -- 'MAINNET' | 'DEVNET' | 'ALL'
  
  -- Node Counts
  total_nodes INTEGER NOT NULL,
  active_nodes INTEGER NOT NULL,
  gossip_nodes INTEGER NOT NULL,
  
  -- Storage Aggregates
  total_storage BIGINT,               -- Total committed storage
  total_storage_used BIGINT,          -- Total used storage
  avg_storage_per_node BIGINT,
  
  -- Health Metrics
  avg_health NUMERIC(5,2),
  avg_confidence NUMERIC(5,2),
  avg_performance NUMERIC(5,2),
  
  -- Uptime
  avg_uptime BIGINT,
  
  -- Version Distribution
  consensus_version TEXT,
  version_diversity INTEGER,          -- Number of unique versions
  
  -- Geographic
  countries_count INTEGER,
  cities_count INTEGER,
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Indexes

```sql
CREATE INDEX idx_network_metadata_network ON network_metadata(network);
CREATE INDEX idx_network_metadata_timestamp ON network_metadata(timestamp DESC);
```

---

### 4. `network_snapshots` - Daily Snapshots

**Purpose:** Store daily network snapshots for long-term trends.

```sql
CREATE TABLE network_snapshots (
  id SERIAL PRIMARY KEY,
  
  -- Date
  snapshot_date DATE NOT NULL,
  
  -- Network Breakdown
  total_nodes INTEGER,
  mainnet_nodes INTEGER,
  devnet_nodes INTEGER,
  
  -- Storage
  total_storage BIGINT,
  mainnet_storage BIGINT,
  devnet_storage BIGINT,
  
  -- Health
  avg_health NUMERIC(5,2),
  mainnet_avg_health NUMERIC(5,2),
  devnet_avg_health NUMERIC(5,2),
  
  -- Version Info
  top_version TEXT,
  version_count INTEGER,
  
  -- Geographic
  countries_count INTEGER,
  top_countries JSONB,                -- [{country: 'US', count: 120}, ...]
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(snapshot_date)
);
```

#### Indexes

```sql
CREATE INDEX idx_network_snapshots_date ON network_snapshots(snapshot_date DESC);
```

---

## Migrations

### Migration Files

Located in `supabase/migrations/`:

1. **`00_create_base_tables.sql`** - Create main tables (pnodes, pnode_history)
2. **`01_add_confidence_scoring.sql`** - Add confidence scoring columns
3. **`02_add_failed_checks.sql`** - Add failed_checks tracking
4. **`03_create_network_metadata.sql`** - Create network_metadata table
5. **`04_create_network_snapshots.sql`** - Create snapshots table
6. **`05_add_network_classification.sql`** - Add network classification logic
7. **`06_add_pubkey_support.sql`** - Add pubkey column (deprecated)
8. **`06_add_pubkey_support_fixed.sql`** - Fix pubkey support
9. **`07_restructure_primary_key.sql`** - Refactor primary key to (ip, network)
10. **`08_disable_rls.sql`** - Disable Row Level Security for API access
11. **`09_add_network_breakdown_to_snapshots.sql`** - Add MAINNET/DEVNET breakdown
12. **`10_add_last_seen_gossip_column_and_index.sql`** - Add gossip tracking
13. **`11_verify_and_fix_ip_unique_constraint.sql`** - Fix unique constraints
14. **`13_add_history_retention_policy.sql`** - Add automatic cleanup policy

### Running Migrations

**Option 1: Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run each migration file in numerical order

**Option 2: Supabase CLI**
```bash
supabase db push
```

---

## Queries

### Common Queries

#### Get All Active MAINNET Nodes
```sql
SELECT * FROM pnodes
WHERE network = 'MAINNET'
  AND status = 'active'
ORDER BY health_score DESC;
```

#### Get Top 10 Storage Providers
```sql
SELECT 
  ip,
  country,
  stats->>'storage_committed' as storage,
  health_score
FROM pnodes
WHERE status = 'active'
ORDER BY (stats->>'storage_committed')::BIGINT DESC
LIMIT 10;
```

#### Get 7-Day History for a Node
```sql
SELECT 
  snapshot_time,
  health_score,
  cpu_percent,
  ram_used,
  storage_used
FROM pnode_history
WHERE ip = '1.2.3.4'
  AND snapshot_time > NOW() - INTERVAL '7 days'
ORDER BY snapshot_time ASC;
```

#### Network Health Summary
```sql
SELECT 
  network,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
  AVG(health_score) as avg_health,
  SUM((stats->>'storage_committed')::BIGINT) as total_storage
FROM pnodes
GROUP BY network;
```

#### Geographic Distribution
```sql
SELECT 
  country,
  COUNT(*) as node_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM pnodes
WHERE status = 'active'
GROUP BY country
ORDER BY node_count DESC;
```

---

## Views

### Materialized Views (Planned)

```sql
-- Network Summary (Refreshed every 5 minutes)
CREATE MATERIALIZED VIEW network_summary AS
SELECT 
  network,
  COUNT(*) as total_nodes,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_nodes,
  SUM((stats->>'storage_committed')::BIGINT) as total_storage,
  AVG(health_score) as avg_health
FROM pnodes
GROUP BY network;

-- Refresh schedule (via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY network_summary;
```

---

## Functions & Triggers

### Auto-Update Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pnodes_updated_at 
  BEFORE UPDATE ON pnodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Automatic History Cleanup

```sql
CREATE OR REPLACE FUNCTION cleanup_old_history()
RETURNS void AS $$
BEGIN
  DELETE FROM pnode_history
  WHERE snapshot_time < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Scheduled via Vercel Cron (daily)
-- POST /api/cron/cleanup
```

---

## Performance Optimization

### Index Strategy

1. **Network & Status** - Frequently filtered
2. **Health Score** - Ordered lists
3. **Time-based** - History queries
4. **Composite** - (ip, snapshot_time) for joins

### Query Optimization

```sql
-- EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE
SELECT * FROM pnodes
WHERE network = 'MAINNET'
  AND health_score > 80;
```

### Partitioning (Future)

For larger datasets, partition `pnode_history` by month:

```sql
CREATE TABLE pnode_history_2025_01 
PARTITION OF pnode_history
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## Backup & Recovery

### Automated Backups

Supabase provides:
- **Daily backups** (retained for 7 days on free tier)
- **Point-in-time recovery** (paid plans)

### Manual Backup

```bash
# Export entire database
pg_dump -h db.YOUR_PROJECT.supabase.co \
  -U postgres -d postgres > backup.sql

# Restore
psql -h db.YOUR_PROJECT.supabase.co \
  -U postgres -d postgres < backup.sql
```

---

## Security

### Row Level Security (RLS)

Currently **disabled** for API access (migration 08):

```sql
ALTER TABLE pnodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pnode_history DISABLE ROW LEVEL SECURITY;
```

**Note:** Enable RLS in production with proper policies if needed.

### API Keys

Use different keys for different access levels:
- **Anon Key** - Public read access
- **Service Role Key** - Full access (keep secret!)

---

## Monitoring

### Key Metrics to Track

- **Table sizes** - Monitor growth
- **Query performance** - Slow query log
- **Index usage** - Unused indexes
- **Connection pool** - Active connections

### Supabase Dashboard

Monitor via Supabase Dashboard:
- Database → Statistics
- Database → Roles
- Database → Replication

---

## Related Documentation

- [API Reference](API.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
