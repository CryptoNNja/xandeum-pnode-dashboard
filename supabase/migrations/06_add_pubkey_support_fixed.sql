-- Migration: Add pubkey support and registry-only nodes (FIXED)
-- Date: 2026-01-16
-- Purpose: Support registry-first nodes and multi-node operator tracking

-- Step 1: Add pubkey column (nullable, will be populated later)
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS pubkey VARCHAR(255);

-- Step 2: Add source tracking column
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS source VARCHAR(20) 
  CHECK (source IN ('crawler', 'registry', 'both'));

-- Step 3: Add is_official flag
ALTER TABLE pnodes ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pnodes_pubkey ON pnodes(pubkey) WHERE pubkey IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pnodes_is_official ON pnodes(is_official) WHERE is_official = TRUE;
CREATE INDEX IF NOT EXISTS idx_pnodes_source ON pnodes(source);

-- Step 5: Create composite index for operator grouping
CREATE INDEX IF NOT EXISTS idx_pnodes_pubkey_ip ON pnodes(pubkey, ip) 
  WHERE pubkey IS NOT NULL AND ip IS NOT NULL;

-- Step 6: Backfill pubkeys from existing stats data (if available)
UPDATE pnodes 
SET pubkey = stats->>'identity' 
WHERE pubkey IS NULL 
  AND stats IS NOT NULL
  AND stats->>'identity' IS NOT NULL
  AND stats->>'identity' != '';

-- Step 7: Mark existing nodes as crawler-sourced
UPDATE pnodes
SET source = 'crawler'
WHERE source IS NULL AND ip IS NOT NULL;

COMMENT ON COLUMN pnodes.pubkey IS 'Node public key (identity) - permanent identifier, nullable for legacy data';
COMMENT ON COLUMN pnodes.source IS 'Data source: crawler (discovered), registry (official list), both (discovered + verified)';
COMMENT ON COLUMN pnodes.is_official IS 'True if node is in official Xandeum mainnet registry';
