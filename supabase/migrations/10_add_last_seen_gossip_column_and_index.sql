-- Add last_seen_gossip column if it doesn't exist
-- This column stores the timestamp from get-pods-with-stats API (gossip protocol)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pnodes' AND column_name = 'last_seen_gossip'
    ) THEN
        ALTER TABLE pnodes ADD COLUMN last_seen_gossip TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Column last_seen_gossip added';
    ELSE
        RAISE NOTICE 'Column last_seen_gossip already exists';
    END IF;
END $$;

-- Add index on last_seen_gossip for optimized queries
-- This column is used for:
-- - Filtering zombie nodes in uptime leaderboard (WHERE last_seen_gossip > threshold)
-- - Validating data freshness in alerts system
-- - Detecting stale/isolated nodes

CREATE INDEX IF NOT EXISTS idx_pnodes_last_seen_gossip 
ON pnodes(last_seen_gossip DESC);

COMMENT ON COLUMN pnodes.last_seen_gossip IS 
'Timestamp from get-pods-with-stats API (gossip protocol) - indicates when node was last seen by gossip network peers. Used for zombie node detection and data freshness validation.';
